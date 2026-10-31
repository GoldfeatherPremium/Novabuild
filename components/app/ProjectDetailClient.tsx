"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2, Plus, Loader2, FileText } from "lucide-react";
import Modal from "@/components/app/Modal";
import ConfirmDialog from "@/components/app/ConfirmDialog";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/app/Toast";
import { cn } from "@/lib/utils";

export interface Doc {
  id: string;
  title: string;
  file_type: string;
  status: string;
}

export default function ProjectDetailClient({
  projectId,
  initialName,
  initialDescription,
  initialArchived,
  docs,
  availableDocs,
}: {
  projectId: string;
  initialName: string;
  initialDescription: string;
  initialArchived: boolean;
  docs: Doc[];
  availableDocs: Doc[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const notAttached = availableDocs.filter((d) => !docs.some((x) => x.id === d.id));

  useEffect(() => {
    const handler = () => setAttachOpen(true);
    window.addEventListener("nova:attach-docs", handler);
    return () => window.removeEventListener("nova:attach-docs", handler);
  }, []);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      toast("Project updated", "success");
      setEditOpen(false);
      router.refresh();
    } else {
      toast("Update failed", "error");
    }
  }

  async function toggleArchive() {
    setBusy(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !initialArchived }),
    });
    setBusy(false);
    toast(initialArchived ? "Project restored" : "Project archived", "success");
    router.refresh();
  }

  async function attachDocs() {
    if (selected.length === 0) return;
    setBusy(true);
    for (const id of selected) {
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
    }
    setBusy(false);
    setAttachOpen(false);
    setSelected([]);
    toast("Documents attached", "success");
    router.refresh();
  }

  async function removeProject() {
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast("Project deleted", "success");
      router.push("/app/projects");
    } else {
      toast("Delete failed", "error");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { setEditOpen(true); setName(initialName); setDescription(initialDescription); }} className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-white/5">
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button type="button" onClick={() => setAttachOpen(true)} className="flex items-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 px-4 py-2.5 text-[13px] font-medium text-violet-soft hover:bg-violet/20">
          <Plus className="h-4 w-4" /> Add documents
        </button>
        <button type="button" onClick={toggleArchive} disabled={busy} className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-white/5">
          {initialArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          {initialArchived ? "Restore" : "Archive"}
        </button>
        <button type="button" onClick={() => setConfirmOpen(true)} className="flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/5 px-4 py-2.5 text-[13px] font-medium text-red-300 hover:bg-red-400/10">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {/* Attach documents */}
      <Modal open={attachOpen} onClose={() => setAttachOpen(false)} title="Add documents to project" wide>
        {notAttached.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-muted">All your documents are already in this project.</p>
        ) : (
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {notAttached.map((d) => {
              const checked = selected.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected((prev) => (checked ? prev.filter((x) => x !== d.id) : [...prev, d.id]))}
                  className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", checked ? "border-violet/40 bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/20")}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate text-[13px] font-medium text-ink">{d.title}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setAttachOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">Cancel</button>
          <button type="button" onClick={attachDocs} disabled={busy || selected.length === 0} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attach"}
          </button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit project">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">Cancel</button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={removeProject}
        title="Delete project?"
        description="This removes the project and its links, but does not delete your documents."
        confirmLabel="Delete project"
        danger
      />
    </>
  );
}
