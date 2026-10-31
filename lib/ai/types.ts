export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}

export interface ChatResult {
  content: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  latencyMs: number;
}

export interface EmbeddingParams {
  input: string[];
  model?: string;
}

export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  usage?: { inputTokens: number; totalTokens: number };
  latencyMs: number;
}

export interface AIProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResult>;
  embeddings(params: EmbeddingParams): Promise<EmbeddingResult>;
}

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  summaryModel: string;
  embeddingModel: string;
}

/** Structural output used for parsed AI responses. */
export interface StructuredSummary {
  title?: string;
  overview?: string;
  sections: Array<{ heading: string; body: string }>;
  key_points: string[];
}
