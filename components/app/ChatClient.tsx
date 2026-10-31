"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquareText,
  Pin,
  PinOff,
  Trash2,
  Copy,
  Check,
  Download,
  RefreshCw,
  Send,
  Loader2,
  FileText,
  Sparkles,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Modal from "@/components/app/Modal";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import { useToast } from "@/components/app/Toast";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  last_message_at: string;
  created_at: string;
}

export interface DocItem {
  id: string;
  title: string;
  file_type: string;
  status: string;
}

export interface Citation {
  index: number;
  documentId: string;
  documentTitle: string;
  passage: string;
  pageHint: number | null;
}

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  model?: string | null;
  created_at: string;
}

interface Props {
  conversations: ConversationItem[];
  documents: DocItem[];
  activeId: string | null;
  initialMessages: MessageItem[];
  initialActiveDocs: DocItem[];
}

export default function ChatClient({ conversations, documents, activeId, initialMessages, initialActiveDocs }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [convos, setConvos] = useState<ConversationItem[]>(conversations);
  const [activeIdState, setActiveIdState] = useState<string | null>(activeId);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [activeDocs, setActiveDocs] = useState<DocItem[]>(initialActiveDocs);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [firstQuestion, setFirstQuestion] = useState("");
  const [creating, setCreating] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const completedDocs = useMemo(() => documents.filter((d) => d.status === "completed"), [documents]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function selectConversation(id: string) {
    setActiveIdState(id);
    router.push(`/app/chat?c=${id}`, { scroll: false });
    // The server page will re-render with that conversation's messages.
    window.location.href = `/app/chat?c=${id}`;
  }

  async function createConversation() {
    if (selectedDocs.length === 0) {
      toast("Select at least one document", "error");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: firstQuestion.trim() ? firstQuestion.trim().slice(0, 60) : "New conversation",
        documentIds: selectedDocs,
        firstQuestion: firstQuestion.trim() || undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok && body.conversation) {
      setNewOpen(false);
      setSelectedDocs([]);
      setFirstQuestion("");
      window.location.href = `/app/chat?c=${body.conversation.id}`;
    } else {
      toast(body.error ?? "Could not create conversation", "error");
    }
  }

  async function send() {
    const q = input.trim();
    if (!q || !activeIdState || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: "user", content: q, created_at: new Date().toISOString() }]);
    const res = await fetch(`/api/conversations/${activeIdState}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: q }),
    });
    const body = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok && body.answer) {
      setMessages((prev) => [
        ...prev.filter((m) => !m.id.startsWith("tmp-")),
        { id: `ans-${Date.now()}`, role: "assistant", content: body.answer.content, citations: body.answer.citations ?? [], model: body.answer.model, created_at: body.answer.createdAt ?? new Date().toISOString() },
      ]);
    } else if (body.error === "AI_PROVIDER_NOT_CONFIGURED") {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "The AI provider isn't configured yet. Add AI_API_KEY and model variables, then try again.", created_at: new Date().toISOString() },
      ]);
      toast("AI not configured", "error");
    } else {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("tmp-")));
      setInput(q);
      toast(body.error ?? "Request failed", "error");
    }
  }

  async function regenerate() {
    if (!activeIdState || regenerating) return;
    setRegenerating(true);
    const res = await fetch(`/api/conversations/${activeIdState}/regenerate`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setRegenerating(false);
    if (res.ok && body.answer) {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant") {
            next[i] = { ...next[i], content: body.answer.content, citations: body.answer.citations?.length ? body.answer.citations : next[i].citations, model: body.answer.model };
            break;
          }
        }
        return next;
      });
      toast("Response regenerated", "success");
    } else {
      toast(body.error ?? "Regenerate failed", "error");
    }
  }

  async function togglePin(c: ConversationItem) {
    const res = await fetch(`/api/conversations/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    if (res.ok) {
      setConvos((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned: !c.pinned } : x)));
    }
  }

  async function removeConversation() {
    if (!activeIdState) return;
    await fetch(`/api/conversations/${activeIdState}`, { method: "DELETE" });
    setDeleteOpen(false);
    setConvos((prev) => prev.filter((x) => x.id !== activeIdState));
    setActiveIdState(null);
    setMessages([]);
    router.push("/app/chat", { scroll: false });
    window.location.href = "/app/chat";
  }

  async function renameConversation() {
    if (!activeIdState || !renameTitle.trim()) return;
    const res = await fetch(`/api/conversations/${activeIdState}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameTitle.trim() }),
    });
    if (res.ok) {
      setConvos((prev) => prev.map((x) => (x.id === activeIdState ? { ...x, title: renameTitle.trim() } : x)));
      setRenameOpen(false);
      toast("Conversation renamed", "success");
    }
  }

  function copyMessage(m: MessageItem) {
    navigator.clipboard.writeText(m.content).then(() => {
      setCopied(m.id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 lg:flex-row">
      {/* Conversation list */}
      <aside className="flex w-full flex-col border-b border-white/[0.06] lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Conversations</span>
          <button
            type="button"
            onClick={() => { setNewOpen(true); setActiveDocs([]); }}
            aria-label="New conversation"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-violet/30 bg-violet/10 text-violet-soft hover:bg-violet/20"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {convos.length === 0 && (
            <p className="px-3 py-6 text-center text-[12.5px] text-muted">
              No conversations yet. Start one by selecting documents.
            </p>
          )}
          {convos.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => selectConversation(c.id)}
              onKeyDown={(e) => e.key === "Enter" && selectConversation(c.id)}
              className={cn(
                "group cursor-pointer rounded-xl px-3 py-2.5 transition-colors",
                activeIdState === c.id ? "bg-violet/10 ring-1 ring-violet/25" : "hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquareText className={cn("h-4 w-4 shrink-0", activeIdState === c.id ? "text-violet-soft" : "text-muted")} />
                <span className={cn("truncate text-[13.5px] font-medium", activeIdState === c.id ? "text-ink" : "text-muted")}>{c.title}</span>
                {c.pinned && <Pin className="h-3 w-3 shrink-0 text-violet-soft" />}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {!activeIdState ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet/25 bg-violet/10">
              <Sparkles className="h-7 w-7 text-violet-soft" />
            </div>
            <h2 className="font-serif text-[22px] text-ink">Ask your documents anything</h2>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
              Select a conversation or start a new one grounded in your uploaded research. Answers include citations to real passages.
            </p>
            <button type="button" onClick={() => setNewOpen(true)} className="btn-primary mt-6 px-6 py-3 text-[14px]">
              <Plus className="h-4 w-4" /> New conversation
            </button>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-ink">{convos.find((c) => c.id === activeIdState)?.title ?? "Conversation"}</h2>
                {activeDocs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {activeDocs.slice(0, 4).map((d) => (
                      <span key={d.id} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-muted">
                        <FileText className="h-3 w-3" /> {d.title}
                      </span>
                    ))}
                    {activeDocs.length > 4 && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted">+{activeDocs.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { const c = convos.find((x) => x.id === activeIdState); if (c) togglePin(c); }}
                  aria-label="Pin conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-ink"
                >
                  {convos.find((x) => x.id === activeIdState)?.pinned ? <Pin className="h-4 w-4 text-violet-soft" /> : <PinOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setRenameTitle(convos.find((x) => x.id === activeIdState)?.title ?? ""); setRenameOpen(true); }}
                  aria-label="Rename conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <a
                  href={`/api/conversations/${activeIdState}/export`}
                  aria-label="Export conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-ink"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Delete conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-red-400/10 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[85%] lg:max-w-[75%]", m.role === "user" ? "order-2" : "")}>
                      <div
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-[14px] leading-relaxed",
                          m.role === "user"
                            ? "border-violet/25 bg-violet/10 text-ink"
                            : "border-white/[0.08] bg-white/[0.02] text-ink/90"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                      {m.role === "assistant" && (m.citations?.length ?? 0) > 0 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedCitations((prev) => (prev === m.id ? null : m.id))}
                            className="text-[12px] font-medium text-violet-soft hover:text-ink"
                          >
                            {expandedCitations === m.id ? "Hide sources" : `View ${m.citations!.length} source${m.citations!.length > 1 ? "s" : ""}`}
                          </button>
                          {expandedCitations === m.id && m.citations && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2 flex flex-col gap-2 overflow-hidden"
                            >
                              {m.citations.map((c) => (
                                <div key={c.index} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-[12.5px] font-semibold text-ink">
                                      [{c.index}] {c.documentTitle}
                                    </span>
                                    {c.pageHint && <span className="shrink-0 text-[11px] text-muted">p. {c.pageHint}</span>}
                                  </div>
                                  <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted">{c.passage}</p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 px-1">
                        <span className="text-[11px] text-muted/70">
                          {m.role === "user" ? "You" : `NOVA ${m.model ? `· ${m.model}` : ""}`}
                        </span>
                        {m.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => copyMessage(m)}
                            aria-label="Copy answer"
                            className="text-muted/70 hover:text-ink"
                          >
                            {copied === m.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13.5px] text-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-electric-bright" />
                    Searching your documents…
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-white/[0.06] p-4">
              <div className="flex items-end gap-2">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="Ask a question about the selected documents…"
                  className="flex-1 resize-none rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-[14px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/15"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet to-electric text-white transition-transform hover:scale-105 disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                </button>
              </div>
              {messages.some((m) => m.role === "assistant") && (
                <div className="mt-2 flex items-center gap-2 px-1">
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} />
                    Regenerate last response
                  </button>
                  <span className="text-[11px] text-muted/60">Answers are grounded in your documents. Verify citations.</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* New conversation modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New conversation" wide>
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px] text-muted">
            Select the documents to ground this conversation. Answers will be retrieved only from these documents.
          </p>
          {completedDocs.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[13px] text-amber-200/90">
              <AlertCircle className="h-4 w-4 shrink-0" />
              You need at least one processed document to chat. Upload and process a document first.
            </div>
          ) : (
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {completedDocs.map((d) => {
                const checked = selectedDocs.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDocs((prev) => (checked ? prev.filter((x) => x !== d.id) : [...prev, d.id]))}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      checked ? "border-violet/40 bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors", checked ? "border-violet bg-violet text-white" : "border-white/20")}>
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate text-[13px] font-medium text-ink">{d.title}</span>
                  </button>
                );
              })}
            </div>
          )}
          <textarea
            value={firstQuestion}
            onChange={(e) => setFirstQuestion(e.target.value)}
            rows={2}
            placeholder="Optional: ask a first question (e.g. “What are the main findings?”)"
            className="resize-none rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setNewOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">
              Cancel
            </button>
            <button type="button" onClick={createConversation} disabled={creating || selectedDocs.length === 0} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start conversation"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename conversation">
        <div className="flex flex-col gap-4">
          <input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            className="h-11 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 text-[14.5px] text-ink outline-none focus:border-violet/60"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRenameOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">
              Cancel
            </button>
            <button type="button" onClick={renameConversation} className="btn-primary px-5 py-2.5 text-[14px]">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={removeConversation}
        title="Delete conversation?"
        description="This permanently deletes the conversation and its messages."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
