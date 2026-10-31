import { createClient } from "@/lib/supabase/server";
import { getBillingProvider } from "@/lib/billing/provider";

/**
 * Server-side subscription helpers. Entitlements are NEVER derived from the
 * frontend — only from the subscriptions table, which is updated exclusively
 * by verified webhooks (or by admin).
 */
export async function ensureBillingCustomer(userId: string, email: string) {
  const supabase = createClient();
  const provider = getBillingProvider();
  if (!provider) return null;

  const { data: existing } = await supabase
    .from("billing_customers")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.provider_customer_id) return existing.provider_customer_id;

  const { customerId } = await provider.createCustomer({ email, userId });
  await supabase.from("billing_customers").insert({
    user_id: userId,
    provider_customer_id: customerId,
    provider: "stripe",
  });
  return customerId;
}

/** Get the user's effective plan from the database. */
export async function getPlanForUser(userId: string) {
  const supabase = createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const planId = sub?.status === "canceled" ? "free" : (sub?.plan_id ?? "free");
  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).maybeSingle();
  return {
    planId,
    plan,
    subscription: sub ?? null,
  };
}
