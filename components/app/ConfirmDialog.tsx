"use client";

import Modal from "@/components/app/Modal";
import { motion } from "motion/react";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  danger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <p className="text-[14px] leading-relaxed text-muted">{description}</p>}
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-white/5"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={
            danger
              ? "rounded-full bg-red-400/15 px-5 py-2.5 text-[14px] font-semibold text-red-200 ring-1 ring-red-400/30 transition-colors hover:bg-red-400/25"
              : "btn-primary px-5 py-2.5 text-[14px]"
          }
        >
          {confirmLabel}
        </motion.button>
      </div>
    </Modal>
  );
}
