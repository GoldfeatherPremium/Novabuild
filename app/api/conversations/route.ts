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
  const onlyPinned = url.searchParams.get("pinned") === "true";
  const onlyArchived = url.searchParams.get("archived") === "true";

  let query = supabase
    .from("conversations")
    .select("id, title, pinned, archived, last_message_at, created_at, owner_id")
    .eq("owner_id", user.id)
    .eq("archived", onlyArchived);

  if (onlyPinned) query = query.eq("pinned", true);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query.order("last_message_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    documentIds?: string[];
    firstQuestion?: string;
  };

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  const workspaceId = memberships?.[0]?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "no workspace" }, { status: 400 });

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      owner_id: user.id,
      title: body.title ?? "New conversation",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.documentIds?.length) {
    const rows = body.documentIds.map((documentId) => ({ conversation_id: conversation.id, document_id: documentId }));
    await supabase.from("conversation_documents").insert(rows);
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
