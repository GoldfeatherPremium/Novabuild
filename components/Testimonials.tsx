"use client";

import { motion } from "motion/react";
import { Quote } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUpItem, viewportOnce } from "@/lib/motion";

const TESTIMONIALS = [
  {
    quote:
      "I used to lose days re-reading papers. NOVA turned my entire literature review into a conversation — I ask, it answers, and the citations are already in my draft.",
    name: "Priya Sharma",
    role: "PhD candidate, Computational Biology",
    initials: "PS",
    gradient: "from-violet/70 to-electric/60",
  },
  {
    quote:
      "The connected-knowledge view is quietly remarkable. It linked three papers I'd filed under completely different topics, and that thread became the core of my paper.",
    name: "Daniel Okafor",
    role: "Postdoctoral researcher, ML",
    initials: "DO",
    gradient: "from-electric/70 to-violet/60",
  },
  {
    quote:
      "We run competitive intelligence through NOVA. What took our team a week of reading now takes an afternoon — and the summaries are scarily good.",
    name: "Elena Vásquez",
    role: "Head of Research, strategy consultancy",
    initials: "EV",
    gradient: "from-lavender/60 to-violet/70",
  },
];

export default function Testimonials() {
  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.015] py-24 sm:py-28">
      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title={
            <>
              Loved by people who <span className="font-serif italic text-gradient">think for a living.</span>
            </>
          }
          description="Fictional demonstration testimonials shown for layout purposes — not real customer statements."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid gap-5 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.figure key={t.name} variants={fadeUpItem}>
              <div className="card-hover relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-surface p-6">
                <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted/70">
                  Demo testimonial
                </span>

                <Quote className="h-6 w-6 text-violet-soft/50" />

                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/85">
                  “{t.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-[13px] font-semibold text-white`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{t.name}</p>
                    <p className="text-[12px] text-muted">{t.role}</p>
                  </div>
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
