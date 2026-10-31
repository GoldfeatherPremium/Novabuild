import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/ai/chat";
import { aiStatus } from "@/lib/ai/index";
import { spendCredits } from "@/lib/credits";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { content?: string };
  const question = body.content?.trim();
  if (!question) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Load the conversation + its documents + recent history.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, workspace_id, owner_id, title")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: docRows } = await supabase
    .from("conversation_documents")
    .select("document_id")
    .eq("conversation_id", params.id);
  const documentIds = (docRows ?? []).map((r) => r.document_id);
  if (documentIds.length === 0) {
    return NextResponse.json({ error: "Select at least one document to chat with" }, { status: 400 });
  }

  const ai = aiStatus();
  if (!ai.configured) {
    return NextResponse.json({ error: "AI_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  }

  // Charge credits atomically before doing the work.
  const spend = await spendCredits(user.id, "chat_question", { type: "conversation", id: params.id });
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  // Persist the user message.
  await supabase.from("messages").insert({
    conversation_id: params.id,
    role: "user",
    content: question,
  });

  // Build history for context.
  const { data: historyRows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", params.id)
    .neq("role", "system")
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (historyRows ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const answer = await answerQuestion({
      workspaceId: conversation.workspace_id,
      question,
      documentIds,
      history,
    });

    const { error } = await supabase.from("messages").insert({
      conversation_id: params.id,
      role: "assistant",
      content: answer.content,
      citations: answer.citations,
      model: answer.model,
      token_usage: answer.usage ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json({ answer: { ...answer, createdAt: new Date().toISOString() } });
  } catch (err) {
    const message = err instanceof Error && err.message === "AI_PROVIDER_NOT_CONFIGURED"
      ? "AI_PROVIDER_NOT_CONFIGURED"
      : "AI request failed";
    if (message !== "AI_PROVIDER_NOT_CONFIGURED") {
      await supabase.rpc("adjust_credits", { p_user_id: user.id, p_amount: 1, p_reason: "refund_chat_failed" });
      await createNotification({
        userId: user.id,
        type: "processing_failed",
        title: "AI request failed",
        body: message,
      });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "AI_PROVIDER_NOT_CONFIGURED" ? 503 : 502 }
    );
  }
}
