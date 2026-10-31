"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Modal from "@/components/app/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/app/Toast";

export default function ProjectCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast("Give your project a name", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && body.project) {
      toast("Project created", "success");
      onClose();
      setName("");
      setDescription("");
      router.push(`/app/projects/${body.project.id}`);
      router.refresh();
    } else {
      toast(body.error ?? "Could not create project", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New research project">
      <div className="flex flex-col gap-4">
        <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quantum Error Correction" autoFocus />
        <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] text-ink hover:bg-white/5">
            Cancel
          </button>
          <button type="button" onClick={create} disabled={busy} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
