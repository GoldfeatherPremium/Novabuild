"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicConfig } from "@/lib/env-public";

export function createClient() {
  return createBrowserClient(
    publicConfig.supabaseUrl,
    publicConfig.supabaseAnonKey
  );
}
