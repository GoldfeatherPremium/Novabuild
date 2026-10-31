import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
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
  const q = url.searchParams.get("q")?.toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const perPage = 25;

  let query = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, onboarded, created_at, updated_at, suspended, suspension_reason, email", { count: "exact" });

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const from = (page - 1) * perPage;
  const { data: users, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach subscription + credit info.
  const userIds = (users ?? []).map((u) => u.id);
  const [subsRes, creditsRes] = await Promise.all([
    userIds.length ? supabase.from("subscriptions").select("user_id, plan_id, status").in("user_id", userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("credit_accounts").select("user_id, balance").in("user_id", userIds) : Promise.resolve({ data: [] }),
  ]);

  const subMap = new Map((subsRes.data ?? []).map((s) => [s.user_id, s]));
  const creditMap = new Map((creditsRes.data ?? []).map((c) => [c.user_id, c]));

  const enriched = (users ?? []).map((u) => ({
    ...u,
    subscription: subMap.get(u.id) ?? null,
    credits: creditMap.get(u.id)?.balance ?? 0,
  }));

  return NextResponse.json({ users: enriched, total: count ?? 0, page, perPage });
}
