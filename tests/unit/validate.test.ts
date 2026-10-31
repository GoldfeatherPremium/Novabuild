import { describe, expect, it } from "vitest";
import { validateFile } from "@/lib/documents/validate";

const MB = 1024 * 1024;

function pdfBuffer(): ArrayBuffer {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31, 0x2e, 0x34]).buffer; // %PDF-1.4
}

function zipBuffer(): ArrayBuffer {
  // ZIP local file header magic: PK\x03\x04
  return new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]).buffer;
}

function fakeBuffer(): ArrayBuffer {
  return new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]).buffer;
}

describe("validateFile", () => {
  it("rejects unsupported extensions", () => {
    const result = validateFile({ name: "malware.exe", size: 10 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects empty files", () => {
    const result = validateFile({ name: "empty.pdf", size: 0, buffer: pdfBuffer() });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("File is empty.");
  });

  it("rejects oversized files", () => {
    const result = validateFile({ name: "big.pdf", size: 10 * MB + 1, buffer: pdfBuffer() });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("10 MB limit");
  });

  it("accepts txt by extension (no content check)", () => {
    const result = validateFile({ name: "notes.txt", size: 12 });
    expect(result.ok).toBe(true);
    expect(result.fileType).toBe("txt");
  });

  it("accepts a real PDF (magic bytes match)", () => {
    const result = validateFile({ name: "paper.pdf", size: 7, buffer: pdfBuffer() });
    expect(result.ok).toBe(true);
    expect(result.fileType).toBe("pdf");
  });

  it("accepts a real DOCX (zip magic bytes match)", () => {
    const result = validateFile({ name: "doc.docx", size: 6, buffer: zipBuffer() });
    expect(result.ok).toBe(true);
    expect(result.fileType).toBe("docx");
  });

  it("rejects a PDF whose content is not a PDF (spoofed extension)", () => {
    const result = validateFile({ name: "fake.pdf", size: 6, buffer: fakeBuffer() });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("content does not match");
  });

  it("rejects a DOCX whose content is not a zip", () => {
    const result = validateFile({ name: "fake.docx", size: 6, buffer: fakeBuffer() });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("content does not match");
  });

  it("accepts a PDF even when no buffer is provided (client-side path)", () => {
    const result = validateFile({ name: "paper.pdf", size: 100 });
    expect(result.ok).toBe(true);
    expect(result.fileType).toBe("pdf");
  });
});
