import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNode, getNode, listNodes, updateNode, softDeleteNode } from "../nodes";

// ---------------------------------------------------------------------------
// Helpers – build a chainable mock that mimics drizzle's query-builder API
// ---------------------------------------------------------------------------

function chainable(overrides: Record<string, unknown> = {}, terminalValue?: unknown) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop in overrides) return overrides[prop];
      // Any chained method returns the same proxy so .from().where().orderBy()… works
      return vi.fn(() => new Proxy({}, handler));
    },
  };
  if (terminalValue !== undefined) {
    // Make the proxy itself thenable so `await db.insert(…).values(…).returning()` resolves
    handler.get = (_target, prop) => {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve(terminalValue);
      }
      if (prop in overrides) return overrides[prop];
      return vi.fn(() => new Proxy({}, handler));
    };
  }
  return new Proxy({}, handler);
}

/** Create a minimal mock Database whose query-builder methods resolve to `rows`. */
function mockDb(rows: unknown[] = []) {
  const returning = vi.fn(() => Promise.resolve(rows));
  const limit = vi.fn(() => Promise.resolve(rows));
  const orderBy = vi.fn(() => chainable({ limit }));
  // where() must be thenable (getNode awaits it directly) AND chainable (listNodes calls .orderBy after it)
  const where = vi.fn(() => {
    const obj = chainable({ returning, orderBy, limit }, rows);
    return obj;
  });
  const from = vi.fn(() => chainable({ where }));
  const values = vi.fn(() => chainable({ returning, onConflictDoNothing: vi.fn(() => chainable({ returning })) }));
  const set = vi.fn(() => chainable({ where }));

  const db = {
    insert: vi.fn(() => chainable({ values })),
    select: vi.fn(() => chainable({ from })),
    update: vi.fn(() => chainable({ set })),
    execute: vi.fn(() => Promise.resolve({ rows })),
  } as unknown as Parameters<typeof createNode>[0];

  return { db, spies: { returning, limit, orderBy, where, from, values, set } };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createNode", () => {
  it("accepts CreateNodeInput and returns the inserted node", async () => {
    const fakeNode = {
      id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      userId: "user-1",
      type: "note" as const,
      title: "Test",
      content: "Hello",
      summary: null,
      source: null,
      sourceUrl: null,
      metadata: null,
      embedding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const { db } = mockDb([fakeNode]);

    const result = await createNode(db, {
      userId: "user-1",
      type: "note",
      title: "Test",
      content: "Hello",
    });

    expect(result).toEqual(fakeNode);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("generates a ULID id for the new node", async () => {
    const captured: Record<string, unknown>[] = [];

    const returning = vi.fn(() =>
      Promise.resolve([{ id: "generated", userId: "u" }])
    );
    const values = vi.fn((v: Record<string, unknown>) => {
      captured.push(v);
      return chainable({ returning });
    });

    const db = {
      insert: vi.fn(() => chainable({ values })),
    } as unknown as Parameters<typeof createNode>[0];

    await createNode(db, { userId: "user-1", type: "note" });

    expect(captured.length).toBe(1);
    // ULID is 26 chars
    expect(typeof captured[0]!.id).toBe("string");
    expect((captured[0]!.id as string).length).toBe(26);
  });
});

describe("getNode", () => {
  it("returns the node when found", async () => {
    const fakeNode = { id: "node-1", userId: "user-1" };
    const { db } = mockDb([fakeNode]);

    const result = await getNode(db, "node-1", "user-1");
    expect(result).toEqual(fakeNode);
  });

  it("returns null when no node is found", async () => {
    const { db } = mockDb([]);

    const result = await getNode(db, "missing", "user-1");
    expect(result).toBeNull();
  });
});

describe("listNodes", () => {
  it("defaults limit to 20 and returns nodes with nextCursor=null when not exceeding limit", async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `node-${i}`,
      userId: "user-1",
    }));

    const { db } = mockDb(items);

    const result = await listNodes(db, "user-1");
    expect(result.nodes).toEqual(items);
    expect(result.nextCursor).toBeNull();
  });

  it("returns nextCursor when results exceed limit", async () => {
    // Simulate limit+1 results (limit defaults to 20, so 21 items)
    const items = Array.from({ length: 21 }, (_, i) => ({
      id: `node-${String(i).padStart(3, "0")}`,
      userId: "user-1",
    }));

    const { db } = mockDb(items);

    const result = await listNodes(db, "user-1");
    // Should trim to 20 items
    expect(result.nodes).toHaveLength(20);
    // nextCursor should be the id of the last returned item
    expect(result.nextCursor).toBe("node-019");
  });

  it("respects custom limit option", async () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `n-${i}`,
      userId: "u",
    }));

    const { db } = mockDb(items);

    const result = await listNodes(db, "u", { limit: 5 });
    expect(result.nodes).toHaveLength(5);
    expect(result.nextCursor).toBe("n-4");
  });

  it("accepts optional filter options without throwing", async () => {
    const { db } = mockDb([]);

    // Should not throw with any combination of options
    await expect(
      listNodes(db, "user-1", {
        type: "note",
        search: "hello",
        cursor: "some-cursor",
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        limit: 10,
      })
    ).resolves.toBeDefined();
  });
});

describe("updateNode", () => {
  it("returns the updated node on success", async () => {
    const fakeNode = { id: "node-1", userId: "user-1", title: "Updated" };
    const { db } = mockDb([fakeNode]);

    const result = await updateNode(db, "node-1", "user-1", {
      title: "Updated",
    });
    expect(result).toEqual(fakeNode);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("returns null when no node matches", async () => {
    const { db } = mockDb([]);

    const result = await updateNode(db, "missing", "user-1", {
      title: "X",
    });
    expect(result).toBeNull();
  });
});

describe("softDeleteNode", () => {
  it("returns true when a node is soft-deleted", async () => {
    const { db } = mockDb([{ id: "node-1" }]);

    const result = await softDeleteNode(db, "node-1", "user-1");
    expect(result).toBe(true);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("returns false when no node matches", async () => {
    const { db } = mockDb([]);

    const result = await softDeleteNode(db, "missing", "user-1");
    expect(result).toBe(false);
  });
});
