import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") updates.title = body.title.slice(0, 200);
  if (typeof body.content === "string") updates.content = body.content;
  if (typeof body.pinned === "boolean") updates.pinned = body.pinned;
  if (typeof body.document_id === "string" || body.document_id === null) updates.document_id = body.document_id;
  if (typeof body.project_id === "string" || body.project_id === null) updates.project_id = body.project_id;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("notes").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
