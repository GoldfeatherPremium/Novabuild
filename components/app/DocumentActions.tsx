"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import Modal from "@/components/app/Modal";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/app/Toast";

export default function DocumentActions({
  documentId,
  title,
  status,
}: {
  documentId: string;
  title: string;
  status: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(title);
  const [busy, setBusy] = useState(false);

  async function rename() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: name.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      toast("Document renamed", "success");
      setRenameOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Rename failed", "error");
    }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast("Document deleted", "success");
      router.refresh();
      router.push("/app/documents");
    } else {
      toast("Delete failed", "error");
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setRenameOpen(true)}
          aria-label="Rename document"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <Pencil className="h-4 w-4" />
        </button>
        {(status === "failed") && (
          <button
            type="button"
            onClick={async () => {
              setBusy(true);
              const res = await fetch(`/api/documents/${documentId}/process`, { method: "POST" });
              setBusy(false);
              if (res.ok) {
                toast("Retrying processing…", "info");
                router.refresh();
              } else {
                const body = await res.json().catch(() => ({}));
                toast(body.error ?? "Retry failed", "error");
              }
            }}
            aria-label="Retry processing"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label="Delete document"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-400/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename document">
        <div className="flex flex-col gap-4">
          <Input label="Title" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRenameOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">
              Cancel
            </button>
            <button type="button" onClick={rename} disabled={busy} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        title="Delete document?"
        description="This permanently deletes the file and its extracted text, summaries and links. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
