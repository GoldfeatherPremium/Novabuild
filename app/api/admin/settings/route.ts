import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { integrationStatus } from "@/lib/env";
import { aiStatus } from "@/lib/ai/index";

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return user;
}

/** System status + settings (integration health, storage check). */
export async function GET() {
  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: settings } = await supabase.from("system_settings").select("key, value");

  // Storage check: bucket reachable?
  const { data: buckets } = await supabase.storage.listBuckets();
  const documentsBucket = (buckets ?? []).find((b) => b.name === "documents");

  return NextResponse.json({
    integrations: integrationStatus(),
    ai: aiStatus(),
    storage: {
      configured: Boolean(documentsBucket),
      bucket: documentsBucket ? { name: documentsBucket.name, public: documentsBucket.public } : null,
    },
    settings: settings ?? [],
    serverTime: new Date().toISOString(),
  });
}

/** Update a system setting (admin only). */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { key?: string; value?: unknown };
  if (!body.key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const { error } = await supabase.from("system_settings").upsert({
    key: body.key,
    value: body.value ?? {},
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_logs").insert({
    admin_id: admin.id,
    action: "system_settings.update",
    target_type: "system_settings",
    target_id: body.key,
    changes: { key: body.key },
  });

  return NextResponse.json({ ok: true });
}
