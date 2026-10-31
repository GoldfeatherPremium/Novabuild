import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { LayoutDashboard, Users, Layers, BriefcaseBusiness, Settings, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: Layers },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/settings", label: "System", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet/30 bg-violet/10">
              <ShieldCheck className="h-5 w-5 text-violet-soft" />
            </span>
            <div>
              <h1 className="font-serif text-[24px] leading-tight text-ink">NOVA Admin</h1>
              <p className="text-[12.5px] text-muted">Server-verified role. Sensitive actions are audited.</p>
            </div>
          </div>
          <Link href="/app" className="text-[13px] font-medium text-violet-soft hover:text-ink">← Back to app</Link>
        </div>
        <nav className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-4" aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors"
              style={{}} 
              data-active={undefined}
            >
              <item.icon className="h-4 w-4 text-muted" />
              <span className="text-muted">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
