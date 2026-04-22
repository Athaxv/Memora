import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all external dependencies ──────────────────────────────────────────

vi.mock("@repo/ai/embeddings", () => ({
  generateEmbedding: vi.fn(),
}));

vi.mock("@repo/ai/summarize", () => ({
  summarize: vi.fn(),
}));

vi.mock("@repo/ai/auto-tag", () => ({
  autoTag: vi.fn(),
}));

vi.mock("@repo/memory", () => ({
  createArtifact: vi.fn(),
}));

vi.mock("@repo/graph", () => ({
  createNode: vi.fn(),
  computeSemanticEdges: vi.fn(),
  upsertTags: vi.fn(),
  addTagsToNode: vi.fn(),
}));

vi.mock("../extractors/text", () => ({
  extractText: vi.fn(),
}));

vi.mock("../extractors/url", () => ({
  extractUrl: vi.fn(),
}));

vi.mock("../extractors/file", () => ({
  extractFile: vi.fn(),
}));

// ── Import after mocks ──────────────────────────────────────────────────────

import { ingest } from "../pipeline";
import { generateEmbedding } from "@repo/ai/embeddings";
import { summarize } from "@repo/ai/summarize";
import { autoTag } from "@repo/ai/auto-tag";
import { createArtifact } from "@repo/memory";
import {
  createNode,
  computeSemanticEdges,
  upsertTags,
  addTagsToNode,
} from "@repo/graph";
import { extractText } from "../extractors/text";
import { extractUrl } from "../extractors/url";
import { extractFile } from "../extractors/file";
import type { PipelineContext, IngestInput } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockDb = {} as any;

