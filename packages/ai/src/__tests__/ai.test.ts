import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// 1 & 2 & 3 – Embedding tests (uses global fetch, no openai SDK)
// ---------------------------------------------------------------------------

describe("embeddings", () => {
  let generateEmbedding: typeof import("../embeddings").generateEmbedding;
  let generateEmbeddings: typeof import("../embeddings").generateEmbeddings;

  beforeEach(async () => {
    // Fresh import each time so module-level state doesn't leak
    vi.resetModules();
    const mod = await import("../embeddings");
    generateEmbedding = mod.generateEmbedding;
    generateEmbeddings = mod.generateEmbeddings;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generateEmbedding returns null when no API key provided", async () => {
    const result = await generateEmbedding("hello", undefined);
    expect(result).toBeNull();
  });

  it("generateEmbeddings returns null when no API key provided", async () => {
    const result = await generateEmbeddings(["hello", "world"], undefined);
    expect(result).toBeNull();
  });

  it('generateEmbedding adds "search_document: " prefix for document purpose', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([0.1, 0.2, 0.3]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await generateEmbedding("test text", "fake-key", "document");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.inputs).toBe("search_document: test text");
  });

  it('generateEmbedding adds "search_query: " prefix for query purpose', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([0.1, 0.2, 0.3]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await generateEmbedding("test text", "fake-key", "query");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.inputs).toBe("search_query: test text");
  });

  it("generateEmbedding defaults to document prefix when purpose is omitted", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([0.1, 0.2, 0.3]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await generateEmbedding("test text", "fake-key");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.inputs).toMatch(/^search_document: /);
  });

  it("generateEmbeddings adds correct prefix for each text in batch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          [0.1, 0.2],
          [0.3, 0.4],
        ]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await generateEmbeddings(["a", "b"], "fake-key", "query");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.inputs).toEqual(["search_query: a", "search_query: b"]);
  });
});

// ---------------------------------------------------------------------------
// 4 – summarize (mocks the OpenAI/Groq client)
// ---------------------------------------------------------------------------

describe("summarize", () => {
  let summarize: typeof import("../summarize").summarize;
  let createFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    // Re-mock openai for every test so module caches are clean
    vi.doMock("openai", () => {
      const fn = vi.fn();
      class FakeOpenAI {
        chat = { completions: { create: fn } };
      }
      return { default: FakeOpenAI, _createFn: fn };
    });

    const openaiMod = await import("openai");
    createFn = (openaiMod as any)._createFn;

    const mod = await import("../summarize");
    summarize = mod.summarize;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("truncates input to 10000 characters before sending to API", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: "A summary." } }],
    });

    const longContent = "x".repeat(20000);
    await summarize(longContent, "fake-groq-key");

    expect(createFn).toHaveBeenCalledTimes(1);
    const userMessage = createFn.mock.calls[0][0].messages[0].content as string;

    // The content slice is 10000 chars. The prompt wrapping adds more text,
    // but the actual content portion must not exceed 10000 chars.
    // The template is: `Summarize the following...\n\nContent:\n${content.slice(0, 10000)}`
    // So the "x" portion in the message should be exactly 10000 x's.
    const xCount = (userMessage.match(/x/g) || []).length;
    expect(xCount).toBe(10000);
  });

  it("returns the summary text from the API response", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: "This is a summary." } }],
    });

    const result = await summarize("Some content", "fake-groq-key");
    expect(result).toBe("This is a summary.");
  });

  it("returns empty string when API returns no content", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await summarize("Some content", "fake-groq-key");
    expect(result).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 5 & 6 – autoTag
// ---------------------------------------------------------------------------

describe("autoTag", () => {
  let autoTag: typeof import("../auto-tag").autoTag;
  let createFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    vi.doMock("openai", () => {
      const fn = vi.fn();
      class FakeOpenAI {
        chat = { completions: { create: fn } };
      }
      return { default: FakeOpenAI, _createFn: fn };
    });

    const openaiMod = await import("openai");
    createFn = (openaiMod as any)._createFn;

    const mod = await import("../auto-tag");
    autoTag = mod.autoTag;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns TagResult[] with correct schema on valid API response", async () => {
    const tags = [
      { name: "machine-learning", confidence: 0.95 },
      { name: "python", confidence: 0.8 },
    ];

    createFn.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(tags) } }],
    });

    const result = await autoTag("Some ML content in Python", "fake-key");

    expect(result).toEqual(tags);
    expect(result).toHaveLength(2);
    result.forEach((tag) => {
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("confidence");
      expect(typeof tag.name).toBe("string");
      expect(typeof tag.confidence).toBe("number");
      expect(tag.confidence).toBeGreaterThanOrEqual(0);
      expect(tag.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("returns empty array when API returns no content", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await autoTag("test", "fake-key");
    expect(result).toEqual([]);
  });

  it("returns empty array on JSON parse failure", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: "not valid json at all!!!" } }],
    });

    const result = await autoTag("test", "fake-key");
    expect(result).toEqual([]);
  });

  it("returns empty array when schema validation fails", async () => {
    // Valid JSON but doesn't match the tag schema (missing confidence)
    createFn.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify([{ name: "tag", wrong_field: true }]),
          },
        },
      ],
    });

    const result = await autoTag("test", "fake-key");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 7 & 8 – classifyIntent
