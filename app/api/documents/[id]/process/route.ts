import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/processing/pipeline";

/** Retry processing for a failed document. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, workspace_id, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (doc.status === "processing" || doc.status === "queued") {
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
  }

  const result = await processDocument(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
