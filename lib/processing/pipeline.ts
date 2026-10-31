import { createClient } from "@/lib/supabase/server";
import { downloadObject } from "@/lib/documents/storage";
import { extractText, shouldOcr } from "@/lib/processing/extract";
import { chunkText } from "@/lib/processing/chunk";
import { getProvider } from "@/lib/ai/index";
import { createNotification } from "@/lib/notifications";
import { validateFile } from "@/lib/documents/validate";

const MAX_PROCESS_SECONDS = 120;

/**
 * Run the document processing pipeline synchronously within a request:
 *
 *   queued → running → extract → chunk → embed → completed
 *
 * If any step fails, the job is marked failed (with retry bookkeeping) and
 * the document status becomes "failed". Idempotent: processing a document
 * that already has chunks resets and re-runs cleanly.
 */
export async function processDocument(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const deadline = Date.now() + MAX_PROCESS_SECONDS * 1000;
  const supabase = createClient();

  // Fetch document + ownership in one query.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, workspace_id, owner_id, title, original_filename, file_type, file_size, storage_path, status")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.status === "processing" || doc.status === "queued") {
    return { ok: false, error: "Document is already being processed" };
  }

  // Claim the job atomically.
  const jobId = crypto.randomUUID();
  await supabase.from("document_processing_jobs").insert({
    id: jobId,
    document_id: documentId,
    status: "running",
    attempts: 1,
    started_at: new Date().toISOString(),
  });
  await supabase.from("documents").update({ status: "processing", error_message: null }).eq("id", documentId);

  try {
    // 1. Download object (validates it exists).
    const buf = await downloadObject(doc.storage_path);

    if (Date.now() > deadline) throw new Error("Processing timeout");

    // 2. Re-validate magic bytes server-side.
    const validation = validateFile({
      name: doc.original_filename,
      size: doc.file_size,
      buffer: await buf.arrayBuffer(),
    });
    if (!validation.ok) throw new Error(validation.error ?? "Invalid file");

    // 3. Extract text.
    const extracted = await extractText(doc.file_type as "pdf" | "docx" | "txt", Buffer.from(await buf.arrayBuffer()));

    if (Date.now() > deadline) throw new Error("Processing timeout");

    if (!extracted.text.trim()) {
      if (shouldOcr("")) {
        throw new Error(
          "No extractable text found — this looks like a scanned document. OCR is not yet configured; upload a text-based PDF."
        );
      }
      throw new Error("No extractable text found");
    }

    // 4. Chunk.
    const chunks = chunkText(extracted.text);

    // 5. Clear previous chunks/embeddings (idempotent re-run).
    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    // 6. Insert chunks (batch).
    const chunkRows = chunks.map((c) => ({
      document_id: documentId,
      idx: c.idx,
      content: c.content,
      char_count: c.charCount,
      page_hint: c.pageHint,
    }));
    const { error: chunkError } = await supabase.from("document_chunks").insert(chunkRows);
    if (chunkError) throw new Error(chunkError.message);

    // 7. Embed chunks if a provider is configured (best-effort; retrieval has
    //    a keyword fallback when embeddings are unavailable).
    const provider = getProvider();
    if (provider && chunks.length > 0) {
      try {
        const batch = 64;
        for (let i = 0; i < chunks.length; i += batch) {
          const slice = chunks.slice(i, i + batch);
          const embedded = await provider.embeddings({ input: slice.map((c) => c.content) });
          if (embedded.embeddings.length === slice.length) {
            for (let j = 0; j < slice.length; j++) {
              await supabase
                .from("document_chunks")
                .update({ embedding: embedded.embeddings[j] })
                .eq("document_id", documentId)
                .eq("idx", slice[j].idx);
            }
          }
        }
      } catch {
        // Embeddings are optional — leave null and rely on keyword retrieval.
      }
    }

    if (Date.now() > deadline) throw new Error("Processing timeout");

    // 8. Mark completed.
    await supabase.from("documents").update({
      status: "completed",
      extracted_text_available: true,
      page_count: extracted.pageCount ?? null,
    }).eq("id", documentId);

    await supabase.from("document_processing_jobs").update({
      status: "succeeded",
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);

    await createNotification({
      userId: doc.owner_id,
      type: "processing_completed",
      title: `“${doc.title}” is ready`,
      body: "Text extracted and indexed. You can summarize it or ask questions.",
      data: { documentId },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";

    await supabase.from("documents").update({
      status: "failed",
      error_message: message,
    }).eq("id", documentId);

    await supabase.from("document_processing_jobs").update({
      status: "failed",
      last_error: message,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);

    await createNotification({
      userId: doc.owner_id,
      type: "processing_failed",
      title: `“${doc.title}” could not be processed`,
      body: message,
      data: { documentId },
    });

    return { ok: false, error: message };
  }
}
