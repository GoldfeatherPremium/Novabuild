"use client";

import { motion } from "motion/react";
import { Layers, Sparkles, UploadCloud } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUpItem, viewportOnce } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    icon: UploadCloud,
    title: "Upload your research",
    copy: "Drag in PDFs, papers, web pages or your own notes. NOVA reads them all — tables, footnotes, references included.",
    accent: "from-violet/25 to-violet/[0.05]",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Let NOVA understand it",
    copy: "The engine extracts structure, identifies key claims and builds a semantic index of everything you've added.",
    accent: "from-electric/25 to-electric/[0.05]",
  },
  {
    num: "03",
    icon: Layers,
    title: "Discover meaningful insights",
    copy: "Ask questions, generate summaries and watch related ideas connect themselves across your entire library.",
    accent: "from-lavender/20 to-violet/[0.05]",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From scattered to <span className="font-serif italic text-gradient">structured</span> in
              three steps.
            </>
          }
          description="No complex setup. No taxonomies to maintain. Just bring your material and watch it organize itself."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mt-20 grid gap-10 md:grid-cols-3 md:gap-6"
        >
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-gradient-to-r from-violet/50 via-electric/40 to-transparent md:block"
          />

          {STEPS.map((step) => (
            <motion.div key={step.num} variants={fadeUpItem} className="relative flex flex-col items-start">
              <div className="relative z-10 flex items-center gap-4">
                <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-surface text-violet-soft shadow-card">
                  <step.icon className="h-6 w-6" />
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet to-electric text-[9px] font-bold text-white">
                    {step.num}
                  </span>
                </span>
                <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted/70">
                  Step {step.num}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">{step.copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
