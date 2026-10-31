import { HardDrive, FileText, Database } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWorkspaceId } from "@/lib/app-data";
import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/subscriptions";
import StorageList from "@/components/app/StorageList";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StorageSettingsPage() {
  const user = await requireUser();
  const workspaceId = await getWorkspaceId(user.id);
  const supabase = createClient();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, original_filename, file_type, file_size, created_at")
    .eq("workspace_id", workspaceId ?? "")
    .order("created_at", { ascending: false })
    .limit(500);

  const documents = docs ?? [];
  const total = documents.reduce((acc, d) => acc + (d.file_size ?? 0), 0);
  const plan = await getPlanForUser(user.id);
  const allowance = plan.plan?.storage_bytes ?? 2 * 1024 ** 3;
  const pct = Math.min(100, Math.round((total / allowance) * 100));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <HardDrive className="h-5 w-5 text-violet-soft" />
          <p className="mt-3 text-[24px] font-semibold text-ink tabular">{formatBytes(total)}</p>
          <p className="text-[13px] text-muted">Storage used</p>
        </div>
        <div className="panel p-5">
          <Database className="h-5 w-5 text-electric-bright" />
          <p className="mt-3 text-[24px] font-semibold text-ink tabular">{formatBytes(allowance)}</p>
          <p className="text-[13px] text-muted">Plan allowance ({plan.planId})</p>
        </div>
        <div className="panel p-5">
          <FileText className="h-5 w-5 text-lavender" />
          <p className="mt-3 text-[24px] font-semibold text-ink tabular">{documents.length}</p>
          <p className="text-[13px] text-muted">Documents</p>
        </div>
      </div>

      <div className="panel p-6">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="font-medium text-ink">Allowance used</span>
          <span className="text-muted">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-violet to-electric transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Documents using storage</h2>
        <StorageList documents={documents} />
      </div>
    </div>
  );
}
