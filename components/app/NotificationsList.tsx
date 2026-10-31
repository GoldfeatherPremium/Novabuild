"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2, Bell, Sparkles, UploadCloud, AlertTriangle, CreditCard, ShieldAlert, FileText, MessageSquareText } from "lucide-react";
import { motion } from "motion/react";
import EmptyState from "@/components/app/EmptyState";
import { useToast } from "@/components/app/Toast";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, { icon: typeof Bell; tint: string }> = {
  upload_success: { icon: UploadCloud, tint: "text-electric-bright bg-electric/10 border-electric/25" },
  processing_completed: { icon: CheckCheck, tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
  processing_failed: { icon: AlertTriangle, tint: "text-red-300 bg-red-400/10 border-red-400/25" },
  ai_analysis_completed: { icon: Sparkles, tint: "text-violet-soft bg-violet/10 border-violet/25" },
  credit_low: { icon: AlertTriangle, tint: "text-amber-200 bg-amber-300/10 border-amber-300/25" },
  subscription_updated: { icon: CreditCard, tint: "text-lavender bg-lavender/10 border-lavender/25" },
  payment_success: { icon: CreditCard, tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
  payment_failed: { icon: AlertTriangle, tint: "text-red-300 bg-red-400/10 border-red-400/25" },
  security_alert: { icon: ShieldAlert, tint: "text-red-300 bg-red-400/10 border-red-400/25" },
};

export default function NotificationsList({ initial, unread }: { initial: NotificationItem[]; unread: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const [busy, setBusy] = useState(false);

  async function markRead(id: string) {
    await fetch(`/api/notifications`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function markAll() {
    setBusy(true);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }).catch(() => {});
    setBusy(false);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    toast("All notifications marked read", "success");
  }

  async function remove(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => {});
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted">
          {unread} unread · {items.length} total
        </p>
        <button type="button" onClick={markAll} disabled={busy || unread === 0} className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[12.5px] font-medium text-ink hover:bg-white/5 disabled:opacity-40">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Uploads, processing results, AI analysis and billing updates will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const meta = TYPE_ICON[n.type] ?? { icon: Bell, tint: "text-muted bg-white/[0.04] border-white/10" };
            const Icon = meta.icon;
            return (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-start gap-3.5 rounded-2xl border p-4 transition-colors", n.read_at ? "border-white/[0.06] bg-white/[0.01]" : "border-white/[0.10] bg-white/[0.03]")}
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", meta.tint)}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[14px] font-medium", n.read_at ? "text-muted" : "text-ink")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{n.body}</p>}
                  <p className="mt-1 text-[11.5px] text-muted/60">{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.read_at && (
                    <button type="button" onClick={() => markRead(n.id)} aria-label="Mark as read" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-ink">
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove(n.id)} aria-label="Delete notification" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-400/10 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
