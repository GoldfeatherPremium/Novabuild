import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  completed: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  succeeded: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  processing: "border-electric/30 bg-electric/10 text-electric-bright",
  running: "border-electric/30 bg-electric/10 text-electric-bright",
  queued: "border-amber-300/25 bg-amber-300/10 text-amber-200/90",
  uploading: "border-amber-300/25 bg-amber-300/10 text-amber-200/90",
  failed: "border-red-400/25 bg-red-400/10 text-red-300",
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  past_due: "border-amber-300/25 bg-amber-300/10 text-amber-200/90",
  canceled: "border-muted/25 bg-white/[0.04] text-muted",
  trialing: "border-electric/30 bg-electric/10 text-electric-bright",
};

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium capitalize",
        STATUS_STYLES[status] ?? "border-white/10 bg-white/[0.04] text-muted",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
