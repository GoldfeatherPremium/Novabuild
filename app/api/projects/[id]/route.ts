import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("research_projects")
    .select("id, name, description, archived, workspace_id, created_at, updated_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: docs } = await supabase
    .from("project_documents")
    .select("documents(id, title, original_filename, file_type, status, created_at)")
    .eq("project_id", params.id);

  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, content, pinned, updated_at")
    .eq("project_id", params.id);

  const { data: workspaceConvos } = await supabase
    .from("conversations")
    .select("id, title, last_message_at, created_at")
    .eq("workspace_id", project.workspace_id)
    .eq("archived", false);

  return NextResponse.json({
    project,
    documents: (docs ?? []).map((r) => r.documents).filter(Boolean),
    notes: notes ?? [],
    conversations: workspaceConvos ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim().slice(0, 200);
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (typeof body.archived === "boolean") updates.archived = body.archived;

  const { error } = await supabase.from("research_projects").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  await supabase.from("project_documents").delete().eq("project_id", params.id);
  const { error } = await supabase.from("research_projects").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
