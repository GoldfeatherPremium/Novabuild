"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import { useToast } from "@/components/app/Toast";
import { formatBytes, timeAgo } from "@/lib/utils";

interface StorageDoc {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function StorageList({ documents }: { documents: StorageDoc[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [target, setTarget] = useState<StorageDoc | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!target) return;
    setBusy(true);
    const res = await fetch(`/api/documents/${target.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast("Document deleted", "success");
      setTarget(null);
      router.refresh();
    } else {
      toast("Delete failed", "error");
    }
  }

  return (
    <>
      {documents.length === 0 ? (
        <p className="py-8 text-center text-[13.5px] text-muted">No documents using storage.</p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <FileText className="h-4 w-4 text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{d.title}</p>
                <p className="text-[12px] text-muted">{d.original_filename} · {timeAgo(d.created_at)}</p>
              </div>
              <span className="text-[12.5px] text-muted">{formatBytes(d.file_size)}</span>
              <button type="button" onClick={() => setTarget(d)} aria-label="Delete document" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-400/10 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        title="Delete document?"
        description={target ? `“${target.title}” and its extracted data will be permanently removed.` : ""}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
