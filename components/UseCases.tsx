"use client";

import { motion } from "motion/react";
import { Briefcase, GraduationCap, Library, NotebookPen } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUpItem, viewportOnce } from "@/lib/motion";

const CASES = [
  {
    icon: GraduationCap,
    title: "Academic research",
    copy: "Keep every reading, citation and draft of a thesis or dissertation organized — and always one question away from the answer.",
    points: ["Thesis & dissertation work", "Paper reading lists", "Citation-ready notes"],
    accent: "text-violet-soft",
    glow: "group-hover:shadow-glow",
  },
  {
    icon: Library,
    title: "Literature reviews",
    copy: "Survey dozens of papers without losing the thread. NOVA clusters related work and surfaces the debates that matter.",
    points: ["Systematic reviews", "Related-work mapping", "Key-claim extraction"],
    accent: "text-electric-bright",
    glow: "group-hover:shadow-glow-blue",
  },
  {
    icon: Briefcase,
    title: "Business research",
    copy: "Turn market reports, competitor deep-dives and internal documents into insight your team can actually act on.",
    points: ["Competitive intelligence", "Market synthesis", "Decision briefs"],
    accent: "text-violet-soft",
    glow: "group-hover:shadow-glow",
  },
  {
    icon: NotebookPen,
    title: "Personal knowledge management",
    copy: "Build a second brain that connects what you read to what you already know — without ritual folder-filing.",
    points: ["Reading capture", "Idea linking", "Evergreen notes"],
    accent: "text-electric-bright",
    glow: "group-hover:shadow-glow-blue",
  },
];

export default function UseCases() {
  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.015] py-24 sm:py-28">
      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="Use cases"
          title={
            <>
              Built for the way <span className="font-serif italic text-gradient">you research.</span>
            </>
          }
          description="From a first-year syllabus to a Fortune 500 strategy team — if it involves reading and thinking, NOVA makes it lighter."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CASES.map((c) => (
            <motion.div key={c.title} variants={fadeUpItem}>
              <div className={`card-hover group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-surface p-6 ${c.glow}`}>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 ${c.accent}`}>
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{c.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{c.copy}</p>
                <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[13px] text-ink/70">
                      <span className="h-1 w-1 rounded-full bg-gradient-to-r from-violet to-electric" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
