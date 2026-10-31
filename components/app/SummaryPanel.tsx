"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, Download, NotebookPen, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { SUMMARY_TYPES, type SummaryType } from "@/lib/constants";
import { useToast } from "@/components/app/Toast";
import { motion, AnimatePresence } from "motion/react";

export interface SummaryData {
  id: string;
  type: string;
  title: string;
  overview: string;
  sections: { heading: string; body: string }[];
  key_points: string[];
  model: string;
  created_at: string;
}

export default function SummaryPanel({
  documentId,
  documentTitle,
  existing,
  credits,
}: {
  documentId: string;
  documentTitle: string;
  existing: SummaryData | null;
  credits: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<SummaryType>("short");
  const [summary, setSummary] = useState<SummaryData | null>(existing);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/documents/${documentId}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && body.summary) {
      setSummary(body.summary);
      toast("Summary generated", "success");
      router.refresh();
    } else if (body.error === "AI_PROVIDER_NOT_CONFIGURED") {
      setError("The AI provider isn't configured. Add AI_API_KEY + model env vars in settings.");
    } else {
      setError(body.error ?? "Generation failed");
    }
  }

  function copySummary() {
    if (!summary) return;
    const text = [
      summary.title,
      "",
      summary.overview,
      "",
      ...summary.sections.flatMap((s) => [`## ${s.heading}`, s.body, ""]),
      "Key points:",
      ...summary.key_points.map((k) => `- ${k}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  function downloadSummary() {
    if (!summary) return;
    const text = [
      summary.title,
      "",
      summary.overview,
      "",
      ...summary.sections.flatMap((s) => [`## ${s.heading}`, s.body, ""]),
      "Key points:",
      ...summary.key_points.map((k) => `- ${k}`),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/[^\w-]+/g, "_")}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveAsNote() {
    if (!summary) return;
    setSavingNote(true);
    const content = [
      summary.overview,
      "",
      ...summary.sections.flatMap((s) => [`## ${s.heading}`, s.body, ""]),
      "**Key points**",
      ...summary.key_points.map((k) => `- ${k}`),
    ].join("\n");
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: summary.title, content, documentId }),
    });
    setSavingNote(false);
    if (res.ok) {
      toast("Saved as note", "success");
    } else {
      toast("Could not save note", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-violet-soft" />
          <span className="text-[13.5px] font-semibold text-ink">Summarize with AI</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SummaryType)}
            aria-label="Summary type"
            className="h-9 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-[13px] text-ink outline-none focus:border-violet/50"
          >
            {SUMMARY_TYPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">5 credits · {credits} available</span>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="btn-primary h-10 px-5 text-[13.5px] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : summary ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {summary ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!summary ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.10] px-6 py-14 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet/10 ring-1 ring-violet/25">
              <Sparkles className="h-6 w-6 text-violet-soft" />
            </div>
            <p className="text-[15px] font-semibold text-ink">No summary yet</p>
            <p className="mt-1.5 max-w-sm text-[13.5px] text-muted">
              Pick a format and generate a grounded summary of this document. Summaries are stored on the document and can be exported or saved as notes.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={summary.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-[20px] leading-snug text-ink">{summary.title}</h3>
                <p className="mt-1 text-[12px] text-muted">
                  {summary.type.replace(/_/g, " ")} · {summary.model} · {new Date(summary.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={copySummary} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[12.5px] font-medium text-ink hover:bg-white/5">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button type="button" onClick={downloadSummary} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[12.5px] font-medium text-ink hover:bg-white/5">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button type="button" onClick={saveAsNote} disabled={savingNote} className="flex items-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 px-3.5 py-2 text-[12.5px] font-medium text-violet-soft hover:bg-violet/20 disabled:opacity-60">
                  {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <NotebookPen className="h-3.5 w-3.5" />}
                  Save as note
                </button>
              </div>
            </div>

            {summary.overview && <p className="text-[14.5px] leading-relaxed text-ink/85">{summary.overview}</p>}

            {summary.sections.length > 0 && (
              <div className="mt-5 flex flex-col gap-4">
                {summary.sections.map((s, i) => (
                  <div key={i}>
                    <h4 className="mb-1.5 text-[14px] font-semibold text-violet-soft">{s.heading}</h4>
                    <p className="text-[14px] leading-relaxed text-ink/80">{s.body}</p>
                  </div>
                ))}
              </div>
            )}

            {summary.key_points.length > 0 && (
              <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Key points</h4>
                <ul className="flex flex-col gap-1.5">
                  {summary.key_points.map((k, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-ink/85">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-soft" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
