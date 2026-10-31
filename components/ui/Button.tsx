"use client";

import { motion } from "motion/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "link";

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  variant?: Variant;
  size?: "md" | "lg";
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <motion.a
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-300 select-none",
        size === "lg" ? "px-7 py-3.5 text-[15px]" : "px-6 py-3 text-[14.5px]",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        variant === "link" && "text-ink/80 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.a>
  );
}
