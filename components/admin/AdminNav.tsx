"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Layers, BriefcaseBusiness, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: Layers },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/settings", label: "System", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-4" aria-label="Admin">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors",
              active ? "border border-violet/40 bg-violet/15 text-violet-soft" : "text-muted hover:text-ink"
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-violet-soft")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
