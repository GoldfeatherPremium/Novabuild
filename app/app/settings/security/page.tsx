"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, KeyRound, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/app/Toast";
import { changeEmail, changePassword, type ActionResult } from "@/lib/auth/actions";

export default function SecuritySettingsPage({ email }: { email?: string }) {
  const { toast } = useToast();
  const [emailState, setEmailState] = useState<ActionResult | null>(null);
  const [pwState, setPwState] = useState<ActionResult | null>(null);
  const [pendingEmail, startEmail] = useTransition();
  const [pendingPw, startPw] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/25 bg-violet/10">
            <Mail className="h-4.5 w-4.5 text-violet-soft" />
          </span>
          <h2 className="text-[15.5px] font-semibold text-ink">Change email</h2>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startEmail(async () => {
              const r = await changeEmail(emailState, fd);
              setEmailState(r);
              if (r.ok) toast("We sent a verification link to your new email", "success");
              else if (r.error) toast(r.error, "error");
            });
          }}
        >
          <Input name="email" type="email" label="New email" placeholder="you@university.edu" required error={emailState?.fieldErrors?.email} />
          <button type="submit" disabled={pendingEmail} className="btn-primary self-start px-5 py-2.5 text-[13.5px] disabled:opacity-60">
            {pendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update email"}
          </button>
        </form>
      </div>

      <div className="panel p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/25 bg-violet/10">
            <KeyRound className="h-4.5 w-4.5 text-violet-soft" />
          </span>
          <h2 className="text-[15.5px] font-semibold text-ink">Change password</h2>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startPw(async () => {
              const r = await changePassword(pwState, fd);
              setPwState(r);
              if (r.ok) toast("Password updated", "success");
              else if (r.error) toast(r.error, "error");
            });
          }}
        >
          <Input name="currentPassword" type="password" label="Current password" required autoComplete="current-password" />
          <Input name="password" type="password" label="New password" placeholder="8+ chars, upper, lower and a number" required autoComplete="new-password" />
          <Input name="confirmPassword" type="password" label="Confirm new password" required autoComplete="new-password" />
          <button type="submit" disabled={pendingPw} className="btn-primary self-start px-5 py-2.5 text-[13.5px] disabled:opacity-60">
            {pendingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </button>
        </form>
      </div>

      <div className="panel flex items-start gap-3 p-6 lg:col-span-2">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <div>
          <p className="text-[14px] font-semibold text-ink">Account security</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Sessions are managed by Supabase Auth with secure, HttpOnly cookies. Role and ownership checks always happen server-side — never on the client. Current email on file: <span className="text-ink">{email ?? "—"}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
