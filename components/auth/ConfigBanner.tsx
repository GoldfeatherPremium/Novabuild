import { isSupabaseConfiguredPublic } from "@/lib/env-public";

export default function ConfigBanner() {
  if (isSupabaseConfiguredPublic) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-[13px] leading-relaxed text-amber-200/90">
      <span className="font-semibold">Supabase is not configured yet.</span>{" "}
      Add <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
      to your environment to enable accounts.
    </div>
  );
}
