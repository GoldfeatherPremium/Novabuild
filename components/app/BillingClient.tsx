"use client";

import { useState } from "react";
import { Loader2, CreditCard, ExternalLink, ArrowRight } from "lucide-react";
import { useToast } from "@/components/app/Toast";

export default function BillingClient({
  currentPlanId,
  billingConfigured,
  billingTestMode,
}: {
  currentPlanId: string;
  billingConfigured: boolean;
  billingTestMode: boolean;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function checkout(planId: string, interval: "month" | "year") {
    setBusy(`${planId}-${interval}`);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, interval }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok && body.url) {
      window.location.href = body.url;
    } else if (body.error === "BILLING_NOT_CONFIGURED" || body.error === "BILLING_PRICE_MISSING") {
      toast("Billing isn't fully configured yet (see the status banner). Test mode requires Stripe keys + price IDs.", "error");
    } else {
      toast(body.error ?? "Checkout failed", "error");
    }
  }

  async function openPortal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok && body.url) {
      window.location.href = body.url;
    } else {
      toast(body.error === "no_customer" ? "You don't have an active billing customer yet." : (body.error ?? "Portal unavailable"), "error");
    }
  }

  const plans = [
    { id: "pro", name: "Pro", monthly: 1200, yearly: 12000 },
    { id: "team", name: "Research Team", monthly: 3900, yearly: 39000 },
  ];

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-white/[0.06] pt-4">
      <div className="flex flex-wrap gap-3">
        {plans.map((p) => (
          <div key={p.id} className="flex-1 min-w-[220px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-ink">{p.name}</p>
              {currentPlanId === p.id && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">Current</span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[24px] font-semibold text-ink tabular">${(p.monthly / 100).toFixed(0)}</span>
              <span className="text-[12.5px] text-muted">/month</span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted">${(p.yearly / 100).toFixed(0)}/year (save ~17%)</p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={() => checkout(p.id, "month")} disabled={busy !== null || currentPlanId === p.id} className="btn-primary w-full px-4 py-2 text-[13px] disabled:opacity-40">
                {busy === `${p.id}-month` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade monthly"}
              </button>
              <button type="button" onClick={() => checkout(p.id, "year")} disabled={busy !== null || currentPlanId === p.id} className="btn-ghost w-full px-4 py-2 text-[13px] disabled:opacity-40">
                {busy === `${p.id}-year` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade yearly"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] text-muted">
          {billingConfigured ? (
            <>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${billingTestMode ? "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/25" : "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25"}`}>
                {billingTestMode ? "TEST MODE" : "LIVE MODE"}
              </span>{" "}
              Billing is connected via your provider. Checkout and the portal open in a secure hosted flow.
            </>
          ) : (
            "Billing is not configured yet — add Stripe keys and price IDs to enable secure checkout (test mode recommended)."
          )}
        </p>
        <button type="button" onClick={openPortal} disabled={busy !== null} className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-white/5 disabled:opacity-40">
          {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Billing portal
        </button>
      </div>
    </div>
  );
}
