import { getProvider } from "@/lib/ai/index";
import type { ChatMessage, StructuredSummary } from "@/lib/ai/types";
import { SUMMARY_TYPES, type SummaryType } from "@/lib/constants";

const SYSTEM_PROMPT = `You are NOVA, an expert research assistant. You summarize academic and
professional documents faithfully. You never invent facts, citations, page
numbers, or findings that are not present in the provided text. If the text
does not contain the requested information, say so explicitly.`;

function summaryInstruction(type: SummaryType): string {
  const label = SUMMARY_TYPES.find((s) => s.id === type)?.label ?? "Concise summary";
  return `Produce a ${label} of the document text below. Output JSON with this exact shape:
{"title": string, "overview": string, "sections": [{"heading": string, "body": string}], "key_points": [string]}
Keep it accurate and grounded only in the provided text.`;
}

export interface SummaryOutput extends StructuredSummary {
  model: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

export async function summarizeDocument(
  text: string,
  type: SummaryType,
  maxChars = 60000
): Promise<SummaryOutput> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }

  const truncated = text.slice(0, maxChars);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `${summaryInstruction(type)}\n\n---DOCUMENT START---\n${truncated}\n---DOCUMENT END---` },
  ];

  const result = await provider.chat({ messages, json: true, maxTokens: 2500 });

  let parsed: StructuredSummary;
  try {
    const cleaned = result.content.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned) as StructuredSummary;
    if (!Array.isArray(parsed.sections)) parsed.sections = [];
    if (!Array.isArray(parsed.key_points)) parsed.key_points = [];
  } catch {
    // If the provider returned malformed JSON, degrade to a single section.
    parsed = {
      overview: result.content.slice(0, 2000),
      sections: [{ heading: "Summary", body: result.content }],
      key_points: [],
    };
  }

  return { ...parsed, model: result.model, usage: result.usage };
}
