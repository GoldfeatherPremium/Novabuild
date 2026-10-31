"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const supabase = createClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") ?? "email";
    const next = searchParams.get("next") ?? "/onboarding";

    (async () => {
      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: type as never, token_hash: tokenHash });
          if (error) throw error;
        }
        setStatus("success");
        setTimeout(() => router.push(next), 1200);
      } catch {
        setStatus("error");
      }
    })();
  }, [router, searchParams]);

  return (
    <AuthShell
      title={status === "loading" ? "Verifying…" : status === "success" ? "Email verified" : "Verification failed"}
      subtitle={
        status === "success"
          ? "Your account is ready. Taking you to your workspace…"
          : status === "error"
            ? "This link is invalid or has expired. Request a new one."
            : undefined
      }
      footer={
        status === "error" ? (
          <Link href="/login" className="font-medium text-violet-soft hover:text-ink">
            Sign in
          </Link>
        ) : undefined
      }
    >
      <div className="flex justify-center py-6">
        {status === "loading" ? (
          <Loader2 className="h-7 w-7 animate-spin text-violet-soft" />
        ) : status === "success" ? (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-2xl text-emerald-300">
            ✓
          </span>
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-400/15 text-2xl text-red-300">
            !
          </span>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthShell title="Verifying…"><div className="min-h-[240px]" /></AuthShell>}>
      <VerifyInner />
    </Suspense>
  );
}