// ---------------------------------------------------------------------------

describe("classifyIntent", () => {
  let classifyIntent: typeof import("../intent").classifyIntent;
  let createFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    vi.doMock("openai", () => {
      const fn = vi.fn();
      class FakeOpenAI {
        chat = { completions: { create: fn } };
      }
      return { default: FakeOpenAI, _createFn: fn };
    });

    const openaiMod = await import("openai");
    createFn = (openaiMod as any)._createFn;

    const mod = await import("../intent");
    classifyIntent = mod.classifyIntent;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns IntentResult on valid API response", async () => {
    const intentData = {
      intent: "store",
      entities: ["meeting notes", "project alpha"],
      confidence: 0.92,
    };

    createFn.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(intentData) } }],
    });

    const result = await classifyIntent(
      "Remember my meeting notes about project alpha",
      "fake-key"
    );

    expect(result).toEqual(intentData);
    expect(result.intent).toBe("store");
    expect(result.entities).toEqual(["meeting notes", "project alpha"]);
    expect(result.confidence).toBe(0.92);
  });

  it("falls back to default on null API content", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await classifyIntent("test", "fake-key");
    expect(result).toEqual({
      intent: "ask",
      entities: [],
      confidence: 0.5,
    });
  });

  it("falls back to default on JSON parse failure", async () => {
    createFn.mockResolvedValue({
      choices: [{ message: { content: "invalid json" } }],
    });

    const result = await classifyIntent("test", "fake-key");
    expect(result).toEqual({
      intent: "ask",
      entities: [],
      confidence: 0.5,
    });
  });

  it("falls back to default on schema validation failure", async () => {
    // Valid JSON but invalid intent value
    createFn.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: "invalid_intent",
              entities: [],
              confidence: 0.8,
            }),
          },
        },
      ],
    });

    const result = await classifyIntent("test", "fake-key");
    expect(result).toEqual({
      intent: "ask",
      entities: [],
      confidence: 0.5,
    });
  });
});

// ---------------------------------------------------------------------------
// 9 – Package index exports
// ---------------------------------------------------------------------------

describe("package index exports", () => {
  it("exports all expected functions and types", async () => {
    const indexModule = await import("../index");

    // Functions
    expect(typeof indexModule.generateEmbedding).toBe("function");
    expect(typeof indexModule.generateEmbeddings).toBe("function");
    expect(typeof indexModule.summarize).toBe("function");
    expect(typeof indexModule.autoTag).toBe("function");
    expect(typeof indexModule.classifyIntent).toBe("function");
  });

  it("does not export unexpected items", async () => {
    const indexModule = await import("../index");
    const exportedKeys = Object.keys(indexModule);

    // Should only have the 5 function exports (types are erased at runtime)
    expect(exportedKeys).toEqual(
      expect.arrayContaining([
        "generateEmbedding",
        "generateEmbeddings",
        "summarize",
        "autoTag",
        "classifyIntent",
      ])
    );
    expect(exportedKeys).toHaveLength(5);
  });
});
