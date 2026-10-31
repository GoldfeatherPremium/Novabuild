"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "motion/react";
import SectionHeading from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

/* ------------------------------------------------------------------ */
/* Animated counter                                                     */
/* ------------------------------------------------------------------ */

function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 22, mass: 1 });

  const [display, setDisplay] = useState(prefix + (0).toFixed(decimals) + suffix);

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      const formatted = v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      setDisplay(prefix + formatted + suffix);
    });
    return unsub;
  }, [spring, decimals, prefix, suffix]);

  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  );
}

const METRICS = [
  { value: 2.6, decimals: 1, suffix: "M+", label: "Research items organized" },
  { value: 480, suffix: "K+", label: "Summaries generated" },
  { value: 98.4, decimals: 1, suffix: "%", label: "Relevance on retrieval" },
  { value: 34, suffix: "", label: "Languages understood" },
];

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export default function Metrics() {
  return (
    <section className="relative py-20 sm:py-24">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/[0.06] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="NOVA in numbers"
          title={
            <>
              Momentum you can <span className="font-serif italic text-gradient">measure.</span>
            </>
          }
          description="Illustrative sample figures for demonstration — not real customer or performance statistics."
        />

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.06] lg:grid-cols-4">
          {METRICS.map((metric, i) => (
            <Reveal key={metric.label} delay={i * 0.08} className="h-full">
              <div className="flex h-full flex-col items-center justify-center bg-[#080A16] px-6 py-10 text-center">
                <p className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                  <Counter {...metric} />
                </p>
                <p className="mt-3 text-[13px] leading-snug text-muted">{metric.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-[11.5px] text-muted/50">
          Sample figures shown for illustration only.
        </p>
      </div>
    </section>
  );
}
