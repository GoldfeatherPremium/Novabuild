"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export default function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-shell px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.1] bg-gradient-to-br from-[#171435] via-[#0C0E22] to-[#081120] px-6 py-20 text-center sm:px-16 sm:py-28">
            {/* Decorations */}
            <div aria-hidden className="absolute inset-0">
              <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_75%)]" />
              <div className="absolute left-1/2 top-0 h-[340px] w-[560px] -translate-x-1/2 rounded-full bg-violet/30 blur-[130px]" />
              <div className="absolute bottom-[-40%] left-[10%] h-[300px] w-[300px] rounded-full bg-electric/20 blur-[120px]" />
              {/* Orbital ring */}
              <svg
                className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-20"
                viewBox="0 0 400 400"
                fill="none"
                aria-hidden
              >
                <circle cx="200" cy="200" r="180" stroke="url(#ctaRing)" strokeWidth="1" strokeDasharray="2 8" />
                <circle cx="200" cy="200" r="140" stroke="url(#ctaRing)" strokeWidth="0.75" opacity="0.6" />
                <defs>
                  <linearGradient id="ctaRing" x1="0" y1="0" x2="400" y2="400">
                    <stop stopColor="#8E7CFF" />
                    <stop offset="1" stopColor="#41A6FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl">
                Stop collecting information.
                <span className="mt-1 block font-serif italic text-gradient">Start understanding it.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-muted">
                Your next breakthrough is hiding in the papers you've already read. Let NOVA connect the dots.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <motion.a
                  href="#pricing"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-8 py-4 text-[15.5px]"
                >
                  Start exploring NOVA
                  <ArrowRight className="h-4.5 w-4.5" />
                </motion.a>
                <a href="#product" className="text-[14.5px] font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
                  Or take the product tour
                </a>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
