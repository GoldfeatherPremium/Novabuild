import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicConfig } from "@/lib/env-public";
import { isSupabaseConfigured } from "@/lib/env";

/** OAuth + email-verification redirect handler. */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/?auth=unconfigured", publicConfig.appUrl));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin));
  }

  const supabase = createClient();

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin));
    }
  }

  // Send first-time users to onboarding.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    const target = next.startsWith("/") ? next : "/app";
    if (!profile?.onboarded && !target.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", origin));
    }
    if (target.startsWith("/onboarding") && profile?.onboarded) {
      return NextResponse.redirect(new URL("/app", origin));
    }
    return NextResponse.redirect(new URL(target, origin));
  }

  return NextResponse.redirect(new URL("/login", origin));
}
