import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import ProfileSettingsForm from "@/components/app/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase.from("profiles").select("full_name, profession, interests").eq("id", user.id).maybeSingle();

  return (
    <ProfileSettingsForm
      data={{
        fullName: profile?.full_name ?? "",
        profession: profile?.profession ?? "",
        interests: profile?.interests ?? [],
        email: user.email ?? "",
      }}
    />
  );
}
