import type { AIProvider, ChatParams, ChatResult, EmbeddingParams, EmbeddingResult, ProviderConfig } from "@/lib/ai/types";

/**
 * Provider-independent adapter for any OpenAI-compatible chat/embeddings API.
 * Uses fetch directly — no provider SDK required.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(private config: ProviderConfig) {}

  private get base() {
    return this.config.baseUrl.replace(/\/$/, "");
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    const started = Date.now();
    const model = params.model ?? this.config.chatModel;

    const messages = params.messages.map((m) => ({ role: m.role, content: m.content }));
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: params.temperature ?? 0.3,
    };
    if (params.maxTokens) body.max_tokens = params.maxTokens;
    if (params.json) body.response_format = { type: "json_object" };

    const res = await fetch(`${this.base}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: params.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const usage = json.usage
      ? {
          inputTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        }
      : undefined;

    return {
      content: json.choices?.[0]?.message?.content ?? "",
      model,
      usage,
      latencyMs: Date.now() - started,
    };
  }

  async embeddings(params: EmbeddingParams): Promise<EmbeddingResult> {
    const started = Date.now();
    const model = params.model ?? this.config.embeddingModel;

    const res = await fetch(`${this.base}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model, input: params.input }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Embeddings provider error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      usage?: { prompt_tokens: number; total_tokens: number };
    };

    return {
      embeddings: (json.data ?? []).map((d) => d.embedding),
      model,
      usage: json.usage
        ? { inputTokens: json.usage.prompt_tokens, totalTokens: json.usage.total_tokens }
        : undefined,
      latencyMs: Date.now() - started,
    };
  }
}
