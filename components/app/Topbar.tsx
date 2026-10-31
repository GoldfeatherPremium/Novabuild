"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, LogOut, User, CreditCard, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { logout } from "@/lib/auth/actions";

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/app/documents?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-base/70 px-5 backdrop-blur-2xl supports-[backdrop-filter]:bg-base/60 sm:px-8 lg:px-10">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink lg:hidden"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <form onSubmit={submitSearch} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search documents, notes, conversations…"
          aria-label="Search"
          className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[13.5px] text-ink placeholder:text-muted/60 outline-none transition-all focus:border-violet/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet/15"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/app/notifications"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <Bell className="h-4.5 w-4.5" />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-violet/30 bg-violet/10 text-violet-soft transition-colors hover:bg-violet/20"
          >
            <User className="h-4.5 w-4.5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-white/[0.10] bg-surface p-2 shadow-card"
                >
                  <Link
                    href="/app/settings/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-white/5"
                  >
                    <User className="h-4 w-4 text-muted" /> Profile
                  </Link>
                  <Link
                    href="/app/settings/billing"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-white/5"
                  >
                    <CreditCard className="h-4 w-4 text-muted" /> Billing
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={async () => {
                      setSigningOut(true);
                      await logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-red-200 transition-colors hover:bg-red-400/10 disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
