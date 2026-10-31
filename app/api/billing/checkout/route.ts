import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillingProvider } from "@/lib/billing/provider";
import { ensureBillingCustomer } from "@/lib/billing/subscriptions";
import { publicConfig } from "@/lib/env-public";

/** Create a Stripe checkout session for a selected plan. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const provider = getBillingProvider();
  if (!provider) {
    return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { planId?: string; interval?: "month" | "year" };
  const planId = body.planId;
  if (!["pro", "team"].includes(planId ?? "")) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  const interval = body.interval ?? "month";

  const envKey = (planId === "pro" ? "BILLING_PRICE_PRO_" : "BILLING_PRICE_TEAM_") +
    (interval === "year" ? "YEARLY" : "MONTHLY");
  const priceId = process.env[envKey];
  if (!priceId) {
    return NextResponse.json({ error: "BILLING_PRICE_MISSING", envKey }, { status: 503 });
  }

  const customerId = await ensureBillingCustomer(user.id, user.email ?? "");
  if (!customerId) {
    return NextResponse.json({ error: "BILLING_CUSTOMER_FAILED" }, { status: 500 });
  }

  const session = await provider.createCheckoutSession({
    customerEmail: user.email ?? "",
    priceId,
    successUrl: `${publicConfig.appUrl}/app/settings/billing?checkout=success&plan=${planId}`,
    cancelUrl: `${publicConfig.appUrl}/app/settings/billing?checkout=cancel`,
    metadata: { user_id: user.id, plan_id: planId },
  });

  return NextResponse.json({ url: session.url });
}
