"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Sidebar, { type SidebarData } from "@/components/app/Sidebar";
import Topbar from "@/components/app/Topbar";
import { ToastProvider } from "@/components/app/Toast";
import { cn } from "@/lib/utils";

export default function AppShell({
  data,
  children,
}: {
  data: SidebarData;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-base">
        {/* Desktop sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <Sidebar data={data} />
        </div>

        {/* Mobile drawer */}
        <motion.div
          initial={false}
          animate={{ x: mobileOpen ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="fixed inset-y-0 left-0 z-[70] w-72 lg:hidden"
        >
          <Sidebar data={data} onNavigate={() => setMobileOpen(false)} />
        </motion.div>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={cn("flex-1 px-5 pb-16 pt-6 sm:px-8 lg:px-10")}
          >
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </motion.main>
        </div>
      </div>
    </ToastProvider>
  );
}
