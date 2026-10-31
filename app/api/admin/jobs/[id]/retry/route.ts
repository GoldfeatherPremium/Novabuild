import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { processDocument } from "@/lib/processing/pipeline";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: job } = await supabase
    .from("document_processing_jobs")
    .select("document_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  const result = await processDocument(job.document_id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  await supabase.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "job.retry",
    target_type: "job",
    target_id: params.id,
    changes: { documentId: job.document_id },
  });

  return NextResponse.json({ ok: true });
}
