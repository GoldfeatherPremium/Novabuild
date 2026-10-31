"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/app/Toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  monthly_credits: number;
  ai_questions: number;
  document_processing: number;
  storage_bytes: number;
  projects_allowed: boolean;
  priority_processing: boolean;
  active: boolean;
  features: string[];
}

function bytesToGb(bytes: number) {
  return Math.round(bytes / 1024 / 1024 / 1024);
}

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Plan>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/plans");
      const body = await res.json().catch(() => ({}));
      const list = body.plans ?? [];
      setPlans(list);
      const d: Record<string, Plan> = {};
      list.forEach((p: Plan) => (d[p.id] = { ...p }));
      setDraft(d);
      setLoading(false);
    })();
  }, []);

  async function save(plan: Plan) {
    setSaving(plan.id);
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft[plan.id]),
    });
    setSaving(null);
    if (res.ok) {
      toast("Plan updated", "success");
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? draft[plan.id] : p)));
    } else {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Save failed", "error");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-3 py-24"><Loader2 className="h-6 w-6 animate-spin text-violet-soft" /><span className="text-[13.5px] text-muted">Loading plans…</span></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13.5px] text-muted">
        Prices and limits are configurable here. Changing a plan affects new entitlements immediately (usage checks read these values server-side).
      </p>
      {plans.map((plan) => {
        const d = draft[plan.id];
        if (!d) return null;
        return (
          <div key={plan.id} className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-violet-soft">{d.id}</span>
                <h2 className="text-[16px] font-semibold text-ink">{d.name}</h2>
              </div>
              <button type="button" onClick={() => save(plan)} disabled={saving === plan.id} className="btn-primary px-5 py-2.5 text-[13.5px] disabled:opacity-60">
                {saving === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save plan"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Name" value={d.name} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], name: e.target.value } }))} />
              <Input label="Description" value={d.description} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], description: e.target.value } }))} />
              <Input label="Monthly price (cents)" type="number" value={d.price_monthly_cents} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], price_monthly_cents: Number(e.target.value) } }))} />
              <Input label="Yearly price (cents)" type="number" value={d.price_yearly_cents} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], price_yearly_cents: Number(e.target.value) } }))} />
              <Input label="Monthly credits" type="number" value={d.monthly_credits} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], monthly_credits: Number(e.target.value) } }))} />
              <Input label="AI questions / month" type="number" value={d.ai_questions} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], ai_questions: Number(e.target.value) } }))} />
              <Input label="Documents / month" type="number" value={d.document_processing} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], document_processing: Number(e.target.value) } }))} />
              <Input label="Storage (GB)" type="number" value={bytesToGb(d.storage_bytes)} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], storage_bytes: Number(e.target.value) * 1024 ** 3 } }))} />
              <div className="flex flex-col justify-center gap-2">
                <Checkbox label="Projects allowed" checked={d.projects_allowed} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], projects_allowed: e.target.checked } }))} />
                <Checkbox label="Priority processing" checked={d.priority_processing} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], priority_processing: e.target.checked } }))} />
                <Checkbox label="Plan active" checked={d.active} onChange={(e) => setDraft((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], active: e.target.checked } }))} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
              <Check className="h-4 w-4 text-emerald-300" />
              Saved price shows as ${(d.price_monthly_cents / 100).toFixed(0)}/mo · ${(d.price_yearly_cents / 100).toFixed(0)}/yr
            </div>
          </div>
        );
      })}
    </div>
  );
}
