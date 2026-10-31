"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import ConfigBanner from "@/components/auth/ConfigBanner";
import Input from "@/components/ui/Input";
import { requestPasswordReset, type ActionResult } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestPasswordReset(state, formData);
      setState(result);
      if (result.ok) setSent(true);
    });
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that email, we sent a password reset link."
        footer={
          <Link href="/login" className="font-medium text-violet-soft hover:text-ink">
            Back to sign in
          </Link>
        }
      />
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-violet-soft hover:text-ink">
            Sign in
          </Link>
        </>
      }
    >
      <ConfigBanner />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="you@university.edu" autoComplete="email" required error={state?.fieldErrors?.email} />
        {state?.error && state.error !== "SERVICE_NOT_CONFIGURED" && (
          <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-[13px] text-red-200">{state.error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary mt-2 h-12 w-full text-[15px] disabled:opacity-60">
          {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
