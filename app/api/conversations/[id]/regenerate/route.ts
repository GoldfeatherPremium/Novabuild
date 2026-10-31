import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/ai/chat";
import { aiStatus } from "@/lib/ai/index";
import { spendCredits } from "@/lib/credits";

/** Regenerate the last assistant message (same question + history). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, workspace_id, owner_id")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ai = aiStatus();
  if (!ai.configured) return NextResponse.json({ error: "AI_PROVIDER_NOT_CONFIGURED" }, { status: 503 });

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const list = messages ?? [];
  const lastUser = [...list].reverse().find((m) => m.role === "user");
  const lastAssistant = [...list].reverse().find((m) => m.role === "assistant");
  if (!lastUser) return NextResponse.json({ error: "nothing to regenerate" }, { status: 400 });

  const spend = await spendCredits(user.id, "regenerate", { type: "conversation", id: params.id });
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  const { data: docRows } = await supabase
    .from("conversation_documents")
    .select("document_id")
    .eq("conversation_id", params.id);
  const documentIds = (docRows ?? []).map((r) => r.document_id);

  // Strip the previous assistant response so the LLM regenerates it.
  const history = list
    .filter((m) => m.id !== lastAssistant?.id)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const answer = await answerQuestion({
      workspaceId: conversation.workspace_id,
      question: lastUser.content,
      documentIds,
      history,
    });

    let finalContent = answer.content;
    let finalCitations = answer.citations;
    if (lastAssistant) {
      // Secondary regenerate: keep the original on failure to avoid data loss.
      finalContent = answer.content || lastAssistant.content;
      finalCitations = answer.citations.length ? answer.citations : (lastAssistant.citations as never[]);
    }

    if (lastAssistant) {
      await supabase.from("messages").update({
        content: finalContent,
        citations: finalCitations,
        model: answer.model,
      }).eq("id", lastAssistant.id);
    } else {
      await supabase.from("messages").insert({
        conversation_id: params.id,
        role: "assistant",
        content: finalContent,
        citations: finalCitations,
        model: answer.model,
      });
    }

    return NextResponse.json({ answer: { ...answer, content: finalContent, citations: finalCitations } });
  } catch (err) {
    const message = err instanceof Error && err.message === "AI_PROVIDER_NOT_CONFIGURED"
      ? "AI_PROVIDER_NOT_CONFIGURED"
      : "AI request failed";
    if (message !== "AI_PROVIDER_NOT_CONFIGURED") {
      await supabase.rpc("adjust_credits", { p_user_id: user.id, p_amount: 1, p_reason: "refund_regenerate_failed" });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "AI_PROVIDER_NOT_CONFIGURED" ? 503 : 502 }
    );
  }
}
