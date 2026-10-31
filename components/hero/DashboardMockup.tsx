"use client";

import { motion } from "motion/react";
import {
  BarChart3,
  Check,
  FileText,
  Library,
  MessageSquareText,
  Network,
  NotebookPen,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Small shared bits                                                    */
/* ------------------------------------------------------------------ */

function FloatCard({
  className,
  children,
  duration = 6,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={`absolute z-20 ${className ?? ""}`}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
        className="w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.1] bg-[#0B0E1D]/85 p-4 shadow-card backdrop-blur-2xl ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function Glyph({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet/30 to-electric/25 text-violet-soft ring-1 ring-white/10 ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

const SIDEBAR = [
  { icon: Search, active: false },
  { icon: Library, active: true },
  { icon: FileText, active: false },
  { icon: NotebookPen, active: false },
  { icon: BarChart3, active: false },
  { icon: Settings, active: false },
];

const DOCS = [
  { type: "PDF", name: "Attention Is All You Need", meta: "Vaswani et al. · 2017", chip: "Summarized" },
  { type: "PDF", name: "Scaling Laws for Neural LMs", meta: "Kaplan et al. · 2020", chip: "In workspace" },
  { type: "DOC", name: "Transformer architecture notes", meta: "Your note · 3 min ago", chip: "Generated" },
];

const SUMMARY_POINTS = [
  "Transformer blocks replace recurrence entirely",
  "Attention scales quadratically with context",
  "Parallelization drives major training speedups",
];

/* ------------------------------------------------------------------ */
/* Main mockup                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      {/* Ambient glow behind window */}
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-violet/25 via-transparent to-electric/20 blur-3xl" />

      {/* Connection lines */}
      <svg
        aria-hidden
        className="absolute -inset-12 z-0 h-[calc(100%+6rem)] w-[calc(100%+6rem)] overflow-visible"
        viewBox="0 0 640 520"
        fill="none"
      >
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="640" y2="520" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8E7CFF" stopOpacity="0.7" />
            <stop offset="1" stopColor="#41A6FF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          d="M330 60 C 300 18, 210 8, 150 34"
          stroke="url(#flowGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="flow-line"
          opacity="0.6"
        />
        <path
          d="M620 220 C 662 200, 662 262, 600 286"
          stroke="url(#flowGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="flow-line"
          opacity="0.55"
        />
        <path
          d="M612 452 C 664 472, 662 504, 588 506"
          stroke="url(#flowGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="flow-line"
          opacity="0.5"
        />
        <path
          d="M92 468 C 38 490, 38 512, 84 516"
          stroke="url(#flowGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="flow-line"
          opacity="0.45"
        />
      </svg>

      {/* Main window */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0A0D1B]/90 shadow-card backdrop-blur-2xl"
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-muted">
              nova.app / r / neural-systems
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="flex flex-col items-center gap-1 border-r border-white/[0.06] px-2.5 py-4">
            {SIDEBAR.map(({ icon: Icon, active }, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-violet/25 text-violet-soft ring-1 ring-violet/40"
                    : "text-muted/70 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Workspace header */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
              <div>
                <p className="text-[13px] font-semibold text-ink">Neural Systems</p>
                <p className="text-[11px] text-muted">Literature review · 23 sources</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-3 pr-1.5 sm:flex">
                <Search className="h-3.5 w-3.5 text-muted" />
                <span className="text-[11px] text-muted">Search workspace…</span>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted">
                  ⌘K
                </span>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.15fr]">
              {/* Document list */}
              <div className="hidden flex-col gap-2 sm:flex">
                {DOCS.map((doc, i) => (
                  <div
                    key={i}
                    className={`group rounded-xl border p-3 transition-colors ${
                      i === 0
                        ? "border-violet/30 bg-violet/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-muted ring-1 ring-white/10">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-ink">{doc.name}</p>
                        <p className="mt-0.5 truncate text-[10.5px] text-muted">{doc.meta}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[9.5px] uppercase tracking-wider text-muted/70">{doc.type}</span>
                      <span className="rounded-full bg-gradient-to-r from-violet/25 to-electric/20 px-2 py-0.5 text-[10px] font-medium text-violet-soft">
                        {doc.chip}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reading pane */}
              <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[13.5px] font-semibold leading-snug text-ink">
                  Attention Is All You Need
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  Vaswani · Shazeer · Parmar et al. — 2017
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  {["PDF", "15 pages", "Transformer"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9.5px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Abstract skeleton */}
                <div className="mt-4 space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/[0.07]" />
                  <div className="h-1.5 w-[94%] rounded-full bg-white/[0.07]" />
                  <div className="h-1.5 w-[88%] rounded-full bg-white/[0.07]" />
                  <div className="h-1.5 w-[96%] rounded-full bg-white/[0.07]" />
                  <div className="h-1.5 w-[72%] rounded-full bg-white/[0.07]" />
                </div>

                {/* AI summary panel */}
                <div className="mt-4 rounded-lg border border-violet/25 bg-gradient-to-br from-violet/[0.14] to-electric/[0.08] p-3.5">
                  <div className="flex items-center gap-2">
                    <Glyph className="h-6 w-6 rounded-md">
                      <Sparkles className="h-3 w-3" />
                    </Glyph>
                    <p className="text-[12px] font-semibold text-ink">NOVA summary</p>
                    <span className="ml-auto text-[10px] text-violet-soft/80">4 key findings</span>
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {SUMMARY_POINTS.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-[11px] text-ink/80">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-violet-soft" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------------------- Floating cards -------------------- */}

      {/* A — Instant summaries */}
      <FloatCard className="left-0 top-0 w-52 -translate-x-6 -translate-y-8 lg:-translate-x-10" duration={6.5} delay={1.1}>
        <GlassCard>
          <div className="flex items-center gap-2.5">
            <Glyph>
              <Sparkles className="h-4 w-4" />
            </Glyph>
            <p className="text-[12.5px] font-semibold text-ink">Instant summaries</p>
          </div>
          <div className="mt-3 space-y-2">
            {["Method", "Findings", "Limitations"].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-violet-soft" />
                <span className="text-[11px] text-muted">{s}</span>
                <span className="ml-auto h-1.5 w-10 rounded-full bg-white/[0.08]" />
              </div>
            ))}
          </div>
        </GlassCard>
      </FloatCard>

      {/* B — Ask your documents */}
      <FloatCard className="right-0 top-[24%] w-56 translate-x-4 lg:-translate-x-6" duration={7.2} delay={1.6}>
        <GlassCard>
          <div className="flex items-center gap-2.5">
            <Glyph>
              <MessageSquareText className="h-4 w-4" />
            </Glyph>
            <p className="text-[12.5px] font-semibold text-ink">Ask your documents</p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg rounded-tr-sm bg-white/[0.05] px-3 py-2 text-[11px] text-ink/80">
              “What are the main limitations?”
            </div>
            <div className="rounded-lg rounded-tl-sm border border-violet/25 bg-violet/[0.12] px-3 py-2 text-[11px] text-ink/85">
              Quadratic attention cost limits long-context use…
            </div>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-violet-soft/80">
            <Check className="h-3 w-3" /> Answered in 1.2s
          </p>
        </GlassCard>
      </FloatCard>

      {/* C — Connected knowledge */}
      <FloatCard className="bottom-0 right-0 w-64 translate-x-4 translate-y-8 lg:-translate-x-4" duration={6} delay={2}>
        <GlassCard>
          <div className="flex items-center gap-2.5">
            <Glyph>
              <Network className="h-4 w-4" />
            </Glyph>
            <p className="text-[12.5px] font-semibold text-ink">Connected knowledge</p>
            <span className="ml-auto text-[10px] text-violet-soft/80">8 linked</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex gap-1.5">
              {["w-2 h-2", "w-2.5 h-2.5", "w-1.5 h-1.5", "w-2 h-2", "w-3 h-3"].map((s, i) => (
                <span
                  key={i}
                  className={`rounded-full ${
                    i === 4
                      ? "bg-gradient-to-br from-violet to-electric shadow-glow"
                      : "bg-white/[0.14]"
                  } ${s}`}
                />
              ))}
            </div>
            <div className="flex -space-x-1.5">
              {["from-violet/60", "from-electric/60", "from-lavender/50"].map((g, i) => (
                <span
                  key={i}
                  className={`h-5 w-5 rounded-full bg-gradient-to-br ${g} to-white/10 ring-2 ring-[#0B0E1D]`}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      </FloatCard>

      {/* D — Notes generated (xl only) */}
      <FloatCard className="bottom-10 left-0 hidden w-56 -translate-x-4 translate-y-6 xl:block" duration={7.6} delay={2.4}>
        <GlassCard>
          <div className="flex items-center gap-2.5">
            <Glyph>
              <NotebookPen className="h-4 w-4" />
            </Glyph>
            <p className="text-[12.5px] font-semibold text-ink">Note generated</p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-1.5 w-3/4 rounded-full bg-white/[0.08]" />
            <div className="h-1.5 w-full rounded-full bg-white/[0.08]" />
            <div className="h-1.5 w-5/6 rounded-full bg-white/[0.08]" />
          </div>
          <p className="mt-3 text-[10.5px] text-violet-soft/80">Saved to Workspace · Literature Review</p>
        </GlassCard>
      </FloatCard>
    </div>
  );
}
