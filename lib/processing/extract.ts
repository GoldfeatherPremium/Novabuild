import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

export interface ExtractedText {
  text: string;
  pageCount?: number | null;
}

/**
 * Extract plain text from a supported document buffer. Never executes the
 * uploaded file; pure parsing only.
 */
export async function extractText(fileType: "pdf" | "docx" | "txt", buffer: Buffer): Promise<ExtractedText> {
  switch (fileType) {
    case "pdf": {
      const result = await pdfParse(buffer);
      return { text: result.text ?? "", pageCount: result.numpages ?? null };
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value ?? "", pageCount: null };
    }
    case "txt": {
      return { text: buffer.toString("utf-8"), pageCount: null };
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/** Heuristic OCR flag — could hook into an OCR service when configured. */
export function shouldOcr(text: string): boolean {
  if (!text.trim()) return true;
  const letters = text.replace(/[^a-zA-Z]/g, "").length;
  const total = text.length || 1;
  return letters / total < 0.2; // very few letters => likely scanned image
}
