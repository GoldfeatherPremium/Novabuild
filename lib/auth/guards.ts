import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth guard for pages. Redirects to /login with a next param.
 * Never trusts client-side state.
 */
export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Server-side admin guard. Verifies the role from the database (profiles),
 * never from the client.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/app");
  }
  return { user, profile };
}

/** Returns the user, or null (for components that render a fallback). */
export async function optionalUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
