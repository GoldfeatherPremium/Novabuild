import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import NotificationsList, { type NotificationItem } from "@/components/app/NotificationsList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, title, body, data, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (rows ?? []) as NotificationItem[];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet/25 bg-violet/10">
          <Bell className="h-5 w-5 text-violet-soft" />
        </span>
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-ink">Notifications</h1>
          <p className="mt-0.5 text-[13.5px] text-muted">Updates about your documents, AI and billing.</p>
        </div>
      </div>
      <NotificationsList initial={items} unread={unread} />
    </div>
  );
}
