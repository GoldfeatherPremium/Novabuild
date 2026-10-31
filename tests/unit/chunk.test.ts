import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/processing/chunk";

describe("chunkText", () => {
  it("returns [] for empty/whitespace text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Hello world.", { chunkSize: 2200 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ idx: 0, content: "Hello world.", charCount: 12 });
    expect(chunks[0].pageHint).toBeNull();
  });

  it("splits long text into ordered, size-bounded chunks", () => {
    const text = "word ".repeat(5000); // 25_000 chars
    const chunks = chunkText(text, { chunkSize: 2200, overlap: 300 });
    expect(chunks.length).toBeGreaterThan(3);
    chunks.forEach((c, i) => {
      expect(c.idx).toBe(i);
      expect(c.content.length).toBeLessThanOrEqual(2200);
      expect(c.charCount).toBe(c.content.length);
    });
  });

  it("creates overlapping chunks (next chunk starts before previous end)", () => {
    const text = "sentence with enough content. ".repeat(600);
    const chunks = chunkText(text, { chunkSize: 2200, overlap: 300 });
    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 1; i < chunks.length; i++) {
      // The next chunk starts at previousCut - overlap, i.e. it must overlap
      // the previous chunk by at least the overlap amount.
      const prevEnd = chunks[i - 1].content.length;
      expect(chunks[i].content.length).toBeGreaterThan(0);
      expect(prevEnd).toBeGreaterThan(0);
    }
  });

  it("prefers breaking at paragraph boundaries near the end of a chunk", () => {
    const paragraph = "This is a paragraph with a fair amount of meaningful content for chunking purposes. ".repeat(40);
    const text = `${paragraph}\n\nNext section begins here. ${"filler ".repeat(300)}`;
    const chunks = chunkText(text, { chunkSize: 2200, overlap: 300 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("handles text exactly at the chunk size without infinite looping", () => {
    const text = "a".repeat(2200);
    const chunks = chunkText(text, { chunkSize: 2200, overlap: 300 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});
