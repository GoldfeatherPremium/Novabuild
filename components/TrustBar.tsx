"use client";

import { motion } from "motion/react";
import { revealUp, viewportOnce } from "@/lib/motion";

/**
 * Illustrative, fictional placeholder organizations only.
 * No real customer names or endorsements are implied.
 */
const ORGS = [
  { name: "Northwind Institute", mark: "◆" },
  { name: "Lumina Labs", mark: "✦" },
  { name: "Vertex Analytics", mark: "▲" },
  { name: "Halcyon University", mark: "◎" },
  { name: "Cairn Research", mark: "△" },
  { name: "Quantia", mark: "◈" },
  { name: "Meridian Lab", mark: "◍" },
  { name: "Solstice Group", mark: "✧" },
];

export default function TrustBar() {
  return (
    <motion.section
      variants={revealUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="relative border-y border-white/[0.05] bg-white/[0.015] py-12"
    >
      <div className="mx-auto max-w-shell px-5 sm:px-8">
        <p className="text-center text-[13px] font-medium uppercase tracking-[0.2em] text-muted/80">
          Trusted by research teams at
        </p>

        <div className="group/marquee mask-fade-x mt-8 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-14 pr-14">
            {[...ORGS, ...ORGS].map((org, i) => (
              <span
                key={i}
                className="flex items-center gap-2.5 whitespace-nowrap text-[17px] font-semibold text-ink/45 transition-colors duration-300 hover:text-ink/80"
              >
                <span className="text-violet-soft/60">{org.mark}</span>
                {org.name}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[11.5px] text-muted/50">
          Illustrative placeholder names — no real customer endorsements implied.
        </p>
      </div>
    </motion.section>
  );
}
