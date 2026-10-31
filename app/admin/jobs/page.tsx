"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/app/Toast";
import { timeAgo } from "@/lib/utils";

interface Job {
  id: string;
  document_id: string;
  kind: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  documents: { title: string; original_filename: string; owner_id: string } | null;
}

const FILTERS = ["", "queued", "running", "succeeded", "failed"];

export default function AdminJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    load(status);
  }, [status]);

  async function load(filter: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/jobs${filter ? `?status=${filter}` : ""}`);
    const body = await res.json().catch(() => ({}));
    setJobs(body.jobs ?? []);
    setLoading(false);
  }

  async function retry(job: Job) {
    setBusy(job.id);
    const res = await fetch(`/api/admin/jobs/${job.id}/retry`, { method: "POST" });
    setBusy(null);
    if (res.ok) {
      toast("Job retried", "success");
      load(status);
    } else {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Retry failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setStatus(f)} className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors ${status === f ? "border border-violet/40 bg-violet/15 text-violet-soft" : "border border-white/10 text-muted hover:text-ink"}`}>
            {f || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : jobs.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-muted">No processing jobs {status ? `with status “${status}”` : ""}.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Error</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{j.documents?.title ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{j.kind}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium capitalize ${
                      j.status === "succeeded" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : j.status === "failed" ? "border-red-400/25 bg-red-400/10 text-red-300"
                      : j.status === "running" ? "border-electric/30 bg-electric/10 text-electric-bright"
                      : "border-amber-300/25 bg-amber-300/10 text-amber-200"
                    }`}>{j.status}</span>
                  </td>
                  <td className="px-4 py-3 tabular text-muted">{j.attempts}/{j.max_attempts}</td>
                  <td className="px-4 py-3 text-muted">{timeAgo(j.created_at)}</td>
                  <td className="max-w-[220px] px-4 py-3">
                    {j.last_error ? <p className="truncate text-[12px] text-red-300/80" title={j.last_error}>{j.last_error}</p> : <span className="text-muted/40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {j.status === "failed" && (
                      <button type="button" onClick={() => retry(j)} disabled={busy === j.id} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-white/5 disabled:opacity-50">
                        {busy === j.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
