"use client";

import { motion } from "motion/react";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { staggerContainer, fadeUpItem } from "@/lib/motion";
import DashboardMockup from "@/components/hero/DashboardMockup";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      {/* Background layers */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_60%_at_50%_10%,black_30%,transparent_75%)]" />
        <div className="absolute -top-40 left-[8%] h-[520px] w-[520px] rounded-full bg-violet/25 blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] h-[460px] w-[460px] rounded-full bg-electric/20 blur-[140px]" />
        <div className="absolute bottom-[-30%] left-[30%] h-[420px] w-[420px] rounded-full bg-violet-deep/20 blur-[150px]" />
      </div>

      <div className="relative mx-auto grid max-w-shell items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
        {/* Copy */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="lg:col-span-5"
        >
          <motion.div
            variants={fadeUpItem}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] py-1.5 pl-2 pr-4 text-[13px] font-medium text-ink/80 backdrop-blur-md"
          >
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-gradient-to-r from-violet to-electric px-2 text-[11px] font-bold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" /> New
            </span>
            AI Research Workspace
          </motion.div>

          <motion.h1
            variants={fadeUpItem}
            className="mt-7 text-balance text-[42px] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl xl:text-[68px]"
          >
            Your research.
            <span className="mt-1 block font-serif italic text-gradient">
              Connected. Understood.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUpItem}
            className="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted"
          >
            Turn scattered information into extraordinary knowledge. Research smarter with your
            personal AI workspace — papers, PDFs, notes and the web, finally connected.
          </motion.p>

          <motion.div variants={fadeUpItem} className="mt-9 flex flex-wrap items-center gap-4">
            <motion.a
              href="#pricing"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-7 py-3.5 text-[15px]"
            >
              Start exploring
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.a>

            <motion.a
              href="#product"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost px-7 py-3.5 text-[15px]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch product demo
            </motion.a>
          </motion.div>

          <motion.p variants={fadeUpItem} className="mt-7 text-[13px] text-muted/80">
            Supports PDFs, web pages, notes &amp; references · No credit card required
          </motion.p>
        </motion.div>

        {/* Dashboard composition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="relative lg:col-span-7"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
