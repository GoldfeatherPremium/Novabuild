"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How does NOVA understand my PDFs?",
    a: "NOVA parses the full document — including tables, footnotes and references — then builds a structured index of claims, entities and concepts. You can ask questions about anything you've uploaded, and answers are grounded in your own sources.",
  },
  {
    q: "Which file types and sources are supported?",
    a: "PDFs, Word documents, plain text, markdown notes, and web pages (via a clean reader view). Citations and reference lists are recognized automatically.",
  },
  {
    q: "Is my research private?",
    a: "Your workspaces are private to you by default. Content is encrypted at rest and in transit, and is never used to train shared models. Team plans add granular access controls and optional SSO.",
  },
  {
    q: "Can I use NOVA for a whole research group?",
    a: "Yes — the Research Team plan includes shared workspaces, roles, and admin controls, so a lab can keep one living knowledge base instead of fifty folders.",
  },
  {
    q: "How is the pricing structured?",
    a: "Starter is free forever with limits. Pro is a flat per-user monthly price, and the yearly option gives you two months free. All prices on this page are fictional demonstration values.",
  },
  {
    q: "Is there an API or offline mode?",
    a: "Team plans include API access for integrations, and a desktop companion app lets you work with a local mirror of your workspace when you're offline.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions, <span className="font-serif italic text-gradient">answered.</span>
            </>
          }
          description="Everything you might want to know before taking NOVA for a spin."
        />

        <Reveal className="mt-14" delay={0.1}>
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080A16]/80">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300 hover:bg-white/[0.02]"
                  >
                    <span className="text-[15.5px] font-medium text-ink">{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        isOpen
                          ? "border-violet/40 bg-violet/20 text-violet-soft"
                          : "border-white/[0.1] bg-white/[0.03] text-muted",
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-button-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-muted">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
