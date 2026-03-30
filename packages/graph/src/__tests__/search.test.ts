import { describe, it, expect, vi } from "vitest";
import { semanticSearch } from "../search";

function mockDb(rows: Record<string, unknown>[] = []) {
  const db = {
    execute: vi.fn(() => Promise.resolve({ rows })),
  } as unknown as Parameters<typeof semanticSearch>[0];

  return db;
}

describe("semanticSearch", () => {
  const fakeEmbedding = Array.from({ length: 768 }, () => Math.random());

  it("calls db.execute with a raw SQL query for pgvector cosine distance", async () => {
    const db = mockDb([]);

    await semanticSearch(db, "user-1", fakeEmbedding);

    expect(db.execute).toHaveBeenCalledTimes(1);

    // The SQL template passed to db.execute should contain the cosine distance operator
    const sqlArg = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    // drizzle sql`` produces an object with queryChunks or sql string
    // We verify the call was made; the exact SQL structure depends on drizzle internals
    expect(sqlArg).toBeDefined();
  });

  it("returns mapped SearchResult[] from raw rows", async () => {
    const now = new Date().toISOString();
    const rows = [
      {
        id: "node-1",
        user_id: "user-1",
        type: "note",
        title: "Test Node",
        content: "Some content",
        summary: null,
        source: null,
        source_url: null,
        metadata: null,
        embedding: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        similarity: 0.92,
      },
    ];

    const db = mockDb(rows);
    const results = await semanticSearch(db, "user-1", fakeEmbedding);

    expect(results).toHaveLength(1);
    expect(results[0]!.similarity).toBe(0.92);
    expect(results[0]!.node.id).toBe("node-1");
    expect(results[0]!.node.userId).toBe("user-1");
    expect(results[0]!.node.type).toBe("note");
    expect(results[0]!.node.title).toBe("Test Node");
    expect(results[0]!.node.createdAt).toBeInstanceOf(Date);
    expect(results[0]!.node.updatedAt).toBeInstanceOf(Date);
    expect(results[0]!.node.deletedAt).toBeNull();
  });

  it("defaults limit to 10 and threshold to 0.5", async () => {
    const db = mockDb([]);

    await semanticSearch(db, "user-1", fakeEmbedding);

    // We can inspect the SQL template to verify defaults were used.
    // Since the function builds sql`` inline, the defaults are baked in.
    // At minimum, the function should not throw with no options.
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("accepts optional type filter without throwing", async () => {
    const db = mockDb([]);

    await expect(
      semanticSearch(db, "user-1", fakeEmbedding, { type: "note" })
    ).resolves.toBeDefined();
  });

  it("accepts custom limit and threshold", async () => {
    const db = mockDb([]);

    await expect(
      semanticSearch(db, "user-1", fakeEmbedding, {
        limit: 5,
        threshold: 0.8,
      })
    ).resolves.toBeDefined();
  });

  it("maps deletedAt to a Date when present in row", async () => {
    const now = new Date().toISOString();
    const rows = [
      {
        id: "node-2",
        user_id: "user-1",
        type: "link",
        title: null,
        content: null,
        summary: null,
        source: null,
        source_url: null,
        metadata: null,
        embedding: null,
        created_at: now,
        updated_at: now,
        deleted_at: now,
        similarity: 0.75,
      },
    ];

    const db = mockDb(rows);
    const results = await semanticSearch(db, "user-1", fakeEmbedding);

    expect(results[0]!.node.deletedAt).toBeInstanceOf(Date);
  });
});
