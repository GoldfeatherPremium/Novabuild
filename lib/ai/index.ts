import { aiConfig } from "@/lib/env";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-compatible";
import type { AIProvider } from "@/lib/ai/types";

let cachedProvider: AIProvider | null = null;

/**
 * Returns the configured AI provider, or null when AI is not configured.
 * Providers are created lazily from server-side env config.
 */
export function getProvider(): AIProvider | null {
  const cfg = aiConfig();
  if (!cfg.configured) return null;
  if (cachedProvider) return cachedProvider;

  const provider = new OpenAICompatibleProvider({
    provider: cfg.provider,
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: cfg.baseUrl,
    chatModel: cfg.chatModel,
    summaryModel: cfg.summaryModel,
    embeddingModel: cfg.embeddingModel,
  });
  cachedProvider = provider;
  return provider;
}

export function aiStatus() {
  const cfg = aiConfig();
  return {
    configured: cfg.configured,
    provider: cfg.provider,
    models: {
      chat: cfg.chatModel,
      summary: cfg.summaryModel,
      embeddings: cfg.embeddingModel,
    },
    notes: cfg.configured
      ? `Using ${cfg.provider} (chat: ${cfg.chatModel}; summary: ${cfg.summaryModel}; embeddings: ${cfg.embeddingModel})`
      : "AI provider not configured. Set AI_PROVIDER / AI_API_KEY / model env vars.",
  };
}

/** Rough cost estimate for reporting (USD). */
export function estimateCost(model: string | undefined, inputTokens: number, outputTokens: number): number {
  const rate = model?.toLowerCase().includes("gpt-4") ? 2.5 / 1e6 : 0.15 / 1e6;
  const outRate = model?.toLowerCase().includes("gpt-4") ? 10 / 1e6 : 0.6 / 1e6;
  return inputTokens * rate + outputTokens * outRate;
}
