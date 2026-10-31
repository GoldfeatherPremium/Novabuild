"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  highlight?: boolean;
  cta: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "For first research projects",
    monthly: 0,
    yearly: 0,
    cta: "Start for free",
    features: [
      "1 workspace",
      "50 documents / month",
      "Basic AI summaries",
      "10 questions / day",
      "Community support",
    ],
  },
  {
    name: "Pro",
    tagline: "For serious researchers",
    monthly: 12,
    yearly: 10,
    highlight: true,
    cta: "Start 14-day trial",
    features: [
      "Unlimited workspaces",
      "Unlimited documents",
      "Advanced AI summaries",
      "Unlimited questions",
      "Connected knowledge graph",
      "PDF & web capture",
      "Priority support",
    ],
  },
  {
    name: "Research Team",
    tagline: "For labs & knowledge teams",
    monthly: 39,
    yearly: 32,
    cta: "Contact sales",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Shared team workspaces",
      "Admin & role controls",
      "SSO / SAML",
      "API access",
      "Dedicated support",
    ],
  },
];

function Price({ plan, billing }: { plan: Plan; billing: Billing }) {
  const amount = billing === "monthly" ? plan.monthly : plan.yearly;
  return (
    <div className="flex h-[64px] items-end overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={billing}
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -28, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="tabular text-5xl font-semibold tracking-tight text-ink"
        >
          ${amount}
        </motion.span>
      </AnimatePresence>
      <span className="mb-1.5 ml-2 text-[14px] text-muted">/ user / month</span>
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>("yearly");

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute left-1/2 top-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-violet/[0.08] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-shell px-5 sm:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple pricing. <span className="font-serif italic text-gradient">Serious leverage.</span>
            </>
          }
          description="Start free. Scale when your research does. Fictional demonstration pricing — not real offers."
        />

        {/* Toggle */}
        <Reveal className="mt-10 flex justify-center" delay={0.1}>
          <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-[13.5px] font-medium transition-colors duration-300",
                  billing === b ? "text-white" : "text-muted hover:text-ink",
                )}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet to-electric shadow-glow"
                  />
                )}
                <span className="relative capitalize">{b}</span>
                {b === "yearly" && (
                  <span
                    className={cn(
                      "relative ml-2 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                      billing === b ? "bg-white/20 text-white" : "bg-violet/20 text-violet-soft",
                    )}
                  >
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Cards */}
        <div className="mt-14 grid items-start gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1} className="h-full">
              <div
                className={cn(
                  "relative h-full rounded-3xl p-px",
                  plan.highlight
                    ? "bg-gradient-to-b from-violet via-electric/60 to-transparent shadow-glow"
                    : "bg-white/[0.08]",
                )}
              >
                <div
                  className={cn(
                    "flex h-full flex-col rounded-[calc(1.5rem-1px)] p-7",
                    plan.highlight ? "bg-[#0A0C1B]" : "bg-[#090B18]",
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet to-electric px-3.5 py-1 text-[11px] font-semibold text-white shadow-glow">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                  <p className="mt-1 text-[13px] text-muted">{plan.tagline}</p>

                  <div className="mt-6">
                    <Price plan={plan} billing={billing} />
                  </div>

                  <motion.a
                    href="#top"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-colors duration-300",
                      plan.highlight ? "btn-primary" : "border border-white/[0.12] bg-white/[0.04] text-ink hover:bg-white/[0.08]",
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </motion.a>

                  <ul className="mt-7 space-y-3 border-t border-white/[0.06] pt-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[13.5px] text-ink/75">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15">
                          <Check className="h-3 w-3 text-violet-soft" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-[12px] text-muted/60">
          Prices are fictional and shown for presentation purposes only.
        </p>
      </div>
    </section>
  );
}
