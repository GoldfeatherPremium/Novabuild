import Link from "next/link";
import { CreditCard, Calendar, ArrowRight, Gem } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/subscriptions";
import { billingConfig } from "@/lib/env";
import BillingClient from "@/components/app/BillingClient";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BillingSettingsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { planId, plan, subscription } = await getPlanForUser(user.id);
  const billing = billingConfig();

  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("id, type, amount_cents, currency, status, invoice_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet/25 bg-violet/10">
              <Gem className="h-5 w-5 text-violet-soft" />
            </span>
            <div>
              <p className="text-[15px] font-semibold capitalize text-ink">{plan?.name ?? planId} plan</p>
              <p className="text-[12.5px] text-muted">{plan?.description ?? ""}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[11.5px] uppercase tracking-wide text-muted">AI questions</p>
              <p className="mt-1 text-[17px] font-semibold text-ink tabular">{plan?.ai_questions ?? 0}/mo</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[11.5px] uppercase tracking-wide text-muted">Documents</p>
              <p className="mt-1 text-[17px] font-semibold text-ink tabular">{plan?.document_processing ?? 0}/mo</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[11.5px] uppercase tracking-wide text-muted">Storage</p>
              <p className="mt-1 text-[17px] font-semibold text-ink tabular">{formatBytes(plan?.storage_bytes ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[11.5px] uppercase tracking-wide text-muted">Projects</p>
              <p className="mt-1 text-[17px] font-semibold text-ink">{plan?.projects_allowed ? "Included" : "Not included"}</p>
            </div>
          </div>
          {subscription && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[13px]">
              <Calendar className="h-4 w-4 text-muted" />
              <span className="text-muted">
                {subscription.status === "canceled" ? "Subscription canceled." : `Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                {subscription.cancel_at_period_end ? " — cancels at period end." : ""}
              </span>
            </div>
          )}
          <BillingClient currentPlanId={planId} billingConfigured={billing.configured} billingTestMode={billing.testMode} />
        </div>

        <div className="panel p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <CreditCard className="h-4 w-4 text-violet-soft" /> Payment history
          </h2>
          {(transactions ?? []).length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">No payments yet. Upgrades appear here once a check succeeds.</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-white/[0.05]">
              {(transactions ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-[13.5px] font-medium capitalize text-ink">{t.type}</p>
                    <p className="text-[11.5px] text-muted">{new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-semibold text-ink tabular">
                      {t.type === "refund" ? "−" : ""}${(t.amount_cents / 100).toFixed(2)}
                    </p>
                    <p className={`text-[11px] capitalize ${t.status === "succeeded" ? "text-emerald-300" : "text-amber-200"}`}>{t.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/app/settings/billing" className="mt-3 hidden items-center gap-1 text-[12.5px] text-violet-soft hover:text-ink">
            How billing works <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
