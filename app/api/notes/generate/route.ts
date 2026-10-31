import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/index";
import { spendCredits } from "@/lib/credits";
import type { ChatMessage } from "@/lib/ai/types";

const SYSTEM = `You are NOVA. Transform document text into structured notes that are faithful
to the source. Output JSON with shape: {"title": string, "content": string}
where content is Markdown with headings and bullet lists. Never invent facts.`;

/**
 * Generate structured notes from a document (optionally from a summary or a
 * specific passage ask).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    documentId?: string;
    instruction?: string;
  };
  if (!body.documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  const provider = getProvider();
  if (!provider) return NextResponse.json({ error: "AI_PROVIDER_NOT_CONFIGURED" }, { status: 503 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, status, extracted_text_available")
    .eq("id", body.documentId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (doc.status !== "completed" || !doc.extracted_text_available) {
    return NextResponse.json({ error: "document_not_processed" }, { status: 409 });
  }

  const spend = await spendCredits(user.id, "note_generate", { type: "document", id: doc.id });
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", doc.id)
    .order("idx", { ascending: true })
    .limit(150);
  const text = (chunks ?? []).map((c) => c.content).join("\n\n").slice(0, 40000);

  const instruction = body.instruction?.trim() ?? "Create comprehensive structured notes from this document.";
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `${instruction}\n\n---DOCUMENT START---\n${text}\n---DOCUMENT END---` },
  ];

  try {
    const result = await provider.chat({ messages, json: true, maxTokens: 2500 });
    let parsed: { title?: string; content?: string } = {};
    try {
      parsed = JSON.parse(result.content.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { title: doc.title, content: result.content };
    }

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1);
    const workspaceId = memberships?.[0]?.workspace_id;

    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        workspace_id: workspaceId,
        owner_id: user.id,
        title: parsed.title ?? `Notes on ${doc.title}`,
        content: parsed.content ?? result.content,
        document_id: doc.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    await supabase.rpc("adjust_credits", { p_user_id: user.id, p_amount: 2, p_reason: "refund_note_failed" });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
