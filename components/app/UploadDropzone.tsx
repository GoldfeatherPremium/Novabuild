"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, SUPPORTED_FILE_TYPES } from "@/lib/constants";

interface UploadItem {
  id: string;
  name: string;
  size: number;
  state: "uploading" | "done" | "error";
  error?: string;
}

const ACCEPT = SUPPORTED_FILE_TYPES.map((t) => `.${t}`).join(",");

export default function UploadDropzone({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  function update(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function uploadFile(file: File) {
    const id = `${file.name}-${Date.now()}`;
    setItems((prev) => [...prev, { id, name: file.name, size: file.size, state: "uploading" }]);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_FILE_TYPES.includes(ext as never)) {
      update(id, { state: "error", error: "Unsupported file type" });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      update(id, { state: "error", error: "File exceeds 10 MB" });
      return;
    }

    try {
      // 1. Presign
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!presign.ok) {
        const body = await presign.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to start upload");
      }
      const { path, url } = await presign.json();

      // 2. PUT the file to the signed URL
      const put = await fetch(url, { method: "PUT", body: file });
      if (!put.ok) throw new Error("Upload failed");

      // 3. Finalize
      const finalize = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          originalFilename: file.name,
          fileType: ext,
          fileSize: file.size,
        }),
      });
      const body = await finalize.json().catch(() => ({}));
      if (!finalize.ok) {
        if (body.error === "DUPLICATE_DOCUMENT") throw new Error("A document with this name and size already exists");
        throw new Error(body.error ?? "Failed to save document");
      }

      update(id, { state: "done" });
      onUploaded();
    } catch (err) {
      update(id, { state: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      void uploadFile(file);
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300",
          dragging
            ? "border-violet/70 bg-violet/10"
            : "border-white/[0.12] bg-white/[0.02] hover:border-violet/40 hover:bg-white/[0.03]",
        )}
      >
        <motion.div
          animate={dragging ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet/15 ring-1 ring-violet/30"
        >
          <UploadCloud className="h-6 w-6 text-violet-soft" />
        </motion.div>
        <p className="text-[15px] font-semibold text-ink">
          Drag &amp; drop or <span className="text-violet-soft">browse</span>
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          PDF, DOCX or TXT · up to 10 MB per file · multiple files supported
        </p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.li
                key={it.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                  {it.state === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-electric-bright" />
                  ) : it.state === "done" ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-red-300" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{it.name}</p>
                  <p className="text-[12px] text-muted">
                    {it.state === "uploading" && "Uploading…"}
                    {it.state === "done" && "Uploaded — queued for processing"}
                    {it.state === "error" && (it.error ?? "Failed")}
                  </p>
                </div>
                {it.state === "error" && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                    aria-label="Dismiss"
                    className="text-muted hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {it.state === "uploading" && (
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: "10%" }}
                      animate={{ width: "95%" }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse" }}
                      className="h-full rounded-full bg-gradient-to-r from-violet to-electric"
                    />
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
