"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
];

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="nova-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8E7CFF" />
          <stop offset="1" stopColor="#41A6FF" />
        </linearGradient>
      </defs>
      <rect x="14.2" y="2.5" width="3.6" height="27" rx="1.8" fill="url(#nova-logo-grad)" transform="rotate(45 16 16)" />
      <rect x="14.2" y="2.5" width="3.6" height="27" rx="1.8" fill="url(#nova-logo-grad)" transform="rotate(-45 16 16)" />
      <circle cx="16" cy="16" r="3.1" fill="#0A0D1C" stroke="url(#nova-logo-grad)" strokeWidth="2" />
    </svg>
  );
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 12);
  });

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-shell items-center justify-between px-5 transition-all duration-500 sm:px-8",
          scrolled &&
            "border-b border-white/[0.06] bg-base/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-base/60",
        )}
      >
        {/* Logo */}
        <a href="#top" className="group flex items-center gap-2.5">
          <LogoMark className="transition-transform duration-500 group-hover:rotate-90" />
          <span className="text-lg font-bold tracking-[0.08em] text-ink">
            NOVA
            <span className="ml-1.5 hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-soft/70 sm:inline">
              AI Research
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-full px-3.5 py-2 text-[14px] font-medium text-muted transition-colors duration-300 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <a
            href="#pricing"
            className="rounded-full px-4 py-2 text-[14px] font-medium text-muted transition-colors duration-300 hover:text-ink"
          >
            Sign in
          </a>
          <motion.a
            href="#pricing"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary px-5 py-2.5 text-[14px]"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition-colors hover:bg-white/5 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-white/[0.06] bg-base/95 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-6" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-xl px-3 py-3 text-[16px] font-medium text-ink/85 transition-colors hover:bg-white/5 hover:text-ink"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-5">
                <a
                  href="#pricing"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/15 px-5 py-3 text-center text-[15px] font-semibold text-ink"
                >
                  Sign in
                </a>
                <a
                  href="#pricing"
                  onClick={() => setOpen(false)}
                  className="btn-primary px-5 py-3 text-[15px]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
