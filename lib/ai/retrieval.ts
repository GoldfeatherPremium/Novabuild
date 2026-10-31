import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/index";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageHint: number | null;
  similarity: number | null;
  sourceLabel: string;
}

/**
 * Retrieval-augmented search over a workspace's documents.
 *
 * Strategy:
 *  1. If embeddings are configured, embed the query and use the pgvector RPC
 *     (match_documents) with a fallback to keyword search on failure.
 *  2. Otherwise (or when vector is unavailable) do a deterministic keyword
 *     retrieval over chunks (term-overlap scoring).
 *
 * The returned chunks are always real passages from real documents — never
 * fabricated. If nothing matches, an empty array is returned and the chat
 * layer says so honestly.
 */
export async function retrieve(
  workspaceId: string,
  question: string,
  opts: { documentIds?: string[]; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const limit = opts.limit ?? 6;
  const supabase = createClient();
  const provider = getProvider();

  if (provider) {
    try {
      const embedded = await provider.embeddings({ input: [question] });
      if (embedded.embeddings.length > 0) {
        const { data, error } = await supabase.rpc("match_documents", {
          workspace_id: workspaceId,
          query_embedding: embedded.embeddings[0],
          match_count: limit,
          filter_document_ids: opts.documentIds?.length ? opts.documentIds : null,
        });
        if (!error && data && Array.isArray(data)) {
          const docIds = data.map((d) => d.document_id);
          const { data: docs } = await supabase
            .from("documents")
            .select("id, title")
            .in("id", docIds.length ? docIds : [""]);
          const titleMap = new Map((docs ?? []).map((d) => [d.id, d.title]));
          return data.map((d) => ({
            chunkId: d.chunk_id,
            documentId: d.document_id,
            documentTitle: titleMap.get(d.document_id) ?? "Document",
            content: d.content,
            pageHint: d.page_hint,
            similarity: d.similarity,
            sourceLabel: titleMap.get(d.document_id) ?? "Document",
          }));
        }
      }
    } catch {
      // Fall through to keyword retrieval.
    }
  }

  return keywordRetrieve(supabase, workspaceId, question, opts.documentIds, limit);
}

async function keywordRetrieve(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  question: string,
  documentIds: string[] | undefined,
  limit: number
): Promise<RetrievedChunk[]> {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 12);

  if (terms.length === 0) return [];

  let query = supabase
    .from("document_chunks")
    .select("id, document_id, content, page_hint")
    .eq("document_id", supabase.from("documents").select("id").eq("workspace_id", workspaceId)) // placeholder replaced below
    .limit(2000);

  // NOTE: the placeholder select above is replaced by the explicit join query
  // below for clarity/correctness.
  const { data: docRows } = await supabase
    .from("documents")
    .select("id, title")
    .eq("workspace_id", workspaceId)
    .in("id", documentIds?.length ? documentIds : [""]);

  void query;
  const allowedIds = documentIds?.length ? documentIds : (docRows ?? []).map((d) => d.id);

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, page_hint")
    .in("document_id", allowedIds.length ? allowedIds : [""])
    .limit(4000);

  if (error || !chunks) return [];

  const scored = chunks
    .map((c) => {
      const text = c.content.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (text.includes(t)) score += 1;
        // bonus for exact phrase proximity
        if (text.includes(question.toLowerCase())) score += 3;
      }
      return { chunk: c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const titleMap = new Map((docRows ?? []).map((d) => [d.id, d.title]));
  return scored.map(({ chunk }) => ({
    chunkId: chunk.id,
    documentId: chunk.document_id,
    documentTitle: titleMap.get(chunk.document_id) ?? "Document",
    content: chunk.content,
    pageHint: chunk.page_hint,
    similarity: null,
    sourceLabel: titleMap.get(chunk.document_id) ?? "Document",
  }));
}
