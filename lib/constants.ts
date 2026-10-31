/** Fallback plan catalog used when the plans table is unreachable. */
export const PLAN_CATALOG = {
  free: {
    id: "free",
    name: "Starter",
    description: "For getting started with NOVA.",
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    monthlyCredits: 20,
    aiQuestions: 20,
    documentProcessing: 5,
    storageBytes: 2 * 1024 ** 3,
    projectsAllowed: false,
    priority: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For serious researchers and knowledge workers.",
    priceMonthlyCents: 1200,
    priceYearlyCents: 12000,
    monthlyCredits: 500,
    aiQuestions: 500,
    documentProcessing: 200,
    storageBytes: 20 * 1024 ** 3,
    projectsAllowed: true,
    priority: true,
  },
  team: {
    id: "team",
    name: "Research Team",
    description: "For teams collaborating on shared research.",
    priceMonthlyCents: 3900,
    priceYearlyCents: 39000,
    monthlyCredits: 5000,
    aiQuestions: 5000,
    documentProcessing: 2000,
    storageBytes: 100 * 1024 ** 3,
    projectsAllowed: true,
    priority: true,
  },
} as const;

export type PlanId = keyof typeof PLAN_CATALOG;

/** Credit costs per billable AI/document operation (units = credits). */
export const CREDIT_COSTS = {
  summary: 5,
  chat_question: 1,
  regenerate: 1,
  note_generate: 2,
  embedding_per_chunk: 0,
  document_extract: 1,
} as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_UPLOAD_BYTES_FALLBACK = 10 * 1024 * 1024;
export const SUPPORTED_FILE_TYPES = ["pdf", "docx", "txt"] as const;

export const SUMMARY_TYPES = [
  { id: "short", label: "Short summary" },
  { id: "detailed", label: "Detailed summary" },
  { id: "executive", label: "Executive summary" },
  { id: "academic", label: "Academic summary" },
  { id: "chapter", label: "Chapter-wise summary" },
  { id: "key_findings", label: "Key findings" },
  { id: "arguments", label: "Important arguments" },
  { id: "conclusions", label: "Conclusions" },
  { id: "methodology", label: "Research methodology" },
  { id: "limitations", label: "Limitations" },
  { id: "terminology", label: "Important terminology" },
] as const;

export type SummaryType = (typeof SUMMARY_TYPES)[number]["id"];

export const NOTIFICATION_TYPES = [
  "upload_success",
  "processing_completed",
  "processing_failed",
  "ai_analysis_completed",
  "credit_low",
  "subscription_updated",
  "payment_success",
  "payment_failed",
  "security_alert",
] as const;
