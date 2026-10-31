import { MAX_UPLOAD_BYTES, SUPPORTED_FILE_TYPES } from "@/lib/constants";

export interface FileValidation {
  ok: boolean;
  error?: string;
  fileType?: "pdf" | "docx" | "txt";
}

const MAGIC: Record<string, Array<[number[], number]>> = {
  pdf: [[[0x25, 0x50, 0x44, 0x46], 0]], // %PDF
  docx: [
    [[0x50, 0x4b, 0x03, 0x04], 0], // PK\x03\x04 (zip)
    [[0x50, 0x4b, 0x05, 0x06], 0],
    [[0x50, 0x4b, 0x07, 0x08], 0],
  ],
};

function sniffType(buffer: ArrayBuffer): "pdf" | "docx" | null {
  const bytes = new Uint8Array(buffer);
  for (const [type, signatures] of Object.entries(MAGIC)) {
    for (const [magic, offset] of signatures) {
      if (bytes.length >= offset + magic.length) {
        let match = true;
        for (let i = 0; i < magic.length; i++) {
          if (bytes[offset + i] !== magic[i]) {
            match = false;
            break;
          }
        }
        if (match) return type as "pdf" | "docx";
      }
    }
  }
  return null;
}

/**
 * Validate a file on both declared extension AND actual content (magic
 * bytes). Prevents spoofed filenames from being processed.
 */
export function validateFile(input: { name: string; size: number; buffer?: ArrayBuffer }): FileValidation {
  const ext = input.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_FILE_TYPES.includes(ext as never)) {
    return { ok: false, error: "Unsupported file type. Upload PDF, DOCX or TXT." };
  }
  if (input.size <= 0) {
    return { ok: false, error: "File is empty." };
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File exceeds the 10 MB limit." };
  }

  let fileType = ext as "pdf" | "docx" | "txt";

  if (input.buffer && ext !== "txt") {
    const sniffed = sniffType(input.buffer);
    if (sniffed !== ext) {
      return {
        ok: false,
        error: `File content does not match its extension (detected ${sniffed ?? "unknown"}).`,
      };
    }
  }

  return { ok: true, fileType };
}
