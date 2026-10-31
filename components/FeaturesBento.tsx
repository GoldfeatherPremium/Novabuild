"use client";

import { motion } from "motion/react";
import {
  AlignLeft,
  FileSearch,
  LayoutGrid,
  MessageSquareText,
  Network,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUpItem, viewportOnce } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* Card shell                                                           */
/* ------------------------------------------------------------------ */

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUpItem} className="h-full">
      <div
        className={`card-hover group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] p-6 ${className ?? ""}`}
      >
        {children}
      </div>
    </motion.div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  blurb,
}: {
  icon: React.ElementType;
  title: string;
  blurb: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3.5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet/30 to-electric/25 text-violet-soft ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">{blurb}</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Document Intelligence                                        */
/* ------------------------------------------------------------------ */

function DocIntelligenceVisual() {
  const chips = ["Authors", "Methods", "Citations", "Results", "Limitations"];
  return (
    <div className="mt-6 flex flex-1 items-center gap-4">
      {/* Paper stack */}
      <div className="relative h-24 w-20 shrink-0">
        <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-3 rounded-lg border border-white/[0.08] bg-white/[0.03]" />
        <div className="absolute inset-0 translate-x-1 translate-y-1 -rotate-1 rounded-lg border border-white/[0.08] bg-white/[0.05]" />
        <div className="absolute inset-0 flex flex-col gap-1.5 rounded-lg border border-violet/25 bg-gradient-to-br from-violet/[0.15] to-electric/[0.08] p-2.5">
          <div className="h-1 w-8 rounded-full bg-white/[0.25]" />
          <div className="h-1 w-10 rounded-full bg-white/[0.15]" />
          <div className="h-1 w-9 rounded-full bg-white/[0.15]" />
          <div
            className="mt-auto h-1.5 w-full rounded-full bg-gradient-to-r from-violet to-electric animate-shimmer"
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>
      </div>

      {/* Extraction chips */}
      <div className="flex flex-1 flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <motion.span
            key={chip}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink/75"
          >
            {chip}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Instant Summaries                                            */
/* ------------------------------------------------------------------ */

function SummaryVisual() {
  return (
    <div className="mt-6 flex flex-1 flex-col justify-end">
      {/* Dimmed original lines */}
      <div className="space-y-1.5 opacity-45">
        <div className="h-1.5 w-full rounded-full bg-white/[0.1]" />
        <div className="h-1.5 w-[92%] rounded-full bg-white/[0.1]" />
        <div className="h-1.5 w-[86%] rounded-full bg-white/[0.1]" />
      </div>
      {/* Condensed result */}
      <div className="mt-3 rounded-xl border border-violet/25 bg-gradient-to-br from-violet/[0.14] to-electric/[0.08] p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-soft" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-soft/80">
            Summarized
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-1.5 w-4/5 rounded-full bg-white/[0.22]" />
          <div className="h-1.5 w-3/5 rounded-full bg-white/[0.18]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Ask Your Documents                                           */
/* ------------------------------------------------------------------ */

function AskVisual() {
  return (
    <div className="mt-6 flex flex-1 flex-col justify-end">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-ink/70">
        “Why does the paper propose multi-head attention?”
      </div>
      <div className="relative mt-2 rounded-xl rounded-tl-sm border border-violet/25 bg-violet/[0.12] px-3.5 py-3 text-[12px] leading-relaxed text-ink/85">
        Multiple heads let each focus on different subspaces — the key insight of the 2017 paper…
        <span className="absolute -left-1 top-0 h-3 w-3 -translate-y-1/2 rounded-full bg-violet shadow-glow animate-pulse-soft" />
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse-soft" />
        <span className="text-[11px] text-muted">Ask about this document…</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Connected Knowledge                                          */
/* ------------------------------------------------------------------ */

function GraphVisual() {
  const nodes = [
    { x: 96, y: 58, r: 9, core: true },
    { x: 42, y: 32, r: 5 },
    { x: 150, y: 34, r: 4.5 },
    { x: 30, y: 88, r: 4 },
    { x: 162, y: 90, r: 5.5 },
    { x: 96, y: 118, r: 4 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 3],
    [2, 4],
    [4, 5],
  ];
  return (
    <div className="mt-6 flex flex-1 items-center justify-center">
      <svg viewBox="0 0 200 140" className="h-full max-h-40 w-full" fill="none" aria-hidden>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={a === 0 || b === 0 ? "url(#graphCore)" : "rgba(255,255,255,0.1)"}
            strokeWidth={a === 0 || b === 0 ? 1.4 : 1}
            strokeDasharray={a === 0 || b === 0 ? "none" : "2 3"}
          />
        ))}
        <defs>
          <linearGradient id="graphCore" x1="0" y1="0" x2="200" y2="140">
            <stop stopColor="#8E7CFF" />
            <stop offset="1" stopColor="#41A6FF" />
          </linearGradient>
        </defs>
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.core ? "#7568FF" : "rgba(255,255,255,0.12)"}
            stroke={n.core ? "rgba(142,124,255,0.5)" : "rgba(255,255,255,0.08)"}
            strokeWidth={n.core ? 2 : 1}
            className={n.core ? "animate-pulse-soft" : ""}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Smart Note Generation                                        */
/* ------------------------------------------------------------------ */

function NoteVisual() {
  return (
    <div className="mt-6 flex flex-1 flex-col justify-end">
      <div className="relative rounded-xl border border-white/[0.09] bg-[#0C0F20] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet" />
            <span className="text-[12px] font-semibold text-ink">Attention mechanism — notes</span>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9.5px] text-muted">Draft</span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1.5 w-[92%] rounded-full bg-white/[0.1]" />
          <div className="h-1.5 w-[78%] rounded-full bg-white/[0.1]" />
        </div>
        {/* Polished overlay */}
        <div className="absolute inset-x-0 -bottom-3 mx-4 rounded-lg border border-violet/30 bg-gradient-to-br from-violet/[0.22] to-electric/[0.12] p-2.5 shadow-glow">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-violet-soft" />
            <span className="text-[10px] font-semibold text-violet-soft">Polished by NOVA</span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-white/[0.3]" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/[0.2]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual: Unified Workspace                                            */
/* ------------------------------------------------------------------ */

function WorkspaceVisual() {
  const panes = [
    { label: "Bibliography", h: "h-24", offset: "rotate-2 translate-y-2" },
    { label: "Notes", h: "h-28", offset: "-rotate-1 translate-y-1" },
    { label: "Chat", h: "h-24", offset: "rotate-1 translate-y-3" },
  ];
  return (
    <div className="mt-6 flex flex-1 items-end gap-2.5">
      {panes.map((pane, i) => (
        <div
          key={pane.label}
          className={`flex-1 rounded-t-xl border border-b-0 border-white/[0.08] bg-white/[0.03] p-2.5 ${pane.offset} ${pane.h} transition-all duration-500 group-hover:translate-y-0 group-hover:rotate-0`}
        >
          <p className="text-[10px] font-semibold text-muted">{pane.label}</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-white/[0.09]" />
            <div className="h-1.5 w-4/5 rounded-full bg-white/[0.09]" />
            <div className="h-1.5 w-3/5 rounded-full bg-white/[0.09]" />
            {i === 2 && (
              <div className="mt-2 rounded-md border border-violet/25 bg-violet/[0.12] p-1.5">
                <div className="h-1.5 w-full rounded-full bg-white/[0.2]" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export default function FeaturesBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet/[0.07] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything your research brain needs,
              <span className="font-serif italic text-gradient"> in one place.</span>
            </>
          }
          description="Six capabilities engineered to turn a drawer full of PDFs into a living, searchable body of knowledge."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid gap-4 md:grid-cols-6"
        >
          {/* 1 — Document Intelligence */}
          <Card className="md:col-span-6 lg:col-span-4">
            <CardHeader
              icon={FileSearch}
              title="AI Document Intelligence"
              blurb="Drop in any paper, PDF or web page. NOVA's engine parses structure, extracts entities and indexes every claim — so nothing gets lost in a wall of text."
            />
            <DocIntelligenceVisual />
          </Card>

          {/* 2 — Instant Summaries */}
          <Card className="md:col-span-3 lg:col-span-2">
            <CardHeader
              icon={AlignLeft}
              title="Instant Research Summaries"
              blurb="Long documents become crisp, structured briefs in seconds."
            />
            <SummaryVisual />
          </Card>

          {/* 3 — Ask Your Documents */}
          <Card className="md:col-span-3 lg:col-span-2">
            <CardHeader
              icon={MessageSquareText}
              title="Ask Your Documents"
              blurb="Ask questions in plain language and get answers grounded in your own sources."
            />
            <AskVisual />
          </Card>

          {/* 4 — Connected Knowledge */}
          <Card className="md:col-span-6 lg:col-span-4">
            <CardHeader
              icon={Network}
              title="Connected Knowledge"
              blurb="NOVA links related papers, concepts and your notes automatically — revealing the threads between ideas you never noticed."
            />
            <GraphVisual />
          </Card>

          {/* 5 — Smart Note Generation */}
          <Card className="md:col-span-3 lg:col-span-3">
            <CardHeader
              icon={NotebookPen}
              title="Smart Note Generation"
              blurb="Turn discussions and readings into structured, well-organized notes you can actually reuse."
            />
            <NoteVisual />
          </Card>

          {/* 6 — Unified Workspace */}
          <Card className="md:col-span-3 lg:col-span-3">
            <CardHeader
              icon={LayoutGrid}
              title="Unified Research Workspace"
              blurb="Bibliography, notes, chat and insights live together in one calm, organized home."
            />
            <WorkspaceVisual />
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
