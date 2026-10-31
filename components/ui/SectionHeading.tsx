"use client";

import { motion } from "motion/react";
import { revealUp, staggerContainer, fadeUpItem, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <motion.span variants={fadeUpItem} className="eyebrow">
          {eyebrow}
        </motion.span>
      ) : null}
      <motion.h2
        variants={fadeUpItem}
        className="max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </motion.h2>
      {description ? (
        <motion.p
          variants={fadeUpItem}
          className={cn(
            "max-w-2xl text-pretty text-[17px] leading-relaxed text-muted",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
