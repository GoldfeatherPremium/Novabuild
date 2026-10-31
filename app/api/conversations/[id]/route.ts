import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, title, pinned, archived, workspace_id, created_at, updated_at")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !conversation) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [docsRes, messagesRes] = await Promise.all([
    supabase
      .from("conversation_documents")
      .select("document_id, documents(id, title, file_type, status)")
      .eq("conversation_id", params.id),
    supabase
      .from("messages")
      .select("id, role, content, citations, model, created_at")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    conversation,
    documents: (docsRes.data ?? []).map((r) => r.documents).filter(Boolean),
    messages: messagesRes.data ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim().slice(0, 160);
  if (typeof body.pinned === "boolean") updates.pinned = body.pinned;
  if (typeof body.archived === "boolean") updates.archived = body.archived;

  const { error } = await supabase.from("conversations").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { error } = await supabase.from("conversations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
