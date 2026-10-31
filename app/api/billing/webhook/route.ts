import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { publicConfig } from "@/lib/env-public";
import { billingConfig } from "@/lib/env";
import { createNotification } from "@/lib/notifications";

const ALLOWED_PLANS = ["free", "pro", "team"];
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

/**
 * Stripe webhook handler (TEST MODE until production keys are configured).
 *
 * Security:
 *  - signature verified with the webhook secret (HMAC-SHA256)
 *  - timestamp freshness enforced (replays rejected)
 *  - events processed idempotently (payment_transactions.provider_transaction_id
 *    unique; duplicate events short-circuit)
 *  - entitlements are written to the subscriptions table ONLY here — never
 *    from the frontend.
 */
export async function POST(req: NextRequest) {
  const cfg = billingConfig();
  if (!cfg.configured || !cfg.webhookSecret) {
    return NextResponse.json({ error: "BILLING_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !publicConfig.supabaseUrl) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!verifySignature(raw, signature, cfg.webhookSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    id: string;
    type: string;
    created: number;
    data: { object: Record<string, unknown> };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Replay protection: reject events older than the freshness window.
  const ageSeconds = (Date.now() / 1000) - (event.created ?? 0);
  if (Number.isNaN(ageSeconds) || ageSeconds > MAX_WEBHOOK_AGE_SECONDS) {
    return NextResponse.json({ error: "event too old" }, { status: 400 });
  }

  const supabase = createServiceClient(publicConfig.supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const obj = event.data.object;
        const userId = String((obj.metadata as Record<string, string> | undefined)?.user_id ?? "");
        const planId = String((obj.metadata as Record<string, string> | undefined)?.plan_id ?? "");
        const customerId = String(obj.customer ?? "");
        const subId = String(obj.subscription ?? "");
        const amount = Number(obj.amount_total ?? 0);

        if (!userId || !subId) break;

        // Idempotency: if this event was already recorded, acknowledge silently.
        const { data: existing } = await supabase
          .from("payment_transactions")
          .select("id")
          .eq("provider", "stripe")
          .eq("provider_transaction_id", event.id)
          .maybeSingle();
        if (existing) break;

        const safePlanId = ALLOWED_PLANS.includes(planId) ? planId : "pro";
        const periodStart = obj.current_period_start
          ? new Date(Number(obj.current_period_start) * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = obj.current_period_end
          ? new Date(Number(obj.current_period_end) * 1000).toISOString()
          : addMonths(new Date(), 1).toISOString();

        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan_id: safePlanId,
          status: "active",
          current_period_start: periodStart,
          current_period_end: periodEnd,
          provider: "stripe",
          provider_subscription_id: subId,
        }, { onConflict: "user_id" });
        if (error) throw new Error(error.message);

        if (customerId) {
          await supabase.from("billing_customers").upsert({
            user_id: userId,
            provider_customer_id: customerId,
            provider: "stripe",
          }, { onConflict: "user_id" });
        }

        if (amount > 0) {
          const { error: txError } = await supabase.from("payment_transactions").insert({
            user_id: userId,
            provider: "stripe",
            provider_transaction_id: event.id,
            type: "payment",
            amount_cents: amount,
            currency: String(obj.currency ?? "usd"),
            status: "succeeded",
            invoice_id: obj.invoice ? String(obj.invoice) : null,
            metadata: { plan_id: safePlanId },
          });
          if (txError) {
            // Unique violation => duplicate delivery; already handled above, but
            // race-safe: treat as processed and continue.
            if (!String(txError.message).includes("duplicate")) throw new Error(txError.message);
          }
        }

        await createNotification({
          userId,
          type: "payment_success",
          title: "Payment successful",
          body: `Your ${safePlanId} subscription is active.`,
        }, supabase);
        await createNotification({
          userId,
          type: "subscription_updated",
          title: "Plan updated",
          body: `You're now on the ${safePlanId} plan.`,
        }, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const obj = event.data.object;
        const subId = String(obj.subscription ?? "");
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("provider_subscription_id", subId)
          .maybeSingle();
        if (sub?.user_id) {
          await supabase.from("subscriptions").update({ status: "past_due" }).eq("user_id", sub.user_id);
          await createNotification({
            userId: sub.user_id,
            type: "payment_failed",
            title: "Payment failed",
            body: "We couldn't charge your card. Update your payment method to avoid interruption.",
          }, supabase);
        }
        break;
      }

      case "customer.subscription.updated": {
        const obj = event.data.object;
        const subId = String(obj.id ?? "");
        const status = String(obj.status ?? "");
        const cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);
        const currentPeriodEnd = obj.current_period_end
          ? new Date(Number(obj.current_period_end) * 1000).toISOString()
          : null;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("provider_subscription_id", subId)
          .maybeSingle();
        if (sub?.user_id) {
          await supabase.from("subscriptions").update({
            status: status === "active" ? "active" : status === "past_due" ? "past_due" : "canceled",
            cancel_at_period_end: cancelAtPeriodEnd,
            current_period_end: currentPeriodEnd,
          }).eq("user_id", sub.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const obj = event.data.object;
        const subId = String(obj.id ?? "");
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("provider_subscription_id", subId)
          .maybeSingle();
        if (sub?.user_id) {
          await supabase.from("subscriptions").update({
            status: "canceled",
            cancel_at_period_end: false,
          }).eq("user_id", sub.user_id);
          await createNotification({
            userId: sub.user_id,
            type: "subscription_updated",
            title: "Subscription canceled",
            body: "Your plan will remain active through the end of the billing period.",
          }, supabase);
        }
        break;
      }

      default:
        // Acknowledge all other events without action.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "webhook processing failed" },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
      const idx = p.indexOf("=");
      if (idx === -1) return acc;
      acc[p.slice(0, idx)] = p.slice(idx + 1);
      return acc;
    }, {});
    const v1 = parts.v1 ?? "";
    const t = parts.t ?? "";
    if (!v1 || !t) return false;
    const hmac = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
    const provided = Buffer.from(v1, "hex");
    return hmac.length === provided.length && timingSafeEqual(hmac, provided);
  } catch {
    return false;
  }
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
