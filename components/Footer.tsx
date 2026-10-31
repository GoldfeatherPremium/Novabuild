"use client";

import { Github, Linkedin, Twitter } from "lucide-react";
import { LogoMark } from "@/components/Navbar";

const LINK_GROUPS = [
  {
    title: "Product",
    links: ["Features", "How it works", "Pricing", "Product tour", "Changelog"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Guides", "Community", "Help center", "Status"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "Cookies"],
  },
];

const SOCIALS = [
  { icon: Twitter, label: "X (Twitter)" },
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#05060F]">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand */}
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-lg font-bold tracking-[0.08em] text-ink">NOVA</span>
            </a>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              Your research. Connected. Understood. An AI-powered workspace for people who think for a living.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#top"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-muted transition-colors duration-300 hover:border-white/20 hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted/70">
                  {group.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#top"
                        className="text-[13.5px] text-muted transition-colors duration-300 hover:text-ink"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center">
          <p className="text-[12.5px] text-muted/70">
            © {new Date().getFullYear()} NOVA Labs. All rights reserved.
          </p>
          <p className="text-[12px] text-muted/50">
            Demo landing page — all names, testimonials and figures are fictional.
          </p>
        </div>
      </div>
    </footer>
  );
}
