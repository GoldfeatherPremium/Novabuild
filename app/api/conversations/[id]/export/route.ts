import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, workspace_id, created_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: msgs } = await supabase
    .from("messages")
    .select("role, content, citations, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const lines: string[] = [`# ${conversation.title}`, `Exported from NOVA — ${new Date().toISOString()}`, ""];
  for (const m of msgs ?? []) {
    lines.push(`## ${m.role === "user" ? "You" : "NOVA"}`);
    lines.push(m.content);
    if (Array.isArray(m.citations) && m.citations.length > 0) {
      lines.push("");
      lines.push("Sources:");
      for (const c of m.citations as Array<{ documentTitle: string; pageHint: number | null }>) {
        lines.push(`- ${c.documentTitle}${c.pageHint ? ` (p. ${c.pageHint})` : ""}`);
      }
    }
    lines.push("");
  }

  const text = lines.join("\n");
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-conversation-${params.id.slice(0, 8)}.md"`,
    },
  });
}
