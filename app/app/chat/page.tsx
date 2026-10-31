import { requireUser } from "@/lib/auth/guards";
import { getWorkspaceId } from "@/lib/app-data";
import { createClient } from "@/lib/supabase/server";
import ChatClient, { type ConversationItem, type DocItem, type MessageItem } from "@/components/app/ChatClient";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: { c?: string; docs?: string } }) {
  const user = await requireUser();
  const workspaceId = await getWorkspaceId(user.id);
  const supabase = createClient();

  const activeId = searchParams.c || null;
  const preSelectedDoc = searchParams.docs || null;

  const [convosRes, docsRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, pinned, archived, last_message_at, created_at")
      .eq("owner_id", user.id)
      .eq("archived", false)
      .order("last_message_at", { ascending: false })
      .limit(100),
    supabase
      .from("documents")
      .select("id, title, file_type, status")
      .eq("workspace_id", workspaceId ?? "")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const conversations = (convosRes.data ?? []) as ConversationItem[];
  const documents = (docsRes.data ?? []) as DocItem[];

  let activeMessages: MessageItem[] = [];
  let activeDocs: DocItem[] = [];

  if (activeId) {
    const [msgsRes, convDocsRes] = await Promise.all([
      supabase
        .from("messages")
        .select("id, role, content, citations, model, created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversation_documents")
        .select("document_id, documents(id, title, file_type, status)")
        .eq("conversation_id", activeId),
    ]);
    activeMessages = (msgsRes.data ?? []).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      citations: (m.citations as Citation[] | null) ?? [],
      model: m.model,
      created_at: m.created_at,
    }));
    activeDocs = (convDocsRes.data ?? [])
      .map((r) => r.documents)
      .filter(Boolean) as DocItem[];
  }

  return (
    <ChatClient
      conversations={conversations}
      documents={documents}
      activeId={activeId}
      initialMessages={activeMessages}
      initialActiveDocs={activeDocs}
    />
  );
}

interface Citation {
  index: number;
  documentId: string;
  documentTitle: string;
  passage: string;
  pageHint: number | null;
}
