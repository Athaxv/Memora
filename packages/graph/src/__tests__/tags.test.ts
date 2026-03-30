import { describe, it, expect, vi } from "vitest";
import { upsertTags, addTagsToNode } from "../tags";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(overrides: Record<string, unknown> = {}) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === "then") return undefined; // not thenable by default
      if (prop in overrides) return overrides[prop];
      return vi.fn(() => new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

// ---------------------------------------------------------------------------
// upsertTags
// ---------------------------------------------------------------------------

describe("upsertTags", () => {
  it("inserts each tag and returns them when insert succeeds", async () => {
    const fakeTags = [
      { id: "t1", userId: "u1", name: "javascript", isAi: false, createdAt: new Date() },
      { id: "t2", userId: "u1", name: "react", isAi: false, createdAt: new Date() },
    ];

    let callIndex = 0;
    const returning = vi.fn(() => {
      const tag = fakeTags[callIndex]!;
      callIndex++;
      return Promise.resolve([tag]);
    });
    const onConflictDoNothing = vi.fn(() => chainable({ returning }));
    const values = vi.fn(() => chainable({ onConflictDoNothing }));

    const db = {
      insert: vi.fn(() => chainable({ values })),
      select: vi.fn(),
    } as unknown as Parameters<typeof upsertTags>[0];

    const result = await upsertTags(db, "u1", ["JavaScript", "React"]);

    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("javascript");
    expect(result[1]!.name).toBe("react");
    // insert called once per tag
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("falls back to select when insert returns nothing (conflict)", async () => {
    const existingTag = {
      id: "t1",
      userId: "u1",
      name: "python",
      isAi: false,
      createdAt: new Date(),
    };

    // insert().values().onConflictDoNothing().returning() => []
    const returning = vi.fn(() => Promise.resolve([]));
    const onConflictDoNothing = vi.fn(() => chainable({ returning }));
    const values = vi.fn(() => chainable({ onConflictDoNothing }));

    // select().from().where() => [existingTag]
    const where = vi.fn(() => Promise.resolve([existingTag]));
    const from = vi.fn(() => chainable({ where }));

    const db = {
      insert: vi.fn(() => chainable({ values })),
      select: vi.fn(() => chainable({ from })),
    } as unknown as Parameters<typeof upsertTags>[0];

    const result = await upsertTags(db, "u1", ["Python"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(existingTag);
    expect(db.select).toHaveBeenCalled();
  });

  it("lowercases tag names before inserting", async () => {
    const capturedValues: unknown[] = [];

    const returning = vi.fn(() =>
      Promise.resolve([{ id: "t", userId: "u", name: "mixed", isAi: false, createdAt: new Date() }])
    );
    const onConflictDoNothing = vi.fn(() => chainable({ returning }));
    const values = vi.fn((v: unknown) => {
      capturedValues.push(v);
      return chainable({ onConflictDoNothing });
    });

    const db = {
      insert: vi.fn(() => chainable({ values })),
      select: vi.fn(),
    } as unknown as Parameters<typeof upsertTags>[0];

    await upsertTags(db, "u1", ["MiXeD"]);

    expect(capturedValues).toHaveLength(1);
    expect((capturedValues[0] as Record<string, unknown>).name).toBe("mixed");
  });

  it("defaults isAi to false", async () => {
    const capturedValues: unknown[] = [];

    const returning = vi.fn(() =>
      Promise.resolve([{ id: "t", userId: "u", name: "x", isAi: false, createdAt: new Date() }])
    );
    const onConflictDoNothing = vi.fn(() => chainable({ returning }));
    const values = vi.fn((v: unknown) => {
      capturedValues.push(v);
      return chainable({ onConflictDoNothing });
    });

    const db = {
      insert: vi.fn(() => chainable({ values })),
      select: vi.fn(),
    } as unknown as Parameters<typeof upsertTags>[0];

    await upsertTags(db, "u1", ["test"]);

    expect((capturedValues[0] as Record<string, unknown>).isAi).toBe(false);
  });

  it("respects isAi=true parameter", async () => {
    const capturedValues: unknown[] = [];

    const returning = vi.fn(() =>
      Promise.resolve([{ id: "t", userId: "u", name: "ai-tag", isAi: true, createdAt: new Date() }])
    );
    const onConflictDoNothing = vi.fn(() => chainable({ returning }));
    const values = vi.fn((v: unknown) => {
      capturedValues.push(v);
      return chainable({ onConflictDoNothing });
    });

    const db = {
      insert: vi.fn(() => chainable({ values })),
      select: vi.fn(),
    } as unknown as Parameters<typeof upsertTags>[0];

    await upsertTags(db, "u1", ["ai-tag"], true);

    expect((capturedValues[0] as Record<string, unknown>).isAi).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addTagsToNode
// ---------------------------------------------------------------------------

describe("addTagsToNode", () => {
  it("inserts one node_tags row per tagId", async () => {
    const capturedValues: unknown[] = [];

    const onConflictDoNothing = vi.fn(() => Promise.resolve());
    const values = vi.fn((v: unknown) => {
      capturedValues.push(v);
      return chainable({ onConflictDoNothing });
    });

    const db = {
      insert: vi.fn(() => chainable({ values })),
    } as unknown as Parameters<typeof addTagsToNode>[0];

    await addTagsToNode(db, "node-1", ["tag-a", "tag-b", "tag-c"]);

    expect(db.insert).toHaveBeenCalledTimes(3);
    expect(capturedValues).toHaveLength(3);
    expect(capturedValues[0]).toEqual({ nodeId: "node-1", tagId: "tag-a" });
    expect(capturedValues[1]).toEqual({ nodeId: "node-1", tagId: "tag-b" });
    expect(capturedValues[2]).toEqual({ nodeId: "node-1", tagId: "tag-c" });
  });

  it("returns void", async () => {
    const onConflictDoNothing = vi.fn(() => Promise.resolve());
    const values = vi.fn(() => chainable({ onConflictDoNothing }));

    const db = {
      insert: vi.fn(() => chainable({ values })),
    } as unknown as Parameters<typeof addTagsToNode>[0];

    const result = await addTagsToNode(db, "node-1", ["tag-a"]);
    expect(result).toBeUndefined();
  });

  it("handles empty tagIds array gracefully", async () => {
    const db = {
      insert: vi.fn(),
    } as unknown as Parameters<typeof addTagsToNode>[0];

    await expect(addTagsToNode(db, "node-1", [])).resolves.toBeUndefined();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
