"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicConfig } from "@/lib/env-public";
import { isSupabaseConfigured } from "@/lib/env";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

export async function register(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "SERVICE_NOT_CONFIGURED" };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { fullName, email, password, confirmPassword } = parsed.data;
  if (password !== confirmPassword) {
    return { ok: false, fieldErrors: { confirmPassword: "Passwords do not match" } };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${publicConfig.appUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { ok: false, fieldErrors: { email: "An account with this email already exists" } };
    }
    return { ok: false, error: error.message };
  }

  // If a session is created immediately (email confirmation disabled), send the
  // user straight to onboarding.
  if (data.session) {
    redirect("/onboarding");
  }
  return { ok: true };
}

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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { shouldCreateUser: false },
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { ok: false, fieldErrors: { email: "Please verify your email before signing in" } };
    }
    if (error.message.toLowerCase().includes("invalid login")) {
      return { ok: false, fieldErrors: { email: "Invalid email or password" } };
    }
    return { ok: false, error: error.message };
  }

  if (!remember) {
    // Sessions are short-lived by default; keep default.
    void supabase;
  }

  const next = String(formData.get("next") ?? "/app");
  redirect(next.startsWith("/") ? next : "/app");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "SERVICE_NOT_CONFIGURED" };
  }
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, fieldErrors: { email: "Enter your email" } };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicConfig.appUrl}/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (password !== confirm) return { ok: false, error: "Passwords do not match" };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resendVerification(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, fieldErrors: { email: "Enter your email" } };
  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${publicConfig.appUrl}/auth/callback?next=/onboarding` },
  });
  if (error) {
    return { ok: false, error: error.message.includes("rate limit") ? "Please wait a moment and try again" : error.message };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Profile / account management                                       */
/* ------------------------------------------------------------------ */

export async function updateProfile(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const interests = String(formData.get("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (fullName.length < 2) return { ok: false, fieldErrors: { fullName: "Enter your full name" } };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, profession: profession || null, interests })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings/profile");
  return { ok: true };
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  const file = formData.get("avatar") as File | null;
  if (!file) return { ok: false, error: "No file selected" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Avatar must be an image" };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Avatar must be under 2 MB" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `avatars/${user.id}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings/profile");
  return { ok: true };
}

export async function changeEmail(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) return { ok: false, fieldErrors: { email: "Enter a valid email" } };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${publicConfig.appUrl}/auth/callback?next=/app/settings/profile` });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changePassword(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!passwordSchema.safeParse(next).success) {
    return { ok: false, error: "New password must be at least 8 characters with upper, lower and a number" };
  }
  if (next !== confirm) return { ok: false, error: "New passwords do not match" };

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: (await supabase.auth.getUser()).data.user?.email ?? "",
    password: current,
  });
  if (verifyError) return { ok: false, error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAccount(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "DELETE") return { ok: false, error: "Type DELETE to confirm" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Delete user (auth.users cascade removes profile + owned records). Storage
  // objects are removed by a cleanup job / storage trigger; we clear the
  // user's document objects here for a tidy wipe.
  const { data: docs } = await supabase.from("documents").select("storage_path").eq("owner_id", user.id);
  for (const doc of docs ?? []) {
    await supabase.storage.from("documents").remove([doc.storage_path]);
  }

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  redirect("/");
}

export async function exportData(): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const userId = user.id;
  const [profile, docs, conversations, notes, projects, transactions] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("documents").select("id,title,original_filename,file_type,file_size,status,created_at").eq("owner_id", userId),
    supabase.from("conversations").select("id,title,created_at").eq("owner_id", userId),
    supabase.from("notes").select("id,title,created_at,updated_at").eq("owner_id", userId),
    supabase.from("research_projects").select("id,name,description,created_at").eq("owner_id", userId),
    supabase.from("payment_transactions").select("*").eq("user_id", userId),
  ]);

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      documents: docs.data ?? [],
      conversations: conversations.data ?? [],
      notes: notes.data ?? [],
      projects: projects.data ?? [],
      transactions: transactions.data ?? [],
    },
  };
}
