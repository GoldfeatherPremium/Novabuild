"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, Ban, CheckCircle2, Plus, Minus, UserCog } from "lucide-react";
import Modal from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";
import { timeAgo } from "@/lib/utils";

interface AdminUser {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  onboarded: boolean;
  suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
  subscription: { plan_id: string; status: string } | null;
  credits: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (search: string, p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}&page=${p}`);
    const body = await res.json().catch(() => ({}));
    setUsers(body.users ?? []);
    setTotal(body.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q, 1), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  async function patch(payload: Record<string, unknown>) {
    if (!target) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      toast("User updated", "success");
      setTarget(null);
      setCreditAmount("");
      load(q, page);
    } else {
      toast("Update failed", "error");
    }
  }

  const perPage = 25;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name or email…" className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[13.5px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50" />
        </div>
        <span className="text-[13px] text-muted">{total} users</span>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-muted">No users found.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{u.full_name || "—"}</p>
                    <p className="text-[12px] text-muted">{u.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${u.role === "admin" ? "border-violet/30 bg-violet/10 text-violet-soft" : "border-white/10 text-muted"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink">{u.subscription?.plan_id ?? "free"} <span className="text-[11px] text-muted">({u.subscription?.status ?? "—"})</span></td>
                  <td className="px-4 py-3 tabular text-ink">{u.credits}</td>
                  <td className="px-4 py-3 text-muted">{timeAgo(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-0.5 text-[11.5px] font-medium text-red-300">Suspended</span>
                    ) : !u.onboarded ? (
                      <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-[11.5px] font-medium text-amber-200">Onboarding</span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-300">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setTarget(u)} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-white/5">
                      <UserCog className="h-3.5 w-3.5" /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} type="button" onClick={() => { setPage(i + 1); load(q, i + 1); }} className={`h-9 w-9 rounded-full text-[13px] font-medium ${page === i + 1 ? "bg-violet/15 text-violet-soft ring-1 ring-violet/30" : "text-muted hover:text-ink"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={target ? `Manage ${target.full_name || "user"}` : ""}>
        {target && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[11.5px] uppercase text-muted">Plan</p><p className="mt-0.5 font-medium capitalize text-ink">{target.subscription?.plan_id ?? "free"}</p></div>
              <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[11.5px] uppercase text-muted">Credits</p><p className="mt-0.5 font-medium text-ink tabular">{target.credits}</p></div>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-muted">Adjust credits (audited)</p>
              <div className="flex gap-2">
                <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} type="number" placeholder="Amount" className="h-10 flex-1 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 text-[14px] text-ink outline-none focus:border-violet/50" />
                <button type="button" disabled={busy || !Number(creditAmount)} onClick={() => patch({ creditAdjustment: Math.abs(Number(creditAmount)), reason: "admin grant" })} className="flex items-center gap-1 rounded-full border border-violet/30 bg-violet/10 px-4 text-[13px] font-medium text-violet-soft hover:bg-violet/20 disabled:opacity-40">
                  <Plus className="h-4 w-4" /> Grant
                </button>
                <button type="button" disabled={busy || !Number(creditAmount)} onClick={() => patch({ creditAdjustment: -Math.abs(Number(creditAmount)), reason: "admin revoke" })} className="flex items-center gap-1 rounded-full border border-white/10 px-4 text-[13px] font-medium text-ink hover:bg-white/5 disabled:opacity-40">
                  <Minus className="h-4 w-4" /> Take
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {target.suspended ? (
                <button type="button" disabled={busy} onClick={() => patch({ suspended: false })} className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-4 py-2.5 text-[13px] font-semibold text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-400/25 disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Restore account
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => patch({ suspended: true, reason: "admin suspension" })} className="flex items-center gap-1.5 rounded-full bg-red-400/15 px-4 py-2.5 text-[13px] font-semibold text-red-200 ring-1 ring-red-400/30 hover:bg-red-400/25 disabled:opacity-50">
                  <Ban className="h-4 w-4" /> Suspend account
                </button>
              )}
              <button type="button" disabled={busy} onClick={() => patch({ role: target.role === "admin" ? "user" : "admin" })} className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-white/5 disabled:opacity-50">
                <UserCog className="h-4 w-4" /> Make {target.role === "admin" ? "regular user" : "admin"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
