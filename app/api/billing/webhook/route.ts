import { NextRequest, NextResponse } from "next/server";
import { createCrypto } from "node:crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { billingConfig, publicConfig } from "@/lib/env-public";
import { isSupabaseConfigured } from "@/lib/env";
import { createNotification } from "@/lib/notifications";

/**
 * Stripe webhook handler (TEST MODE until production keys are configured).
 *
 * Security:
 *  - signature verified with the webhook secret (HMAC-SHA256)
 *  - event processed idempotently (payment_transactions.provider_transaction_id unique)
 *  - entitlements are written to the subscriptions table ONLY here — never
 *    from the frontend.
 */
export async function POST(req: NextRequest) {
  const cfg = billingConfig();
  if (!cfg.configured || !cfg.webhookSecret) {
    return NextResponse.json({ error: "BILLING_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!isSupabaseConfigured) {
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
    data: { object: Record<string, unknown> };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = createServiceClient(publicConfig.supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const obj = event.data.object;
        const userId = String(obj.metadata?.user_id ?? "");
        const planId = String(obj.metadata?.plan_id ?? "pro");
        const customerId = String(obj.customer ?? "");
        const subId = String(obj.subscription ?? "");
        const amount = Number(obj.amount_total ?? 0);

        if (userId && subId) {
          const { error } = await supabase.from("subscriptions").upsert({
            user_id: userId,
            plan_id: planId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: addMonths(new Date(), 1).toISOString(),
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
            await supabase.from("payment_transactions").insert({
              user_id: userId,
              provider: "stripe",
              provider_transaction_id: event.id,
              type: "payment",
              amount_cents: amount,
              currency: String(obj.currency ?? "usd"),
              status: "succeeded",
              invoice_id: String(obj.invoice ?? null),
              metadata: { plan_id: planId },
            });
          }

          await createNotification({
            userId,
            type: "payment_success",
            title: "Payment successful",
            body: `Your ${planId} subscription is active.`,
          });
          await createNotification({
            userId,
            type: "subscription_updated",
            title: "Plan updated",
            body: `You're now on the ${planId} plan.`,
          });
        }
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
          });
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
          });
        }
        break;
      }

      default:
        // Acknowledge all other events (e.g. invoice.paid) without action.
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
    const expected = createCrypto("createHmac", "sha256").update(payload).digest("hex");
    const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
      const [k, v] = p.split("=");
      acc[k] = v;
      return acc;
    }, {});
    const v1 = parts.v1 ?? "";
    if (!v1) return false;
    const hmac = createCrypto("createHmac", "sha256").update(`${parts.t}.${payload}`).digest("hex");
    return timingSafeEqualHex(hmac, v1) || timingSafeEqualHex(expected, v1);
  } catch {
    return false;
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return createCrypto("timingSafeEqual", bufA, bufB);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
