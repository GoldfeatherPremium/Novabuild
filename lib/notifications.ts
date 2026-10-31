import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/notifications-types";

export type { NotificationType } from "@/lib/notifications-types";

/**
 * Create an in-app notification for a user.
 *
 * Defaults to the cookie-authenticated client (RLS applies against the signed-in
 * user). Callers in unsigned-in contexts (e.g. Stripe webhooks) may pass a
 * service-role client via `client` so inserts aren't silently dropped by RLS.
 */
export async function createNotification(
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  },
  client?: ReturnType<typeof createClient>
) {
  const supabase = client ?? createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    data: input.data ?? {},
  });
  return { error };
}

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  return supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: null };
  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

export async function deleteNotification(id: string) {
  const supabase = createClient();
  return supabase.from("notifications").delete().eq("id", id);
}
