import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data ?? [] });
}

/** Upsert plan pricing/limits/activity. */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    description?: string;
    price_monthly_cents?: number;
    price_yearly_cents?: number;
    monthly_credits?: number;
    ai_questions?: number;
    document_processing?: number;
    storage_bytes?: number;
    projects_allowed?: boolean;
    priority_processing?: boolean;
    active?: boolean;
    features?: string[];
  };

  if (!body.id) return NextResponse.json({ error: "plan id required" }, { status: 400 });

  const { data: plan, error } = await supabase.from("plans").upsert({
    id: body.id,
    name: body.name ?? body.id,
    description: body.description ?? "",
    price_monthly_cents: body.price_monthly_cents ?? 0,
    price_yearly_cents: body.price_yearly_cents ?? 0,
    monthly_credits: body.monthly_credits ?? 0,
    ai_questions: body.ai_questions ?? 0,
    document_processing: body.document_processing ?? 0,
    storage_bytes: body.storage_bytes ?? 0,
    projects_allowed: body.projects_allowed ?? false,
    priority_processing: body.priority_processing ?? false,
    active: body.active ?? true,
    features: body.features ?? [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_logs").insert({
    admin_id: admin.id,
    action: "plan.upsert",
    target_type: "plan",
    target_id: body.id,
    changes: { name: body.name },
  });

  return NextResponse.json({ plan });
}
