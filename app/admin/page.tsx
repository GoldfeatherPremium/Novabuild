"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, FileText, BriefcaseBusiness, Sparkles, DollarSign, AlertTriangle } from "lucide-react";

interface Analytics {
  totals: {
    users: number;
    activeUsers: number;
    newUsers: number;
    documents: number;
    pendingJobs: number;
    failedJobs: number;
    aiUnits: number;
    revenueCents: number;
  };
  byPlan: Record<string, number>;
  registrations: { date: string; count: number }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/analytics?days=30");
      const body = await res.json().catch(() => ({}));
      if (res.ok) setData(body);
      else setError(body.error ?? "Failed to load analytics");
    })();
  }, []);

  if (error) return <p className="py-10 text-center text-[14px] text-red-300">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-violet-soft" />
        <span className="text-[13.5px] text-muted">Loading analytics…</span>
      </div>
    );
  }

  const t = data.totals;
  const maxReg = Math.max(1, ...data.registrations.map((r) => r.count));
  const planTotal = Object.values(data.byPlan).reduce((a, b) => a + b, 0);

  const cards = [
    { label: "Total users", value: t.users, icon: Users, tint: "text-violet-soft bg-violet/10 border-violet/25" },
    { label: "New users (30d)", value: t.newUsers, icon: Users, tint: "text-electric-bright bg-electric/10 border-electric/25" },
    { label: "Documents", value: t.documents, icon: FileText, tint: "text-lavender bg-lavender/10 border-lavender/25" },
    { label: "Pending jobs", value: t.pendingJobs, icon: BriefcaseBusiness, tint: "text-amber-200 bg-amber-300/10 border-amber-300/25" },
    { label: "Failed jobs", value: t.failedJobs, icon: AlertTriangle, tint: "text-red-300 bg-red-400/10 border-red-400/25" },
    { label: "AI units (30d)", value: t.aiUnits, icon: Sparkles, tint: "text-violet-soft bg-violet/10 border-violet/25" },
    { label: "Revenue (30d)", value: `$${(t.revenueCents / 100).toLocaleString()}`, icon: DollarSign, tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${c.tint}`}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
            <p className="mt-3 text-[22px] font-semibold text-ink tabular">{c.value}</p>
            <p className="text-[12.5px] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registrations */}
        <div className="panel p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Registrations — last 30 days</h2>
          <div className="flex h-40 items-end gap-[2px]">
            {data.registrations.map((r) => (
              <div key={r.date} className="group relative flex-1" title={`${r.date}: ${r.count}`}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-violet to-electric opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ height: `${Math.max(2, (r.count / maxReg) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>{data.registrations[0]?.date}</span>
            <span>{data.registrations[data.registrations.length - 1]?.date}</span>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="panel p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Subscription distribution</h2>
          {planTotal === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted">No active subscriptions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(data.byPlan).map(([plan, count]) => (
                <div key={plan}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium capitalize text-ink">{plan}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet to-electric" style={{ width: `${(count / planTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
