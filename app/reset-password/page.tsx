"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import ConfigBanner from "@/components/auth/ConfigBanner";
import Input from "@/components/ui/Input";
import { updatePassword, type ActionResult } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Exchange the recovery token from the email link.
    const hash = window.location.hash;
    const supabase = createClient();
    (async () => {
      try {
        if (hash.includes("type=recovery")) {
          const params = new URLSearchParams(hash.slice(1));
          const tokenHash = params.get("token_hash");
          if (tokenHash) {
            await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          }
        }
      } catch {
        // Fall through — Supabase may already have the session.
      } finally {
        setProcessing(false);
      }
    })();
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePassword(state, formData);
      setState(result);
      if (result.ok) {
        router.push("/login?reset=success");
      }
    });
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick a strong password you don't use elsewhere."
      footer={
        <Link href="/login" className="font-medium text-violet-soft hover:text-ink">
          Back to sign in
        </Link>
      }
    >
      <ConfigBanner />
      {processing ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-soft" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input name="password" type="password" label="New password" placeholder="8+ characters" autoComplete="new-password" required />
          <Input name="confirmPassword" type="password" label="Confirm new password" placeholder="Repeat password" autoComplete="new-password" required />
          {state?.error && <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-[13px] text-red-200">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary mt-2 h-12 w-full text-[15px] disabled:opacity-60">
            {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
