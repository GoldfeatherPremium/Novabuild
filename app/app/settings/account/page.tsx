"use client";

import { useState, useTransition } from "react";
import { Loader2, Download, Trash2, UserX } from "lucide-react";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import { useToast } from "@/components/app/Toast";
import { exportData, deleteAccount } from "@/lib/auth/actions";

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  async function exportAll() {
    setExporting(true);
    const result = await exportData();
    setExporting(false);
    if (result.ok && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nova-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data export downloaded", "success");
    } else {
      toast(result.error ?? "Export failed", "error");
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="panel p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/25 bg-violet/10">
            <Download className="h-4.5 w-4.5 text-violet-soft" />
          </span>
          <div>
            <h2 className="text-[15.5px] font-semibold text-ink">Export your data</h2>
            <p className="text-[12.5px] text-muted">A JSON archive of your profile, documents metadata, conversations, notes, projects and payments.</p>
          </div>
        </div>
        <button type="button" onClick={exportAll} disabled={exporting} className="btn-ghost mt-4 px-5 py-2.5 text-[13.5px] disabled:opacity-60">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export all data
        </button>
      </div>

      <div className="panel border-red-400/20 p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/25 bg-red-400/10">
            <UserX className="h-4.5 w-4.5 text-red-300" />
          </span>
          <div>
            <h2 className="text-[15.5px] font-semibold text-red-200">Delete account</h2>
            <p className="text-[12.5px] text-muted">Permanently deletes your account, documents and all associated data. This cannot be undone.</p>
          </div>
        </div>
        <button type="button" onClick={() => setDeleteOpen(true)} className="mt-4 rounded-full bg-red-400/15 px-5 py-2.5 text-[13.5px] font-semibold text-red-200 ring-1 ring-red-400/30 transition-colors hover:bg-red-400/25">
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          const fd = new FormData();
          fd.append("confirm", confirm);
          startTransition(async () => {
            const r = await deleteAccount(null, fd);
            if (r.error) toast(r.error, "error");
          });
        }}
        title="Delete your account?"
        description="Type DELETE to confirm permanent deletion."
        confirmLabel="Delete forever"
        danger
      >
        <div className="mt-4">
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder='Type "DELETE"' />
        </div>
      </ConfirmDialog>
    </div>
  );
}
