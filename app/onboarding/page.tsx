"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Briefcase,
  FolderKanban,
  Gem,
  Check,
  Loader2,
  GraduationCap,
  Building2,
  FlaskConical,
  Cpu,
  BookOpen,
  CircleDot,
} from "lucide-react";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/app/Toast";
import { saveOnboarding, finishOnboarding } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const STEPS = ["Welcome", "About you", "Interests", "Workspace", "Plan", "Done"];
const INTERESTS = [
  { id: "academic", label: "Academic research", icon: GraduationCap },
  { id: "business", label: "Business", icon: Building2 },
  { id: "science", label: "Science", icon: FlaskConical },
  { id: "technology", label: "Technology", icon: Cpu },
  { id: "learning", label: "General learning", icon: BookOpen },
  { id: "other", label: "Other", icon: CircleDot },
];

export default function OnboardingPage({ initial }: { initial?: { fullName: string; profession: string; interests: string[]; workspaceName: string; workspaceDescription: string } }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [profession, setProfession] = useState(initial?.profession ?? "");
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [workspaceName, setWorkspaceName] = useState(initial?.workspaceName ?? "My Research Workspace");
  const [workspaceDescription, setWorkspaceDescription] = useState(initial?.workspaceDescription ?? "");
  const [plan, setPlan] = useState("free");
  const [saving, setSaving] = useState(false);

  async function persist(patch?: Record<string, string>) {
    const fd = new FormData();
    fd.append("fullName", fullName);
    fd.append("profession", profession);
    fd.append("interests", interests.join(","));
    fd.append("workspaceName", workspaceName);
    fd.append("workspaceDescription", workspaceDescription);
    if (patch) for (const [k, v] of Object.entries(patch)) fd.set(k, v);
    await saveOnboarding(null, fd);
  }

  function next() {
    if (step === 1 && fullName.trim().length < 2) {
      toast("Enter your full name", "error");
      return;
    }
    setSaving(true);
    (async () => {
      await persist();
      setSaving(false);
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    })();
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet/15 blur-[140px]" />

      <div className="relative w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet/30 bg-violet/10">
              <Sparkles className="h-4.5 w-4.5 text-violet-soft" />
            </span>
            <span className="text-[16px] font-bold tracking-[0.08em] text-ink">NOVA</span>
          </div>
          <span className="text-[13px] text-muted">Step {step + 1} of {STEPS.length}</span>
        </div>

        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
            className="h-full rounded-full bg-gradient-to-r from-violet to-electric"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-surface/70 p-8 shadow-card backdrop-blur-2xl sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet/30 bg-violet/15"
                  >
                    <Sparkles className="h-9 w-9 text-violet-soft" />
                  </motion.div>
                  <h1 className="font-serif text-[30px] leading-tight text-ink">Welcome to NOVA</h1>
                  <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
                    Your research, connected and understood. Upload documents, ask grounded questions, and discover the connections you've been missing.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet/25 bg-violet/10">
                      <Briefcase className="h-5 w-5 text-violet-soft" />
                    </span>
                    <div>
                      <h2 className="text-[20px] font-semibold text-ink">About you</h2>
                      <p className="text-[13px] text-muted">Tell us a little about yourself.</p>
                    </div>
                  </div>
                  <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" autoFocus />
                  <Input label="Profession / occupation (optional)" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="e.g. PhD candidate, Analyst" />
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-[20px] font-semibold text-ink">What are you researching?</h2>
                  <p className="text-[13px] text-muted">Pick all that apply — this tunes suggestions.</p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {INTERESTS.map((it) => {
                      const active = interests.includes(it.id);
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setInterests((prev) => (active ? prev.filter((x) => x !== it.id) : [...prev, it.id]))}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                            active ? "border-violet/40 bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", active ? "text-violet-soft" : "text-muted")} />
                          <span className="text-[14px] font-medium text-ink">{it.label}</span>
                          {active && <Check className="ml-auto h-4.5 w-4.5 text-violet-soft" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet/25 bg-violet/10">
                      <FolderKanban className="h-5 w-5 text-violet-soft" />
                    </span>
                    <div>
                      <h2 className="text-[20px] font-semibold text-ink">Set up your workspace</h2>
                      <p className="text-[13px] text-muted">Your workspace groups your documents, projects and conversations.</p>
                    </div>
                  </div>
                  <Input label="Workspace name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} autoFocus />
                  <Input label="Description (optional)" value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)} placeholder="e.g. Fall 2025 research" />
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-[20px] font-semibold text-ink">Choose a plan</h2>
                  <p className="text-[13px] text-muted">Start free — upgrade anytime from billing settings.</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { id: "free", name: "Starter", price: "$0", desc: "20 AI questions, 5 docs, 2 GB" },
                      { id: "pro", name: "Pro", price: "$12", desc: "500 questions, 200 docs, 20 GB, projects" },
                      { id: "team", name: "Research Team", price: "$39", desc: "5k questions, 2k docs, 100 GB, team" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlan(p.id)}
                        className={cn(
                          "flex flex-col rounded-2xl border p-5 text-left transition-colors",
                          plan === p.id ? "border-violet/50 bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-ink">{p.name}</span>
                          {plan === p.id && <Check className="h-4 w-4 text-violet-soft" />}
                        </div>
                        <span className="mt-2 text-[22px] font-semibold text-ink tabular">{p.price}<span className="text-[12px] text-muted">/mo</span></span>
                        <span className="mt-1 text-[11.5px] leading-snug text-muted">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="flex items-center gap-2 text-[12.5px] text-muted">
                    <Gem className="h-4 w-4 text-violet-soft" /> Demo pricing. No card required for the free plan.
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10"
                  >
                    <Check className="h-9 w-9 text-emerald-300" />
                  </motion.div>
                  <h1 className="font-serif text-[28px] leading-tight text-ink">You're all set, {fullName.split(" ")[0] || "friend"}</h1>
                  <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
                    Your {workspaceName} workspace is ready. Upload your first document and start asking questions.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || saving}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-[14px] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            ) : (
              <button type="button" onClick={() => { setSaving(true); void finishOnboarding(); }} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-[14px] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter NOVA"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
