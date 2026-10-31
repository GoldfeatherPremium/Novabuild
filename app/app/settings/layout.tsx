"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShieldCheck, SlidersHorizontal, HardDrive, CreditCard, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/settings/profile", label: "Profile", icon: User },
  { href: "/app/settings/security", label: "Security", icon: ShieldCheck },
  { href: "/app/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/app/settings/storage", label: "Storage", icon: HardDrive },
  { href: "/app/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings/account", label: "Account", icon: UserX },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] leading-tight text-ink">Settings</h1>
        <p className="mt-1 text-[13.5px] text-muted">Manage your account, security, preferences and billing.</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-4" aria-label="Settings">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors",
                active ? "border border-violet/40 bg-violet/15 text-violet-soft" : "text-muted hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
