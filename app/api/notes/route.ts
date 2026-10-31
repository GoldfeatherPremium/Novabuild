import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase();

  let query = supabase
    .from("notes")
    .select("id, title, content, pinned, document_id, project_id, created_at, updated_at")
    .eq("owner_id", user.id);

  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
    documentId?: string | null;
    projectId?: string | null;
  };

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  const workspaceId = memberships?.[0]?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "no workspace" }, { status: 400 });

  const { data, error } = await supabase
    .from("notes")
    .insert({
      workspace_id: workspaceId,
      owner_id: user.id,
      title: body.title ?? "Untitled note",
      content: body.content ?? "",
      document_id: body.documentId ?? null,
      project_id: body.projectId ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}
