import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  PipelineContext,
  IngestInput,
  IngestResult,
  ExtractedContent,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// PipelineContext
// ─────────────────────────────────────────────────────────────────────────────
describe("PipelineContext", () => {
  it("requires db, groqApiKey; hfApiKey is optional", () => {
    // This object satisfies PipelineContext — compile-time check via type assertion
    const ctx: PipelineContext = {
      db: {} as any,
      groqApiKey: "gsk_test",
    };
    expect(ctx.db).toBeDefined();
    expect(ctx.groqApiKey).toBe("gsk_test");
    expect(ctx.hfApiKey).toBeUndefined();
  });

  it("accepts hfApiKey when provided", () => {
    const ctx: PipelineContext = {
      db: {} as any,
      groqApiKey: "gsk_test",
      hfApiKey: "hf_test",
    };
    expect(ctx.hfApiKey).toBe("hf_test");
  });

  it("has the correct property types", () => {
    expectTypeOf<PipelineContext>().toHaveProperty("db");
    expectTypeOf<PipelineContext>().toHaveProperty("groqApiKey");
    expectTypeOf<PipelineContext>().toHaveProperty("hfApiKey");

    // groqApiKey must be string (not optional)
    expectTypeOf<PipelineContext["groqApiKey"]>().toBeString();

    // hfApiKey is optional (string | undefined)
    expectTypeOf<PipelineContext["hfApiKey"]>().toEqualTypeOf<
      string | undefined
    >();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IngestInput
// ─────────────────────────────────────────────────────────────────────────────
describe("IngestInput", () => {
  it('supports "text" type', () => {
    const input: IngestInput = {
      userId: "u1",
      type: "text",
      content: "Hello world",
    };
    expect(input.type).toBe("text");
  });

  it('supports "url" type', () => {
    const input: IngestInput = {
      userId: "u1",
      type: "url",
      content: "https://example.com",
    };
    expect(input.type).toBe("url");
  });

  it('supports "file" type with file-specific fields', () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      fileName: "doc.pdf",
      mimeType: "application/pdf",
      fileBuffer: Buffer.from("data"),
    };
    expect(input.type).toBe("file");
    expect(input.fileName).toBe("doc.pdf");
    expect(input.mimeType).toBe("application/pdf");
    expect(input.fileBuffer).toBeInstanceOf(Buffer);
  });

  it("has optional tags, fileName, mimeType, fileBuffer, title fields", () => {
    const minimal: IngestInput = {
      userId: "u1",
      type: "text",
      content: "test",
    };
    expect(minimal.tags).toBeUndefined();
    expect(minimal.fileName).toBeUndefined();
    expect(minimal.mimeType).toBeUndefined();
    expect(minimal.fileBuffer).toBeUndefined();
    expect(minimal.title).toBeUndefined();
  });

  it("accepts tags as string array", () => {
    const input: IngestInput = {
      userId: "u1",
      type: "text",
      content: "test",
      tags: ["tag1", "tag2"],
    };
    expect(input.tags).toEqual(["tag1", "tag2"]);

    expectTypeOf<IngestInput["tags"]>().toEqualTypeOf<string[] | undefined>();
  });

  it("type field is constrained to the three allowed literals", () => {
    expectTypeOf<IngestInput["type"]>().toEqualTypeOf<
      "text" | "url" | "file"
    >();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IngestResult
// ─────────────────────────────────────────────────────────────────────────────
describe("IngestResult", () => {
  it("has nodeId, title, summary, tags, edgeCount", () => {
    const result: IngestResult = {
      nodeId: "node-1",
      title: "Test Node",
      summary: "A summary",
      tags: ["tag1"],
      edgeCount: 5,
    };

    expect(result.nodeId).toBe("node-1");
    expect(result.title).toBe("Test Node");
    expect(result.summary).toBe("A summary");
    expect(result.tags).toEqual(["tag1"]);
    expect(result.edgeCount).toBe(5);
  });

  it("title can be null", () => {
    const result: IngestResult = {
      nodeId: "node-2",
      title: null,
      summary: "Summary",
      tags: [],
      edgeCount: 0,
    };

    expect(result.title).toBeNull();
    expectTypeOf<IngestResult["title"]>().toEqualTypeOf<string | null>();
  });

  it("has correct types for all properties", () => {
    expectTypeOf<IngestResult["nodeId"]>().toBeString();
    expectTypeOf<IngestResult["summary"]>().toBeString();
    expectTypeOf<IngestResult["tags"]>().toEqualTypeOf<string[]>();
    expectTypeOf<IngestResult["edgeCount"]>().toBeNumber();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExtractedContent
// ─────────────────────────────────────────────────────────────────────────────
describe("ExtractedContent", () => {
  it("has title, content, and optional sourceUrl", () => {
    const extracted: ExtractedContent = {
      title: "Page Title",
      content: "Body text",
    };
    expect(extracted.sourceUrl).toBeUndefined();

    const withUrl: ExtractedContent = {
      title: "Page Title",
      content: "Body text",
      sourceUrl: "https://example.com",
    };
    expect(withUrl.sourceUrl).toBe("https://example.com");
  });

  it("has the correct property types", () => {
    expectTypeOf<ExtractedContent["title"]>().toBeString();
    expectTypeOf<ExtractedContent["content"]>().toBeString();
    expectTypeOf<ExtractedContent["sourceUrl"]>().toEqualTypeOf<
      string | undefined
    >();
  });
});
