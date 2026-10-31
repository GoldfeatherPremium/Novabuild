import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import PreferencesForm from "@/components/app/PreferencesForm";

export const dynamic = "force-dynamic";

export default async function PreferencesSettingsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();

  return (
    <PreferencesForm
      data={{
        theme: prefs?.theme ?? "dark",
        language: prefs?.language ?? "en",
        notifyEmail: prefs?.notify_email ?? true,
        aiModelPref: prefs?.ai_model_pref ?? "",
      }}
    />
  );
}
