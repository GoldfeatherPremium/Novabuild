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

/** Suspend / restore / adjust credits / change role. All actions are audited. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const audit: Record<string, unknown> = {};

  if (typeof body.suspended === "boolean") {
    await supabase.from("profiles").update({
      suspended: body.suspended,
      suspension_reason: body.suspended ? String(body.reason ?? "Suspended by admin") : null,
    }).eq("id", params.id);
    audit.suspended = body.suspended;
  }

  if (typeof body.role === "string" && ["user", "admin"].includes(body.role)) {
    await supabase.from("profiles").update({ role: body.role }).eq("id", params.id);
    audit.role = body.role;
  }

  if (typeof body.creditAdjustment === "number" && body.creditAdjustment !== 0) {
    const { data, error } = await supabase.rpc("adjust_credits", {
      p_user_id: params.id,
      p_amount: body.creditAdjustment,
      p_reason: `admin_adjustment:${body.reason ?? ""}`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    audit.creditAdjustment = body.creditAdjustment;
    audit.newBalance = data;
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: admin.id,
    action: "user.update",
    target_type: "user",
    target_id: params.id,
    changes: audit,
  });

  return NextResponse.json({ ok: true });
}
