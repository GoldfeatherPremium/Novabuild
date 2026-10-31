import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getAppData } from "@/lib/app-data";
import AppShell from "@/components/app/AppShell";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    // Surface a clear setup screen instead of a silent/ambiguous crash.
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-amber-300/25 bg-amber-300/[0.05] p-8 text-center">
          <h1 className="text-lg font-semibold text-amber-100">Supabase is not configured</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-amber-200/80">
            The application needs Supabase credentials to run. Add{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            to your environment, then apply the SQL migrations in <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px]">supabase/migrations</code>.
          </p>
        </div>
      </div>
    );
  }

  const user = await requireUser();
  const data = await getAppData(user.id);

  // Send incomplete onboarding users to onboarding.
  if (!data.onboarded) {
    redirect("/onboarding");
  }

  return <AppShell data={data}>{children}</AppShell>;
}