function makeCtx(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    db: mockDb,
    groqApiKey: "test-groq-key",
    hfApiKey: "test-hf-key",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveNodeType (tested indirectly through ingest → createNode calls)
// ─────────────────────────────────────────────────────────────────────────────
describe("resolveNodeType", () => {
  beforeEach(() => {
    vi.mocked(summarize).mockResolvedValue("A summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-1" } as any);
    vi.mocked(createNode).mockResolvedValue({ id: "node-1", title: "T" } as any);
    vi.mocked(computeSemanticEdges).mockResolvedValue(0);
    vi.mocked(upsertTags).mockResolvedValue([]);
    vi.mocked(addTagsToNode).mockResolvedValue(undefined);
    vi.mocked(extractText).mockReturnValue({
      title: "T",
      content: "C",
    });
    vi.mocked(extractUrl).mockResolvedValue({
      title: "T",
      content: "C",
      sourceUrl: "https://example.com",
    });
    vi.mocked(extractFile).mockResolvedValue({
      title: "T",
      content: "C",
    });
  });

  it('resolves url input to "link" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "url",
      content: "https://example.com",
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "link" })
    );
  });

  it('resolves file + image/png to "media" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "image/png",
      fileName: "photo.png",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "media" })
    );
  });

  it('resolves file + image/jpeg to "media" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "image/jpeg",
      fileName: "photo.jpg",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "media" })
    );
  });

  it('resolves file + application/pdf to "document" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "application/pdf",
      fileName: "report.pdf",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "document" })
    );
  });

  it('resolves file + text/plain to "note" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "text/plain",
      fileName: "notes.txt",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "note" })
    );
  });

  it('resolves file with no mimeType to "note" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      fileName: "unknown",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "note" })
    );
  });

  it('resolves text input to "note" type', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "text",
      content: "Some note",
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ type: "note" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveSource (tested indirectly through ingest → createNode calls)
// ─────────────────────────────────────────────────────────────────────────────
describe("resolveSource", () => {
  beforeEach(() => {
    vi.mocked(summarize).mockResolvedValue("A summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-1" } as any);
    vi.mocked(createNode).mockResolvedValue({ id: "node-1", title: "T" } as any);
    vi.mocked(computeSemanticEdges).mockResolvedValue(0);
    vi.mocked(upsertTags).mockResolvedValue([]);
    vi.mocked(addTagsToNode).mockResolvedValue(undefined);
    vi.mocked(extractText).mockReturnValue({
      title: "T",
      content: "C",
    });
    vi.mocked(extractUrl).mockResolvedValue({
      title: "T",
      content: "C",
      sourceUrl: "https://example.com",
    });
    vi.mocked(extractFile).mockResolvedValue({
      title: "T",
      content: "C",
    });
  });

  it('resolves url input to "web" source', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "url",
      content: "https://example.com",
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ source: "web" })
    );
  });

  it('resolves file input to "upload" source', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "text/plain",
      fileName: "file.txt",
      fileBuffer: Buffer.from("data"),
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ source: "upload" })
    );
  });

  it('resolves text input to "manual" source', async () => {
    const input: IngestInput = {
      userId: "u1",
      type: "text",
      content: "My note",
    };

    await ingest(makeCtx(), input);

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ source: "manual" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full ingest pipeline
// ─────────────────────────────────────────────────────────────────────────────
describe("ingest (full pipeline)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes text input through the complete pipeline", async () => {
    vi.mocked(extractText).mockReturnValue({
      title: "My Note",
      content: "Note content here",
    });
    vi.mocked(summarize).mockResolvedValue("This is a summary of the note.");
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(autoTag).mockResolvedValue([
      { name: "productivity", confidence: 0.9 },
      { name: "notes", confidence: 0.85 },
    ]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-1" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-123",
      title: "My Note",
    } as any);
    vi.mocked(upsertTags).mockResolvedValue([
      { id: "tag-1", name: "productivity", userId: "u1", isAi: true } as any,
      { id: "tag-2", name: "notes", userId: "u1", isAi: true } as any,
    ]);
    vi.mocked(addTagsToNode).mockResolvedValue(undefined);
    vi.mocked(computeSemanticEdges).mockResolvedValue(3);

    const result = await ingest(makeCtx(), {
      userId: "u1",
      type: "text",
      content: "Note content here",
      title: "My Note",
    });

    // Verify extractText was called
    expect(extractText).toHaveBeenCalledWith("Note content here", "My Note");

    // Verify summarize was called with extracted content
    expect(summarize).toHaveBeenCalledWith("Note content here", "test-groq-key");

    // Verify embedding was generated
    expect(generateEmbedding).toHaveBeenCalledWith(
      expect.stringContaining("My Note"),
      "test-hf-key",
      "document"
    );

    expect(createArtifact).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        userId: "u1",
        type: "note",
        source: "manual",
      })
    );

    // Verify autoTag was called
    expect(autoTag).toHaveBeenCalledWith("Note content here", "test-groq-key");

    // Verify node was created with correct fields
    expect(createNode).toHaveBeenCalledWith(mockDb, {
      userId: "u1",
      type: "note",
      title: "My Note",
      content: "Note content here",
      summary: "This is a summary of the note.",
      source: "manual",
      sourceUrl: undefined,
      embedding: [0.1, 0.2, 0.3],
    });

    // Verify semantic edges were computed (since embedding was available)
    expect(computeSemanticEdges).toHaveBeenCalledWith(
      mockDb,
      "node-123",
      "u1",
      [0.1, 0.2, 0.3]
    );

    // Verify the result
    expect(result).toEqual({
      nodeId: "node-123",
      artifactId: "artifact-1",
      title: "My Note",
      summary: "This is a summary of the note.",
      tags: ["productivity", "notes"],
      edgeCount: 3,
    });
  });

  it("processes URL input, calling extractUrl", async () => {
    vi.mocked(extractUrl).mockResolvedValue({
      title: "Web Page Title",
      content: "Page content",
      sourceUrl: "https://example.com",
    });
    vi.mocked(summarize).mockResolvedValue("Summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-url" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-url",
      title: "Web Page Title",
    } as any);
    vi.mocked(computeSemanticEdges).mockResolvedValue(0);

    const result = await ingest(makeCtx(), {
      userId: "u1",
      type: "url",
      content: "https://example.com",
    });

    expect(extractUrl).toHaveBeenCalledWith("https://example.com");
    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        sourceUrl: "https://example.com",
        type: "link",
        source: "web",
      })
    );
    expect(result.nodeId).toBe("node-url");
  });

  it("processes file input, calling extractFile", async () => {
    const buf = Buffer.from("file data");
    vi.mocked(extractFile).mockResolvedValue({
      title: "Document",
      content: "File content",
    });
    vi.mocked(summarize).mockResolvedValue("Summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-file" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-file",
      title: "Document",
    } as any);
    vi.mocked(computeSemanticEdges).mockResolvedValue(0);

    await ingest(makeCtx(), {
      userId: "u1",
      type: "file",
      content: "",
      mimeType: "application/pdf",
      fileName: "doc.pdf",
      fileBuffer: buf,
    });

    expect(extractFile).toHaveBeenCalledWith(
      buf,
      "application/pdf",
      "doc.pdf",
      "test-groq-key"
    );
  });

  it("skips semantic edges when embedding is null", async () => {
    vi.mocked(extractText).mockReturnValue({
      title: "T",
      content: "C",
    });
    vi.mocked(summarize).mockResolvedValue("Summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-no-emb" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-no-emb",
      title: "T",
    } as any);

    const result = await ingest(makeCtx({ hfApiKey: undefined }), {
      userId: "u1",
      type: "text",
      content: "C",
    });

    expect(computeSemanticEdges).not.toHaveBeenCalled();
    expect(result.edgeCount).toBe(0);
  });

  it("merges user tags and AI tags without duplicates", async () => {
    vi.mocked(extractText).mockReturnValue({
      title: "T",
      content: "C",
    });
    vi.mocked(summarize).mockResolvedValue("Summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([
      { name: "ai-tag", confidence: 0.9 },
      { name: "shared-tag", confidence: 0.8 },
    ]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-tags" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-tags",
      title: "T",
    } as any);
    vi.mocked(upsertTags)
      .mockResolvedValueOnce([
        { id: "ut-1", name: "user-tag" } as any,
        { id: "ut-2", name: "shared-tag" } as any,
      ])
      .mockResolvedValueOnce([
        { id: "at-1", name: "ai-tag" } as any,
        { id: "at-2", name: "shared-tag" } as any,
      ]);
    vi.mocked(addTagsToNode).mockResolvedValue(undefined);

    const result = await ingest(makeCtx(), {
      userId: "u1",
      type: "text",
      content: "C",
      tags: ["user-tag", "shared-tag"],
    });

    // User tags should be upserted with isAi=false
    expect(upsertTags).toHaveBeenCalledWith(
      mockDb,
      "u1",
      ["user-tag", "shared-tag"],
      false
    );

    // AI tags should be upserted with isAi=true
    expect(upsertTags).toHaveBeenCalledWith(
      mockDb,
      "u1",
      ["ai-tag", "shared-tag"],
      true
    );

    // addTagsToNode should be called with all tag IDs (user + AI combined)
    expect(addTagsToNode).toHaveBeenCalledWith(
      mockDb,
      "node-tags",
      ["ut-1", "ut-2", "at-1", "at-2"]
    );

    // The result tags are the deduplicated names from Set
    expect(result.tags).toEqual(["user-tag", "shared-tag", "ai-tag"]);
  });

  it("does not call upsertTags when there are no user tags and no AI tags", async () => {
    vi.mocked(extractText).mockReturnValue({
      title: "T",
      content: "C",
    });
    vi.mocked(summarize).mockResolvedValue("Summary");
    vi.mocked(generateEmbedding).mockResolvedValue(null);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-notags" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "node-notags",
      title: "T",
    } as any);

    await ingest(makeCtx(), {
      userId: "u1",
      type: "text",
      content: "C",
    });

    expect(upsertTags).not.toHaveBeenCalled();
    expect(addTagsToNode).not.toHaveBeenCalled();
  });

  it("passes extracted title and content to createNode", async () => {
    vi.mocked(extractText).mockReturnValue({
      title: "Extracted Title",
      content: "Extracted Content",
    });
    vi.mocked(summarize).mockResolvedValue("The summary");
    vi.mocked(generateEmbedding).mockResolvedValue([1, 2]);
    vi.mocked(autoTag).mockResolvedValue([]);
    vi.mocked(createArtifact).mockResolvedValue({ id: "artifact-n1" } as any);
    vi.mocked(createNode).mockResolvedValue({
      id: "n1",
      title: "Extracted Title",
    } as any);
    vi.mocked(computeSemanticEdges).mockResolvedValue(0);

    await ingest(makeCtx(), {
      userId: "u1",
      type: "text",
      content: "Extracted Content",
      title: "Extracted Title",
    });

    expect(createNode).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        title: "Extracted Title",
        content: "Extracted Content",
        summary: "The summary",
      })
    );
  });
});
