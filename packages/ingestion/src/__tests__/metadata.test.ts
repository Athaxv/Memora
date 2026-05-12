import { describe, expect, it } from "vitest";
import { buildIngestMetadata, metadataToSearchText, resolveSourceKind } from "../metadata";

describe("ingestion metadata", () => {
  it("classifies tweet links separately from generic web links", () => {
    expect(
      resolveSourceKind({
        userId: "u1",
        type: "url",
        content: "https://x.com/example/status/123",
      })
    ).toBe("tweet");

    expect(
      resolveSourceKind({
        userId: "u1",
        type: "url",
        content: "https://example.com/post",
      })
    ).toBe("web_link");
  });

  it("builds searchable metadata for uploaded files", () => {
    const metadata = buildIngestMetadata({
      input: {
        userId: "u1",
        type: "file",
        content: "brief.pdf",
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        fileSize: 2048,
        createdFrom: "vault",
        metadata: { originalName: "brief.pdf" },
      },
      extracted: {
        title: "Project Brief",
        content: "Roadmap and launch notes",
      },
      summary: "A launch roadmap.",
      tags: ["roadmap", "launch"],
    });

    expect(metadata).toEqual(
      expect.objectContaining({
        title: "Project Brief",
        inputType: "file",
        sourceKind: "document",
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        fileSize: 2048,
        createdFrom: "vault",
        tags: ["roadmap", "launch"],
      })
    );
    expect(metadataToSearchText(metadata)).toContain("sourceKind: document");
    expect(metadataToSearchText(metadata)).toContain("tags: roadmap, launch");
  });
});
