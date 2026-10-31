"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import ConfigBanner from "@/components/auth/ConfigBanner";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { register, type ActionResult } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await register(state, formData);
      setState(result);
      if (result.ok) setSent(true);
    });
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a verification link to your inbox. Click it to activate your account, then sign in."
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
      title="Create your account"
      subtitle="Start turning scattered research into connected knowledge."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-soft hover:text-ink">
            Sign in
          </Link>
        </>
      }
    >
      <ConfigBanner />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input name="fullName" label="Full name" placeholder="Ada Lovelace" autoComplete="name" required error={state?.fieldErrors?.fullName} />
        <Input name="email" type="email" label="Email" placeholder="you@university.edu" autoComplete="email" required error={state?.fieldErrors?.email} />
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="8+ characters, with upper, lower and a number"
            autoComplete="new-password"
            required
            error={state?.fieldErrors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-[34px] text-muted transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
        <Input name="confirmPassword" type="password" label="Confirm password" placeholder="Repeat password" autoComplete="new-password" required error={state?.fieldErrors?.confirmPassword} />

        <Checkbox
          name="acceptTerms"
          label={
            <>
              I agree to the{" "}
              <span className="text-violet-soft">Terms</span> and{" "}
              <span className="text-violet-soft">Privacy Policy</span>
            </>
          }
        />
        {state?.fieldErrors?.acceptTerms && (
          <p className="text-[12.5px] text-red-300/90">{state.fieldErrors.acceptTerms}</p>
        )}
        {state?.error && state.error !== "SERVICE_NOT_CONFIGURED" && (
          <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-[13px] text-red-200">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-2 h-12 w-full text-[15px] disabled:opacity-60">
          {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
