import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import ProfileSettingsPage from "./page";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPageServer() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase.from("profiles").select("full_name, profession, interests").eq("id", user.id).maybeSingle();

  return (
    <ProfileSettingsPage
      data={{
        fullName: profile?.full_name ?? "",
        profession: profile?.profession ?? "",
        interests: profile?.interests ?? [],
        email: user.email ?? "",
      }}
    />
  );
}
