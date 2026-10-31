/**
 * Centralized environment access + integration feature flags.
 * Server-only by default (imports "server-only" so it can never leak to the
 * browser). Public values are read from NEXT_PUBLIC_* vars.
 */
import "server-only";

/* ------------------------------------------------------------------ */
/*  Public (safe for the browser)                                      */
/* ------------------------------------------------------------------ */

export const publicConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
} as const;

/* ------------------------------------------------------------------ */
/*  Server-only secrets                                                */
/* ------------------------------------------------------------------ */

const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  aiProvider: process.env.AI_PROVIDER ?? "none",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiBaseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
  aiChatModel: process.env.AI_CHAT_MODEL ?? "",
  aiSummaryModel: process.env.AI_SUMMARY_MODEL ?? "",
  aiEmbeddingModel: process.env.AI_EMBEDDING_MODEL ?? "",
  billingProvider: process.env.BILLING_PROVIDER ?? "none",
  billingSecretKey: process.env.BILLING_SECRET_KEY ?? "",
  billingWebhookSecret: process.env.BILLING_WEBHOOK_SECRET ?? "",
  emailProvider: process.env.EMAIL_PROVIDER ?? "none",
  emailApiKey: process.env.EMAIL_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "NOVA <no-reply@example.com>",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
} as const;

/* ------------------------------------------------------------------ */
/*  Feature flags                                                      */
/* ------------------------------------------------------------------ */

export const isSupabaseConfigured = Boolean(
  publicConfig.supabaseUrl && publicConfig.supabaseAnonKey && serverEnv.supabaseServiceRoleKey
);

export function aiConfig() {
  const configured = serverEnv.aiProvider !== "none" && Boolean(serverEnv.aiApiKey);
  return {
    configured,
    provider: serverEnv.aiProvider,
    chatModel: serverEnv.aiChatModel,
    summaryModel: serverEnv.aiSummaryModel,
    embeddingModel: serverEnv.aiEmbeddingModel,
    baseUrl: serverEnv.aiBaseUrl,
  };
}

export function billingConfig() {
  const configured =
    serverEnv.billingProvider !== "none" && Boolean(serverEnv.billingSecretKey);
  return {
    configured,
    provider: serverEnv.billingProvider,
    webhookSecret: serverEnv.billingWebhookSecret,
    testMode: configured && !String(serverEnv.billingSecretKey).startsWith("sk_live_"),
  };
}

export function emailConfig() {
  const configured = serverEnv.emailProvider !== "none" && Boolean(serverEnv.emailApiKey);
  return {
    configured,
    provider: serverEnv.emailProvider,
    from: serverEnv.emailFrom,
  };
}

/** Integration status object — powers admin / settings status screens. */
export function integrationStatus() {
  return {
    supabase: { configured: isSupabaseConfigured, provider: "supabase" },
    ai: aiConfig(),
    billing: billingConfig(),
    email: emailConfig(),
  };
}
