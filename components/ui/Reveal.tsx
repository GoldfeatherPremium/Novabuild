"use client";

import { motion } from "motion/react";
import { revealUp, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Scroll-triggered reveal wrapper with per-element delay. */
export default function Reveal({ children, className, delay = 0, y = 32 }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={viewportOnce}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
