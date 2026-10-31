import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillingProvider } from "@/lib/billing/provider";
import { publicConfig } from "@/lib/env-public";

/** Create a Stripe billing portal session (manage/upgrade/cancel). */
export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const provider = getBillingProvider();
  if (!provider) return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });

  const { data: customer } = await supabase
    .from("billing_customers")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.provider_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  const session = await provider.createPortalSession(
    customer.provider_customer_id,
    `${publicConfig.appUrl}/app/settings/billing`
  );
  return NextResponse.json({ url: session.url });
}
