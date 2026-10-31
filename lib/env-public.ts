/**
 * Public (browser-safe) env values. Kept separate from lib/env.ts so
 * client components never import the server-only module.
 */
export const publicConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
} as const;

export const isSupabaseConfiguredPublic = Boolean(
  publicConfig.supabaseUrl && publicConfig.supabaseAnonKey
);
