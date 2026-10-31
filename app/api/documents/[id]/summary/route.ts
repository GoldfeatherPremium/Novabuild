import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeDocument } from "@/lib/ai/summarize";
import { aiStatus } from "@/lib/ai/index";
import { spendCredits } from "@/lib/credits";
import { SUMMARY_TYPES, type SummaryType } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

type SummaryRow = {
  id: string;
  type: string;
  title: string;
  overview: string;
  sections: { heading: string; body: string }[];
  key_points: string[];
  model: string;
  created_at: string;
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, workspace_id, owner_id, title, status, extracted_text_available")
    .eq("id", params.id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (doc.status !== "completed" || !doc.extracted_text_available) {
    return NextResponse.json({ error: "Document has not finished processing" }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as { type?: string };
  const type = (SUMMARY_TYPES.some((s) => s.id === body.type) ? body.type : "short") as SummaryType;

  const ai = aiStatus();
  if (!ai.configured) {
    return NextResponse.json({ error: "AI_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  }

  // Charge credits first (atomic).
  const spend = await spendCredits(user.id, "summary", { type: "document", id: doc.id });
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  // Load the extracted text from the model chunks.
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", doc.id)
    .order("idx", { ascending: true })
    .limit(200);

  const text = (chunks ?? []).map((c) => c.content).join("\n\n");
  if (!text.trim()) {
    await supabase.rpc("adjust_credits", { p_user_id: user.id, p_amount: 5, p_reason: "refund_summary_no_text" });
    return NextResponse.json({ error: "No text available to summarize" }, { status: 409 });
  }

  try {
    const result = await summarizeDocument(text, type);

    const row: SummaryRow = {
      id: crypto.randomUUID(),
      type,
      title: `Summary of ${doc.title}`,
      overview: result.overview ?? "",
      sections: result.sections ?? [],
      key_points: result.key_points ?? [],
      model: result.model,
      created_at: new Date().toISOString(),
    };

    // Persist summary as JSON on the document row.
    const { error: updateError } = await supabase
      .from("documents")
      .update({ summary_available: true, summary: JSON.stringify(row) })
      .eq("id", doc.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await createNotification({
      userId: user.id,
      type: "ai_analysis_completed",
      title: `Summary ready for “${doc.title}”`,
      body: `Generated with ${result.model}.`,
      data: { documentId: doc.id },
    });

    return NextResponse.json({ summary: row });
  } catch (err) {
    const message = err instanceof Error && err.message === "AI_PROVIDER_NOT_CONFIGURED"
      ? "AI_PROVIDER_NOT_CONFIGURED"
      : "AI generation failed";
    if (message !== "AI_PROVIDER_NOT_CONFIGURED") {
      // Refund on provider failure — never charge for a failed op.
      await supabase.rpc("adjust_credits", { p_user_id: user.id, p_amount: 5, p_reason: "refund_summary_failed" });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "AI_PROVIDER_NOT_CONFIGURED" ? 503 : 502 }
    );
  }
}
