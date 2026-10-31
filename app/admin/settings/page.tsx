"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SystemStatus {
  integrations: {
    supabase: { configured: boolean };
    ai: { configured: boolean; provider: string; models: { chat: string; summary: string; embeddings: string }; notes: string };
    billing: { configured: boolean; provider: string; testMode: boolean };
    email: { configured: boolean; provider: string };
  };
  storage: { configured: boolean; bucket: { name: string; public: boolean } | null };
  serverTime: string;
}

export default function AdminSettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings");
      const body = await res.json().catch(() => ({}));
      if (res.ok) setStatus(body);
    })();
  }, []);

  if (!status) {
    return <div className="flex items-center justify-center gap-3 py-24"><Loader2 className="h-6 w-6 animate-spin text-violet-soft" /><span className="text-[13.5px] text-muted">Checking system status…</span></div>;
  }

  const rows = [
    {
      key: "Supabase",
      ok: status.integrations.supabase.configured,
      detail: status.integrations.supabase.configured ? "Database + Auth + Storage connected" : "Missing NEXT_PUBLIC_SUPABASE_URL / keys",
    },
    {
      key: "AI provider",
      ok: status.integrations.ai.configured,
      detail: status.integrations.ai.configured
        ? `${status.integrations.ai.provider} — chat: ${status.integrations.ai.models.chat || "unset"}, summary: ${status.integrations.ai.models.summary || "unset"}, embeddings: ${status.integrations.ai.models.embeddings || "unset"}`
        : "Set AI_PROVIDER, AI_API_KEY and model env vars",
    },
    {
      key: "Billing",
      ok: status.integrations.billing.configured,
      detail: status.integrations.billing.configured
        ? `Connected (${status.integrations.billing.testMode ? "TEST MODE" : "LIVE MODE"})`
        : "Set BILLING_PROVIDER / BILLING_SECRET_KEY + price IDs (test mode recommended)",
    },
    {
      key: "Email",
      ok: status.integrations.email.configured,
      detail: status.integrations.email.configured ? `${status.integrations.email.provider} ready` : "Set EMAIL_PROVIDER / EMAIL_API_KEY / EMAIL_FROM",
    },
    {
      key: "Storage bucket",
      ok: status.storage.configured,
      detail: status.storage.configured ? `Bucket “${status.storage.bucket?.name}” exists (public: ${status.storage.bucket?.public})` : "Create the private “documents” bucket in Supabase Storage",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Integration status</h2>
        <ul className="flex flex-col divide-y divide-white/[0.05]">
          {rows.map((r) => (
            <li key={r.key} className="flex items-start gap-3 py-3.5">
              {r.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />}
              <div>
                <p className="text-[14px] font-medium text-ink">{r.key}</p>
                <p className="text-[12.5px] text-muted">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel p-6">
        <h2 className="mb-2 text-[15px] font-semibold text-ink">System health</h2>
        <p className="text-[13px] text-muted">
          Server time: <span className="text-ink">{new Date(status.serverTime).toLocaleString()}</span> · Health checks run on the admin API (server-side role verification).
        </p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          Sensitive admin operations (plan changes, user updates, credit adjustments, job retries) are written to the audit log.
        </p>
      </div>
    </div>
  );
}
