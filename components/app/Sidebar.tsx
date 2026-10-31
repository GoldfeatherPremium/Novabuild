"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  MessageSquareText,
  NotebookPen,
  Share2,
  History,
  Settings,
  Sparkles,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarData {
  fullName: string;
  avatarUrl: string | null;
  planId: string;
  credits: number;
  workspaceName: string;
}

const NAV = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard, exact: true },
  { label: "Documents", href: "/app/documents", icon: FileText },
  { label: "Research projects", href: "/app/projects", icon: FolderKanban },
  { label: "AI chat", href: "/app/chat", icon: MessageSquareText },
  { label: "Notes", href: "/app/notes", icon: NotebookPen },
  { label: "Knowledge graph", href: "/app/knowledge", icon: Share2 },
  { label: "History", href: "/app/history", icon: History },
];

export default function Sidebar({
  data,
  onNavigate,
}: {
  data: SidebarData;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-surface/40">
      {/* Logo */}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5"
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden>
          <defs>
            <linearGradient id="sidebar-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8E7CFF" />
              <stop offset="1" stopColor="#41A6FF" />
            </linearGradient>
          </defs>
          <rect x="14.2" y="2.5" width="3.6" height="27" rx="1.8" fill="url(#sidebar-logo)" transform="rotate(45 16 16)" />
          <rect x="14.2" y="2.5" width="3.6" height="27" rx="1.8" fill="url(#sidebar-logo)" transform="rotate(-45 16 16)" />
          <circle cx="16" cy="16" r="3.1" fill="#0A0D1C" stroke="url(#sidebar-logo)" strokeWidth="2" />
        </svg>
        <span className="text-[17px] font-bold tracking-[0.08em] text-ink">NOVA</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="App">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-200",
                active ? "text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-violet/25 bg-violet/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className={cn("relative h-4.5 w-4.5", active ? "text-violet-soft" : "")} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-3">
          <Link
            href="/app/settings/profile"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-200",
              pathname.startsWith("/app/settings") ? "text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink",
            )}
          >
            <Settings className="h-4.5 w-4.5" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Plan card */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-soft" />
            <span className="text-[13px] font-semibold capitalize text-ink">{data.planId} plan</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-muted">Credits remaining</span>
              <span className="tabular text-[15px] font-semibold text-ink">{data.credits}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, data.credits)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-violet to-electric"
              />
            </div>
          </div>
          <Link
            href="/app/settings/billing"
            onClick={onNavigate}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 py-2 text-[12.5px] font-semibold text-violet-soft transition-colors hover:bg-violet/20"
          >
            <Gem className="h-3.5 w-3.5" />
            Upgrade plan
          </Link>
        </div>
      </div>
    </div>
  );
}
