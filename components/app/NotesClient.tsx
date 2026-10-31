"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  NotebookPen,
  Search,
  Pin,
  Trash2,
  Sparkles,
  Loader2,
  Check,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/components/app/Toast";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  document_id: string | null;
  project_id: string | null;
  updated_at: string;
}

interface DocOption {
  id: string;
  title: string;
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: { text: string; checked: boolean | null }[] = [];
  let key = 0;

  function flushPara() {
    if (para.length) {
      blocks.push(
        <p key={key++} className="text-[14px] leading-relaxed text-ink/85">
          {para.join(" ")}
        </p>
      );
      para = [];
    }
  }
  function flushList() {
    if (list.length) {
      blocks.push(
        <ul key={key++} className="flex flex-col gap-1">
          {list.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink/85">
              {item.checked !== null ? (
                <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", item.checked ? "border-violet bg-violet text-white" : "border-white/25")}>
                  {item.checked && <Check className="h-3 w-3" />}
                </span>
              ) : (
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-soft" />
              )}
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara(); flushList();
      blocks.push(<h4 key={key++} className="text-[14px] font-semibold text-violet-soft">{line.slice(4)}</h4>);
    } else if (line.startsWith("## ")) {
      flushPara(); flushList();
      blocks.push(<h3 key={key++} className="text-[16px] font-semibold text-ink">{line.slice(3)}</h3>);
    } else if (line.startsWith("# ")) {
      flushPara(); flushList();
      blocks.push(<h2 key={key++} className="font-serif text-[18px] font-semibold text-ink">{line.slice(2)}</h2>);
    } else if (line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
      flushPara();
      const checked = line[2].toLowerCase() === "x";
      list.push({ text: line.slice(6), checked });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      list.push({ text: line.slice(2), checked: null });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div className="flex flex-col gap-2.5">{blocks}</div>;
}

export default function NotesClient() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [docs, setDocs] = useState<DocOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genDoc, setGenDoc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    (async () => {
      const [notesRes, docsRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/documents"),
      ]);
      const nb = await notesRes.json().catch(() => ({}));
      const db = await docsRes.json().catch(() => ({}));
      const list = (nb.notes ?? []) as Note[];
      setNotes(list);
      setDocs(((db.documents ?? []) as DocOption[]).filter((d) => d.status === "completed"));
      setLoading(false);
      if (list.length > 0) {
        const n = list[0];
        setActiveId(n.id);
        setTitle(n.title);
        setContent(n.content);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return [...notes]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.updated_at) - +new Date(a.updated_at))
      .filter((n) => !ql || n.title.toLowerCase().includes(ql) || n.content.toLowerCase().includes(ql));
  }, [notes, q]);

  const persist = useCallback(async () => {
    if (!activeId || !dirty) return;
    setSaving(true);
    const res = await fetch(`/api/notes/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
    setDirty(false);
    if (res.ok) {
      setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, title, content, updated_at: new Date().toISOString() } : n)));
    }
  }, [activeId, dirty, title, content]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, persist]);

  function openNote(n: Note) {
    if (dirty) void persist();
    setActiveId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setDirty(false);
  }

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled note", content: "" }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.note) {
      setNotes((prev) => [body.note as Note, ...prev]);
      setActiveId(body.note.id);
      setTitle(body.note.title);
      setContent(body.note.content);
      setDirty(false);
      toast("Note created", "success");
    }
  }

  async function togglePin() {
    if (!activeId) return;
    const note = notes.find((n) => n.id === activeId);
    if (!note) return;
    await fetch(`/api/notes/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, pinned: !n.pinned } : n)));
  }

  async function removeNote() {
    if (!activeId) return;
    await fetch(`/api/notes/${activeId}`, { method: "DELETE" });
    const remaining = notes.filter((n) => n.id !== activeId);
    setNotes(remaining);
    setDeleteOpen(false);
    if (remaining.length) {
      const n = remaining[0];
      setActiveId(n.id);
      setTitle(n.title);
      setContent(n.content);
    } else {
      setActiveId(null);
      setTitle("");
      setContent("");
    }
    toast("Note deleted", "success");
  }

  async function generateNotes() {
    if (!genDoc) return;
    setGenerating(true);
    const res = await fetch("/api/notes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: genDoc }),
    });
    const body = await res.json().catch(() => ({}));
    setGenerating(false);
    setGenOpen(false);
    setGenDoc("");
    if (res.ok && body.note) {
      setNotes((prev) => [body.note as Note, ...prev]);
      setActiveId(body.note.id);
      setTitle(body.note.title);
      setContent(body.note.content);
      setDirty(false);
      toast("AI notes generated", "success");
    } else if (body.error === "AI_PROVIDER_NOT_CONFIGURED") {
      toast("AI provider not configured", "error");
    } else {
      toast(body.error ?? "Generation failed", "error");
    }
  }

  const active = notes.find((n) => n.id === activeId);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* List */}
      <aside className="flex w-full flex-col border-b border-white/[0.06] lg:w-80 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes…"
              className="h-9 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-[12.5px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50"
            />
          </div>
          <button type="button" onClick={createNote} aria-label="New note" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet/30 bg-violet/10 text-violet-soft hover:bg-violet/20">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-2 px-1">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-muted">
              {q ? "No matching notes." : "No notes yet. Create one or generate from a document."}
            </p>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNote(n)}
                className={cn(
                  "w-full rounded-xl px-3 py-3 text-left transition-colors",
                  activeId === n.id ? "bg-violet/10 ring-1 ring-violet/25" : "hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-2">
                  <NotebookPen className={cn("h-4 w-4 shrink-0", activeId === n.id ? "text-violet-soft" : "text-muted")} />
                  <span className={cn("truncate text-[13.5px] font-medium", activeId === n.id ? "text-ink" : "text-muted")}>{n.title || "Untitled note"}</span>
                  {n.pinned && <Pin className="h-3 w-3 shrink-0 text-violet-soft" />}
                </div>
                {n.content && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted/70">{n.content}</p>}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-white/[0.06] p-4">
          <button type="button" onClick={() => setGenOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-full border border-violet/30 bg-violet/10 py-2.5 text-[13px] font-semibold text-violet-soft transition-colors hover:bg-violet/20">
            <Sparkles className="h-4 w-4" /> Generate notes from a document
          </button>
        </div>
      </aside>

      {/* Editor */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet/25 bg-violet/10">
              <NotebookPen className="h-7 w-7 text-violet-soft" />
            </div>
            <h2 className="font-serif text-[22px] text-ink">Your notes</h2>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
              Capture ideas, attach them to documents and projects, and let AI turn research into structured notes.
            </p>
            <button type="button" onClick={createNote} className="btn-primary mt-6 px-6 py-3 text-[14px]">
              <Plus className="h-4 w-4" /> New note
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                {saving ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
                ) : dirty ? (
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Unsaved changes</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" /> All changes saved</span>
                )}
                <span className="text-muted/50">·</span>
                <span>Autosave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={togglePin} aria-label="Pin note" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-ink">
                  <Pin className={cn("h-4 w-4", active?.pinned && "text-violet-soft")} />
                </button>
                <button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete note" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-red-400/10 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-8">
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                placeholder="Note title"
                className="w-full bg-transparent font-serif text-[26px] font-semibold text-ink placeholder:text-muted/40 outline-none"
              />
              <div className="mt-1 text-[11.5px] text-muted/60">Markdown supported: # headings, - bullets, - [ ] checklists</div>
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setDirty(true); }}
                placeholder="Write your note…"
                className="mt-4 min-h-[40vh] w-full resize-y bg-transparent text-[14.5px] leading-relaxed text-ink/90 placeholder:text-muted/40 outline-none"
              />
              {content.trim() && (
                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Preview</div>
                  <Markdown text={content} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Generate modal */}
      <AnimatePresence>
        {genOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGenOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative w-full max-w-lg rounded-2xl border border-white/[0.10] bg-surface p-6 shadow-card"
            >
              <h2 className="text-[16px] font-semibold text-ink">Generate notes from a document</h2>
              <p className="mt-1.5 text-[13px] text-muted">NOVA reads the document and turns it into structured markdown notes. <span className="text-violet-soft">2 credits</span>.</p>
              <select value={genDoc} onChange={(e) => setGenDoc(e.target.value)} className="mt-4 h-11 w-full appearance-none rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 text-[14px] text-ink outline-none focus:border-violet/60">
                <option value="">Select a processed document…</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
              {docs.length === 0 && <p className="mt-2 text-[12px] text-amber-200/80">No processed documents yet — upload and process one first.</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setGenOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">Cancel</button>
                <button type="button" onClick={generateNotes} disabled={generating || !genDoc} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[14px] disabled:opacity-50">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={removeNote} title="Delete note?" description="This permanently deletes the note." confirmLabel="Delete" danger />
    </div>
  );
}
