"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import ConfigBanner from "@/components/auth/ConfigBanner";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { login, type ActionResult } from "@/lib/auth/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("next", next);
    startTransition(async () => {
      setState(await login(state, formData));
    });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your research."
      footer={
        <>
          New to NOVA?{" "}
          <Link href="/register" className="font-medium text-violet-soft hover:text-ink">
            Create an account
          </Link>
        </>
      }
    >
      <ConfigBanner />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@university.edu"
          autoComplete="email"
          required
          error={state?.fieldErrors?.email}
        />
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
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

        <div className="flex items-center justify-between">
          <Checkbox name="remember" label="Remember me" />
          <Link href="/forgot-password" className="text-[13px] font-medium text-violet-soft hover:text-ink">
            Forgot password?
          </Link>
        </div>

        {state?.error && state.error !== "SERVICE_NOT_CONFIGURED" && (
          <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-[13px] text-red-200">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary mt-2 h-12 w-full text-[15px] disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="Welcome back" subtitle="Sign in to continue your research." />}>
      <LoginForm />
    </Suspense>
  );
}
