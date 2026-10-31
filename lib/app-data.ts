import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/subscriptions";

/** Fetch the shared app-shell data (profile, workspace, credits, plan). */
export async function getAppData(userId: string) {
  const supabase = createClient();

  const [profileRes, membershipRes, creditsRes, unreadRes] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, onboarded, role, suspended").eq("id", userId).maybeSingle(),
    supabase.from("workspace_members").select("workspaces(name)").eq("user_id", userId).limit(1),
    supabase.from("credit_accounts").select("balance").eq("user_id", userId).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);

  const plan = await getPlanForUser(userId);

  // workspaces is a to-many relationship -> array; take the first member's workspace.
  const workspaceRow = membershipRes.data?.[0]?.workspaces as unknown as
    | { name?: string }[]
    | { name?: string }
    | null
    | undefined;
  const workspaceName = Array.isArray(workspaceRow)
    ? workspaceRow[0]?.name
    : workspaceRow?.name;

  return {
    fullName: profileRes.data?.full_name ?? "Researcher",
    avatarUrl: profileRes.data?.avatar_url ?? null,
    role: profileRes.data?.role ?? "user",
    onboarded: profileRes.data?.onboarded ?? true,
    suspended: profileRes.data?.suspended ?? false,
    workspaceName: workspaceName ?? "My Research Workspace",
    credits: creditsRes.data?.balance ?? 0,
    planId: plan.planId,
    unreadNotifications: unreadRes.count ?? 0,
  };
}

export async function getWorkspaceId(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1);
  return data?.[0]?.workspace_id ?? null;
}
