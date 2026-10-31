import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Admin overview analytics — real aggregate queries only. */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 30);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const [totalUsers, activeUsers, newUsers, totalDocs, pendingJobs, failedJobs, aiUsage, revenue, subs, plans] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("document_processing_jobs").select("id", { count: "exact", head: true }).eq("status", "queued").or("status.eq.running"),
      supabase.from("document_processing_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("usage_records").select("units, metric").gte("created_at", sinceIso),
      supabase.from("payment_transactions").select("amount_cents, currency").eq("status", "succeeded").gte("created_at", sinceIso),
      supabase.from("subscriptions").select("plan_id, status"),
      supabase.from("plans").select("id, name, price_monthly_cents, active, sort_order").order("sort_order"),
    ]);

  const aiTotal = (aiUsage.data ?? []).reduce((acc, r) => acc + (r.units ?? 0), 0);
  const revenueCents = (revenue.data ?? []).reduce((acc, r) => acc + (r.amount_cents ?? 0), 0);

  const byPlan: Record<string, number> = {};
  for (const s of subs.data ?? []) {
    byPlan[s.plan_id] = (byPlan[s.plan_id] ?? 0) + 1;
  }

  // Registrations over time (last `days` days, bucketed daily).
  const { data: regRows } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", sinceIso);

  const registrations: Array<{ date: string; count: number }> = [];
  const counts = new Map<string, number>();
  for (const r of regRows ?? []) {
    const d = new Date(r.created_at).toISOString().slice(0, 10);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    registrations.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return NextResponse.json({
    totals: {
      users: totalUsers.count ?? 0,
      activeUsers: activeUsers.count ?? 0,
      newUsers: newUsers.count ?? 0,
      documents: totalDocs.count ?? 0,
      pendingJobs: pendingJobs.count ?? 0,
      failedJobs: failedJobs.count ?? 0,
      aiUnits: aiTotal,
      revenueCents,
    },
    byPlan,
    plans: plans.data ?? [],
    registrations,
  });
}
