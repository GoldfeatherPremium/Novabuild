import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase.from("profiles").select("full_name, profession, interests, onboarded").eq("id", user.id).maybeSingle();
  if (profile?.onboarded) redirect("/app");

  const { data: memberships } = await supabase.from("workspace_members").select("workspaces(name, description)").eq("user_id", user.id).limit(1);
  const ws = memberships?.[0]?.workspaces as unknown as { name?: string; description?: string } | { name?: string; description?: string }[] | null | undefined;
  const first = Array.isArray(ws) ? ws[0] : ws;

  return (
    <OnboardingClient
      initial={{
        fullName: profile?.full_name ?? "",
        profession: profile?.profession ?? "",
        interests: profile?.interests ?? [],
        workspaceName: first?.name ?? "My Research Workspace",
        workspaceDescription: first?.description ?? "",
      }}
    />
  );
}
