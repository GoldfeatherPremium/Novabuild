import { createClient } from "@/lib/supabase/server";
import { CREDIT_COSTS, PLAN_CATALOG } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

/**
 * Server-side credit spending. Uses the atomic deduct_credits RPC; if the DB
 * is unreachable we fail closed (never overspend).
 */
export async function spendCredits(
  userId: string,
  operation: keyof typeof CREDIT_COSTS,
  ref?: { type: string; id: string }
) {
  const cost = CREDIT_COSTS[operation];
  if (cost <= 0) return { ok: true as const, balance: null as number | null };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_reason: operation,
    p_ref_type: ref?.type ?? null,
    p_ref_id: ref?.id ?? null,
  });

  if (error) {
    if (error.message.includes("insufficient_credits")) {
      await notifyLowCredits(userId);
      return { ok: false as const, error: "Insufficient credits. Upgrade your plan for more monthly credits." };
    }
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, balance: data as number };
}

async function notifyLowCredits(userId: string) {
  const supabase = createClient();
  const { data: account } = await supabase.from("credit_accounts").select("balance").eq("user_id", userId).maybeSingle();
  if ((account?.balance ?? 0) > 0) return;
  await createNotification({
    userId,
    type: "credit_low",
    title: "Monthly credits used up",
    body: "You've used all of this month's credits. Upgrade your plan or wait for the monthly reset.",
  });
}

export async function getCreditBalance(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("credit_accounts").select("balance, lifetime_units").eq("user_id", userId).maybeSingle();
  const { data: sub } = await supabase.from("subscriptions").select("plan_id, status").eq("user_id", userId).maybeSingle();
  const planId = (sub?.plan_id as keyof typeof PLAN_CATALOG) ?? "free";
  const plan = PLAN_CATALOG[planId] ?? PLAN_CATALOG.free;
  return {
    balance: data?.balance ?? 0,
    lifetime: data?.lifetime_units ?? 0,
    planId,
    monthlyAllowance: plan.monthlyCredits,
    nextReset: nextMonthReset(),
  };
}

function nextMonthReset() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

/** Usage summary for the dashboard. */
export async function getUsageOverview(userId: string) {
  const supabase = createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from("usage_records")
    .select("metric, units")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  const totals: Record<string, number> = {};
  for (const row of usage ?? []) {
    totals[row.metric] = (totals[row.metric] ?? 0) + row.units;
  }
  return totals;
}
