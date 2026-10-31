export interface Chunk {
  idx: number;
  content: string;
  charCount: number;
  pageHint: number | null;
}

/**
 * Split extracted text into overlapping chunks. Chunks are the unit of
 * retrieval, embedding, and citation.
 */
export function chunkText(
  text: string,
  opts: { chunkSize?: number; overlap?: number; pageMarkers?: boolean } = {}
): Chunk[] {
  const chunkSize = opts.chunkSize ?? 2200;
  const overlap = opts.overlap ?? 300;

  if (!text.trim()) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);

    // Try to break at a sentence/paragraph boundary near the end.
    let cut = end;
    if (end < text.length) {
      const window = text.slice(Math.max(start, end - 400), end);
      const lastBoundary = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("\n")
      );
      if (lastBoundary > 200) {
        cut = start + (end - Math.max(start, end - 400)) - (window.length - lastBoundary);
      }
    }

    const content = text.slice(start, cut).trim();
    if (content) {
      chunks.push({ idx, content, charCount: content.length, pageHint: null });
      idx += 1;
    }

    if (cut <= start) break; // safety
    if (cut >= text.length) break; // consumed everything — stop here

    start = Math.max(cut - overlap, start + 1);
  }

  return chunks;
}
