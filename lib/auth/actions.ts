export async function login(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "SERVICE_NOT_CONFIGURED" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { ok: false, fieldErrors: { email: "Email and password are required" } };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { ok: false, fieldErrors: { email: "Please verify your email before signing in" } };
    }
    if (error.message.toLowerCase().includes("invalid login")) {
      return { ok: false, fieldErrors: { email: "Invalid email or password" } };
    }
    return { ok: false, error: error.message };
  }

  void remember;

  const next = String(formData.get("next") ?? "/app");
  redirect(next.startsWith("/") ? next : "/app");
}
