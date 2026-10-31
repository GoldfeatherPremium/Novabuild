import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { removeObject } from "@/lib/documents/storage";

async function ownDocument(supabase: ReturnType<typeof createClient>, id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("documents")
    .select("id, workspace_id, owner_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Rename / pin / move to folder / attach project / retag. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const doc = await ownDocument(supabase, params.id);
  if (!doc) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim().length >= 1) {
    updates.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.pinned === "boolean") updates.pinned = body.pinned;
  if (typeof body.folder_id === "string" || body.folder_id === null) updates.folder_id = body.folder_id;
  if (typeof body.project_id === "string" || body.project_id === null) updates.project_id = body.project_id;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("documents").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const doc = await ownDocument(supabase, params.id);
  if (!doc) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Remove storage object first (best-effort) then the row (RLS-owned).
  await removeObject(doc.storage_path).catch(() => {});
  const { error } = await supabase.from("documents").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
