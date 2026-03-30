import { describe, it, expect } from "vitest";
import {
  ingestSchema,
  signUpSchema,
  updateNodeSchema,
  searchSchema,
  chatSchema,
} from "../lib/validators";

describe("ingestSchema", () => {
  it("accepts valid text input", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "Some text content to ingest",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid url input", () => {
    const result = ingestSchema.safeParse({
      type: "url",
      content: "https://example.com/article",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with optional title and tags", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "Content here",
      title: "My Note",
      tags: ["personal", "work"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My Note");
      expect(result.data.tags).toEqual(["personal", "work"]);
    }
  });

  it("rejects invalid type", () => {
    const result = ingestSchema.safeParse({
      type: "file",
      content: "Something",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 100000 characters", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "a".repeat(100001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts content at exactly 100000 characters", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "a".repeat(100000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing type field", () => {
    const result = ingestSchema.safeParse({
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content field", () => {
    const result = ingestSchema.safeParse({
      type: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 500 characters", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "Hello",
      title: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const result = ingestSchema.safeParse({
      type: "text",
      content: "Hello",
      tags,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a tag exceeding 100 characters", () => {
    const result = ingestSchema.safeParse({
      type: "text",
      content: "Hello",
      tags: ["a".repeat(101)],
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts valid sign-up data", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = signUpSchema.safeParse({
      name: "",
      email: "john@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts name with 1 character (minimum)", () => {
    const result = signUpSchema.safeParse({
      name: "A",
      email: "a@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts name with 255 characters (maximum)", () => {
    const result = signUpSchema.safeParse({
      name: "A".repeat(255),
      email: "a@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = signUpSchema.safeParse({
      name: "A".repeat(256),
      email: "a@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password with exactly 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts password with exactly 100 characters", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects password exceeding 100 characters", () => {
    const result = signUpSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNodeSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateNodeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid title only", () => {
    const result = updateNodeSchema.safeParse({
      title: "Updated Title",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid content only", () => {
    const result = updateNodeSchema.safeParse({
      content: "Updated content body",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid summary only", () => {
    const result = updateNodeSchema.safeParse({
      summary: "A brief summary",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all fields together", () => {
    const result = updateNodeSchema.safeParse({
      title: "Title",
      content: "Content",
      summary: "Summary",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Title");
      expect(result.data.content).toBe("Content");
      expect(result.data.summary).toBe("Summary");
    }
  });

  it("rejects title exceeding 500 characters", () => {
    const result = updateNodeSchema.safeParse({
      title: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 100000 characters", () => {
    const result = updateNodeSchema.safeParse({
      content: "a".repeat(100001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects summary exceeding 5000 characters", () => {
    const result = updateNodeSchema.safeParse({
      summary: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = updateNodeSchema.safeParse({
      title: "Valid",
      unknownField: "should be stripped",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("unknownField");
    }
  });
});

describe("searchSchema", () => {
  it("accepts valid query only", () => {
    const result = searchSchema.safeParse({
      query: "how to bake a cake",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid query with limit and type", () => {
    const result = searchSchema.safeParse({
      query: "search term",
      limit: 10,
      type: "note",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.type).toBe("note");
    }
  });

  it("rejects empty query", () => {
    const result = searchSchema.safeParse({
      query: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects query exceeding 1000 characters", () => {
    const result = searchSchema.safeParse({
      query: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts query at exactly 1000 characters", () => {
    const result = searchSchema.safeParse({
      query: "a".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("accepts query at exactly 1 character", () => {
    const result = searchSchema.safeParse({
      query: "a",
    });
    expect(result.success).toBe(true);
  });

  it("rejects limit below 1", () => {
    const result = searchSchema.safeParse({
      query: "test",
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 50", () => {
    const result = searchSchema.safeParse({
      query: "test",
      limit: 51,
    });
    expect(result.success).toBe(false);
  });

  it("accepts limit at exactly 1", () => {
    const result = searchSchema.safeParse({
      query: "test",
      limit: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts limit at exactly 50", () => {
    const result = searchSchema.safeParse({
      query: "test",
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer limit", () => {
    const result = searchSchema.safeParse({
      query: "test",
      limit: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing query field", () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("type is optional", () => {
    const result = searchSchema.safeParse({
      query: "test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBeUndefined();
    }
  });
});

describe("chatSchema", () => {
  it("accepts valid message only", () => {
    const result = chatSchema.safeParse({
      message: "What did I save about cooking?",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid message with conversationId UUID", () => {
    const result = chatSchema.safeParse({
      message: "Tell me more",
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationId).toBe(
        "550e8400-e29b-41d4-a716-446655440000"
      );
    }
  });

  it("rejects empty message", () => {
    const result = chatSchema.safeParse({
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 5000 characters", () => {
    const result = chatSchema.safeParse({
      message: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts message at exactly 5000 characters", () => {
    const result = chatSchema.safeParse({
      message: "a".repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it("accepts message at exactly 1 character", () => {
    const result = chatSchema.safeParse({
      message: "a",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid conversationId (not a UUID)", () => {
    const result = chatSchema.safeParse({
      message: "Hello",
      conversationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects conversationId that is an empty string", () => {
    const result = chatSchema.safeParse({
      message: "Hello",
      conversationId: "",
    });
    expect(result.success).toBe(false);
  });

  it("conversationId is optional", () => {
    const result = chatSchema.safeParse({
      message: "Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationId).toBeUndefined();
    }
  });

  it("rejects missing message field", () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing message with only conversationId", () => {
    const result = chatSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});
