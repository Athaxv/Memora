import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractText } from "../extractors/text";

// ── Mock pdf-parse (dynamic import in file.ts) ──────────────────────────────
const pdfParseMock = vi.fn();
vi.mock("pdf-parse", () => ({
  default: pdfParseMock,
}));

// ── Mock openai (used by extractImage inside file.ts) ─────────────────────────
const openaiCreateMock = vi.fn();
vi.mock("openai", () => {
  return {
    default: class OpenAI {
      chat = { completions: { create: openaiCreateMock } };
      constructor() {}
    },
    __esModule: true,
  };
});

// ── Mock global fetch (used by extractUrl) ────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─────────────────────────────────────────────────────────────────────────────
// extractText
// ─────────────────────────────────────────────────────────────────────────────
describe("extractText", () => {
  it("returns the provided title when given", () => {
    const result = extractText("Some body content", "My Title");
    expect(result.title).toBe("My Title");
    expect(result.content).toBe("Some body content");
  });

  it("infers title from the first line of content when no title is given", () => {
    const content = "First line title\nSecond line body\nThird line";
    const result = extractText(content);
    expect(result.title).toBe("First line title");
  });

  it("truncates inferred title to first 100 characters of the first line", () => {
    const longLine = "A".repeat(150) + "\nSecond line";
    const result = extractText(longLine);
    // The slice(0,100).split("\n")[0] should give the first 100 chars
    expect(result.title).toBe("A".repeat(100));
  });

  it("falls back to 'Untitled' for empty content with no title", () => {
    const result = extractText("");
    expect(result.title).toBe("Untitled");
  });

  it("preserves content exactly as provided", () => {
    const content = "Line 1\nLine 2\n\nLine 4 with special chars: <>&\"'";
    const result = extractText(content, "Title");
    expect(result.content).toBe(content);
  });

  it("does not set sourceUrl", () => {
    const result = extractText("content", "title");
    expect(result.sourceUrl).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractUrl
// ─────────────────────────────────────────────────────────────────────────────
describe("extractUrl", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("extracts title from <title> tag", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        `<html><head><title>My Page Title</title></head><body><p>Hello world</p></body></html>`,
    });

    const result = await extractUrl("https://example.com");
    expect(result.title).toBe("My Page Title");
    expect(result.content).toContain("Hello world");
    expect(result.sourceUrl).toBe("https://example.com");
  });

  it("falls back to <h1> when no <title> tag present", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        `<html><body><h1>Heading Title</h1><p>Body text</p></body></html>`,
    });

    const result = await extractUrl("https://example.com/page");
    expect(result.title).toBe("Heading Title");
  });

  it("falls back to og:title when no <title> or <h1>", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        `<html><head><meta property="og:title" content="OG Title"></head><body><p>text</p></body></html>`,
    });

    const result = await extractUrl("https://example.com/og");
    expect(result.title).toBe("OG Title");
  });

  it("returns 'Untitled' when no title source is found", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `<html><body><p>Just a paragraph</p></body></html>`,
    });

    const result = await extractUrl("https://example.com/notitle");
    expect(result.title).toBe("Untitled");
  });

  it("strips HTML tags, scripts, styles from content", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        `<html>
          <head><title>Test</title><style>.x{color:red}</style></head>
          <body>
            <script>alert("evil")</script>
            <nav>Nav content</nav>
            <p>Real content here</p>
            <footer>Footer content</footer>
          </body>
        </html>`,
    });

    const result = await extractUrl("https://example.com/strip");
    expect(result.content).toContain("Real content here");
    expect(result.content).not.toContain("alert");
    expect(result.content).not.toContain("color:red");
    expect(result.content).not.toContain("Nav content");
    expect(result.content).not.toContain("Footer content");
  });

  it("throws on non-OK response", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(extractUrl("https://example.com/missing")).rejects.toThrow(
      "Failed to fetch URL: 404 Not Found"
    );
  });

  it("decodes HTML entities in content", async () => {
    const { extractUrl } = await import("../extractors/url");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        `<html><head><title>Entities</title></head><body><p>A &amp; B &lt; C &gt; D &quot;E&quot; &#39;F&#39;</p></body></html>`,
    });

    const result = await extractUrl("https://example.com/entities");
    expect(result.content).toContain('A & B < C > D "E" \'F\'');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractFile
// ─────────────────────────────────────────────────────────────────────────────
describe("extractFile", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("routes PDF files through pdf-parse", async () => {
    pdfParseMock.mockResolvedValueOnce({
      text: "PDF extracted text content",
      info: { Title: "PDF Document Title" },
    });

    const { extractFile } = await import("../extractors/file");

    const buffer = Buffer.from("fake pdf data");
    const result = await extractFile(
      buffer,
      "application/pdf",
      "report.pdf",
      "fake-groq-key"
    );

    expect(result.title).toBe("PDF Document Title");
    expect(result.content).toBe("PDF extracted text content");
  });

  it("uses filename for PDF title when info.Title is missing", async () => {
    pdfParseMock.mockResolvedValueOnce({
      text: "PDF text",
      info: {},
    });

    const { extractFile } = await import("../extractors/file");

    const buffer = Buffer.from("fake pdf data");
    const result = await extractFile(
      buffer,
      "application/pdf",
      "my-report.pdf",
      "fake-groq-key"
    );

    expect(result.title).toBe("my-report");
  });

  it("routes image files through Groq vision API", async () => {
    openaiCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: { content: "A photo of a sunset over the ocean." },
        },
      ],
    });

    const { extractFile } = await import("../extractors/file");

    const buffer = Buffer.from("fake image data");
    const result = await extractFile(
      buffer,
      "image/png",
      "sunset.png",
      "fake-groq-key"
    );

    expect(result.title).toBe("sunset");
    expect(result.content).toBe("A photo of a sunset over the ocean.");
  });

  it("handles plain text files directly", async () => {
    const { extractFile } = await import("../extractors/file");

    const content = "This is plain text content\nLine 2\nLine 3";
    const buffer = Buffer.from(content);
    const result = await extractFile(
      buffer,
      "text/plain",
      "notes.txt",
      "fake-groq-key"
    );

    expect(result.title).toBe("notes");
    expect(result.content).toBe(content);
  });

  it("handles markdown files as plain text", async () => {
    const { extractFile } = await import("../extractors/file");

    const content = "# Heading\n\nSome markdown content";
    const buffer = Buffer.from(content);
    const result = await extractFile(
      buffer,
      "text/markdown",
      "readme.md",
      "fake-groq-key"
    );

    expect(result.title).toBe("readme");
    expect(result.content).toBe(content);
  });

  it("truncates plain text content to 50000 characters", async () => {
    const { extractFile } = await import("../extractors/file");

    const content = "X".repeat(60000);
    const buffer = Buffer.from(content);
    const result = await extractFile(
      buffer,
      "text/plain",
      "big.txt",
      "fake-groq-key"
    );

    expect(result.content.length).toBe(50000);
  });

  it("uses 'Untitled' when filename has no name part", async () => {
    const { extractFile } = await import("../extractors/file");

    const buffer = Buffer.from("content");
    const result = await extractFile(
      buffer,
      "text/plain",
      ".txt",
      "fake-groq-key"
    );

    // fileName.replace(/\.[^.]+$/, "") on ".txt" => "" which is falsy => "Untitled"
    // Actually ".txt".replace(/\.[^.]+$/, "") => "" which is falsy, so title = "Untitled"
    expect(result.title).toBe("Untitled");
  });
});
