"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Check,
  Copy,
  FileText,
  Library,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { Reveal } from ".";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tab content data                                                     */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "library", label: "Library", icon: Library },
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "ask", label: "Ask", icon: MessageSquareText },
  { id: "insights", label: "Insights", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

const LIBRARY = [
  { type: "PDF", name: "Attention Is All You Need", meta: "Vaswani et al. · 2017", chip: "Summarized" },
  { type: "PDF", name: "Scaling Laws for Neural LMs", meta: "Kaplan et al. · 2020", chip: "In workspace" },
  { type: "PDF", name: "A Survey of Transformer Architectures", meta: "Lin et al. · 2021", chip: "Summarized" },
  { type: "URL", name: "Anthropic — Constitutional AI post", meta: "Web page · saved today", chip: "Indexed" },
  { type: "DOC", name: "Literature review notes · Week 4", meta: "Your note", chip: "Generated" },
  { type: "PDF", name: "Emergent Abilities of LLMs", meta: "Wei et al. · 2022", chip: "New" },
];

const SUMMARY_KEY_POINTS = [
  "Attention is the only mechanism mixing information across positions",
  "Multi-head attention learns different representational subspaces",
  "Deeper models train faster with residual connections + layer norm",
  "Quadratic complexity remains the key scaling bottleneck",
];

const SUMMARY_TERMS = ["Transformer", "Self-attention", "Multi-head", "Residual", "Positional encoding"];

const CHAT = [
  {
    q: "How does self-attention compare to recurrence?",
    a: "Self-attention connects all positions in constant time — no sequential recurrence — which is what makes the Transformer trainable in parallel at scale.",
    cites: ["Attention Is All You Need"],
  },
  {
    q: "What limits context length?",
    a: "Attention cost grows quadratically with sequence length, so long-context use gets expensive. Techniques like sparse attention and linear attention attack this directly.",
    cites: ["A Survey of Transformers", "Longformer"],
  },
  {
    q: "Should I cite the original 2017 paper?",
    a: "Yes — it remains the canonical reference. I've added it and 2 related works to your bibliography.",
    cites: ["Added to bibliography"],
  },
];

const INSIGHTS = [
  { label: "Clusters identified", value: "14", delta: "+3 this week" },
  { label: "Most cited in your corpus", value: "Attention Is All You Need", delta: "142 citations" },
  { label: "Emerging theme", value: "Efficient attention", delta: "9 papers linked" },
];

const TRENDS = [
  { topic: "Self-attention", pct: 92 },
  { topic: "Scaling laws", pct: 71 },
  { topic: "Alignment", pct: 58 },
  { topic: "Sparse attention", pct: 44 },
];

const SIDEBAR = [
  { icon: Search, active: false },
  { icon: Library, active: true },
  { icon: FileText, active: false },
  { icon: BarChart3, active: false },
  { icon: Settings, active: false },
];

/* ------------------------------------------------------------------ */
/* Tab panels                                                           */
/* ------------------------------------------------------------------ */

function LibraryPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
          <Search className="h-4 w-4 text-muted" />
          <span className="text-[13px] text-muted">Search across your research…</span>
        </div>
        <span className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-muted sm:block">
          Sort: Recent
        </span>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-hidden">
        {LIBRARY.map((doc, i) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12]"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-muted ring-1 ring-white/10">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-ink">{doc.name}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-muted">{doc.meta}</p>
            </div>
            <span className="hidden text-[10px] uppercase tracking-wider text-muted/70 md:block">{doc.type}</span>
            <span className="rounded-full bg-gradient-to-r from-violet/25 to-electric/20 px-2.5 py-1 text-[11px] font-medium text-violet-soft">
              {doc.chip}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SummaryPanel() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-[1fr_1.1fr]">
      {/* Source preview */}
      <div className="hidden flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 md:flex">
        <p className="text-[15px] font-semibold text-ink">Attention Is All You Need</p>
        <p className="mt-1 text-[12px] text-muted">Vaswani et al. · 2017 · NeurIPS · 15 pages</p>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full bg-white/[0.07]"
              style={{ width: `${[100, 96, 90, 97, 84, 93, 88, 98, 80, 92, 86, 74][i]}%` }}
            />
          ))}
        </div>
      </div>

      {/* AI summary */}
      <div className="flex flex-col rounded-xl border border-violet/25 bg-gradient-to-br from-violet/[0.12] to-electric/[0.06] p-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet/25 text-violet-soft ring-1 ring-violet/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-ink">NOVA summary</p>
            <p className="text-[11px] text-violet-soft/70">Generated from 15 pages · 4 key findings</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12px] text-ink/80">
            <Copy className="h-3.5 w-3.5" /> Copy
          </span>
        </div>

        <ul className="mt-5 flex-1 space-y-3">
          {SUMMARY_KEY_POINTS.map((point, i) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink/85"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/25">
                <Check className="h-3 w-3 text-violet-soft" />
              </span>
              {point}
            </motion.li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {SUMMARY_TERMS.map((term) => (
            <span
              key={term}
              className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AskPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-hidden">
        {CHAT.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09, duration: 0.45 }}
            className="space-y-2"
          >
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-white/[0.06] px-4 py-2.5 text-[13px] text-ink/85">
              {msg.q}
            </div>
            <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm border border-violet/25 bg-violet/[0.12] px-4 py-3 text-[13px] leading-relaxed text-ink/85">
              {msg.a}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {msg.cites.map((cite) => (
                  <span
                    key={cite}
                    className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10.5px] text-violet-soft"
                  >
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] py-2.5 pl-4 pr-2.5">
        <span className="text-[13px] text-muted">Ask anything about your research…</span>
        <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet to-electric text-white shadow-glow">
          <MessageSquareText className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function InsightsPanel() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-3">
        {INSIGHTS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5"
          >
            <div>
              <p className="text-[11.5px] text-muted">{item.label}</p>
              <p className="mt-0.5 text-[15px] font-semibold text-ink">{item.value}</p>
            </div>
            <span className="rounded-full bg-electric/15 px-2.5 py-1 text-[11px] font-medium text-electric-bright">
              {item.delta}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-[13px] font-semibold text-ink">Trending topics in your workspace</p>
        <div className="mt-4 flex-1 space-y-3.5">
          {TRENDS.map((t, i) => (
            <div key={t.topic}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink/75">{t.topic}</span>
                <span className="text-muted">{t.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-violet to-electric"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

const PANELS: Record<TabId, React.ComponentType> = {
  library: LibraryPanel,
  summary: SummaryPanel,
  ask: AskPanel,
  insights: InsightsPanel,
};

export default function Showcase() {
  const [active, setActive] = useState<TabId>("library");
  const ActivePanel = PANELS[active];

  return (
    <section id="product" className="relative py-24 sm:py-32">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute right-0 top-1/3 h-[480px] w-[480px] rounded-full bg-electric/[0.07] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="Product tour"
          title={
            <>
              One workspace. <span className="font-serif italic text-gradient">Every source.</span>
            </>
          }
          description="A guided look at how NOVA organizes, understands and connects your research."
        />

        <Reveal className="mt-14" delay={0.1}>
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080A16]/80 shadow-card backdrop-blur-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <span className="rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-muted">
                nova.app / r / neural-systems
              </span>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="hidden flex-col items-center gap-1.5 border-r border-white/[0.06] px-3 py-5 sm:flex">
                {SIDEBAR.map(({ icon: Icon, active: isActive }, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-violet/25 text-violet-soft ring-1 ring-violet/40" : "text-muted/70",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                ))}
              </div>

              {/* Main */}
              <div className="min-w-0 flex-1 p-5 sm:p-6">
                {/* Tabs */}
                <div role="tablist" aria-label="Product views" className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.02] p-1">
                  {TABS.map((tab) => {
                    const selected = active === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActive(tab.id)}
                        className={cn(
                          "relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                          selected ? "text-ink" : "text-muted hover:text-ink/80",
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId="showcase-pill"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/10"
                          />
                        )}
                        <tab.icon className="relative h-4 w-4" />
                        <span className="relative">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Panel */}
                <div className="min-h-[380px] md:min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      role="tabpanel"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                    >
                      <ActivePanel />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
