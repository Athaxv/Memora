import { describe, it, expect } from "vitest";
import {
  users,
  nodes,
  edges,
  tags,
  nodeTags,
  accounts,
  sessions,
  verificationTokens,
  conversations,
  messages,
  artifacts,
  memoryRecords,
  memoryEvidence,
  memoryEdges,
  conversationState,
  nodeTypeEnum,
  edgeTypeEnum,
  messageRoleEnum,
  artifactTypeEnum,
  memoryTierEnum,
  memoryKindEnum,
  memoryStatusEnum,
  memoryRelationTypeEnum,
} from "../schema/index";
import { getTableConfig } from "drizzle-orm/pg-core";

// ----------------------------------------------------------------
// 1. Schema exports — all expected tables are exported and defined
// ----------------------------------------------------------------
describe("Schema exports", () => {
  it("exports the users table", () => {
    expect(users).toBeDefined();
    const config = getTableConfig(users);
    expect(config.name).toBe("users");
  });

  it("exports the nodes table", () => {
    expect(nodes).toBeDefined();
    const config = getTableConfig(nodes);
    expect(config.name).toBe("nodes");
  });

  it("exports the edges table", () => {
    expect(edges).toBeDefined();
    const config = getTableConfig(edges);
    expect(config.name).toBe("edges");
  });

  it("exports the tags table", () => {
    expect(tags).toBeDefined();
    const config = getTableConfig(tags);
    expect(config.name).toBe("tags");
  });

  it("exports the nodeTags table", () => {
    expect(nodeTags).toBeDefined();
    const config = getTableConfig(nodeTags);
    expect(config.name).toBe("node_tags");
  });

  it("exports the accounts table", () => {
    expect(accounts).toBeDefined();
    const config = getTableConfig(accounts);
    expect(config.name).toBe("accounts");
  });

  it("exports the sessions table", () => {
    expect(sessions).toBeDefined();
    const config = getTableConfig(sessions);
    expect(config.name).toBe("sessions");
  });

  it("exports the verificationTokens table", () => {
    expect(verificationTokens).toBeDefined();
    const config = getTableConfig(verificationTokens);
    expect(config.name).toBe("verification_tokens");
  });

  it("exports the conversations table", () => {
    expect(conversations).toBeDefined();
    const config = getTableConfig(conversations);
    expect(config.name).toBe("conversations");
  });

  it("exports the messages table", () => {
    expect(messages).toBeDefined();
    const config = getTableConfig(messages);
    expect(config.name).toBe("messages");
  });

  it("exports the artifacts table", () => {
    expect(artifacts).toBeDefined();
    const config = getTableConfig(artifacts);
    expect(config.name).toBe("artifacts");
  });

  it("exports the memoryRecords table", () => {
    expect(memoryRecords).toBeDefined();
    const config = getTableConfig(memoryRecords);
    expect(config.name).toBe("memory_records");
  });

  it("exports the memoryEvidence table", () => {
    expect(memoryEvidence).toBeDefined();
    const config = getTableConfig(memoryEvidence);
    expect(config.name).toBe("memory_evidence");
  });

  it("exports the memoryEdges table", () => {
    expect(memoryEdges).toBeDefined();
    const config = getTableConfig(memoryEdges);
    expect(config.name).toBe("memory_edges");
  });

  it("exports the conversationState table", () => {
    expect(conversationState).toBeDefined();
    const config = getTableConfig(conversationState);
    expect(config.name).toBe("conversation_state");
  });
});

// ----------------------------------------------------------------
// 2. node_type enum values
// ----------------------------------------------------------------
describe("node_type enum", () => {
  it("is exported", () => {
    expect(nodeTypeEnum).toBeDefined();
  });

  it("includes all expected values: link, note, document, message, idea, media", () => {
    const values = nodeTypeEnum.enumValues;
    expect(values).toContain("link");
    expect(values).toContain("note");
    expect(values).toContain("document");
    expect(values).toContain("message");
    expect(values).toContain("idea");
    expect(values).toContain("media");
    expect(values).toHaveLength(6);
  });
});

// ----------------------------------------------------------------
// 3. edge_type enum values
// ----------------------------------------------------------------
describe("edge_type enum", () => {
  it("is exported", () => {
    expect(edgeTypeEnum).toBeDefined();
  });

  it("includes all expected values: semantic, temporal, source, tag, reference, derived", () => {
    const values = edgeTypeEnum.enumValues;
    expect(values).toContain("semantic");
    expect(values).toContain("temporal");
    expect(values).toContain("source");
    expect(values).toContain("tag");
    expect(values).toContain("reference");
    expect(values).toContain("derived");
    expect(values).toHaveLength(6);
  });
});

// ----------------------------------------------------------------
// 4. message_role enum values
// ----------------------------------------------------------------
describe("message_role enum", () => {
  it("is exported", () => {
    expect(messageRoleEnum).toBeDefined();
  });

  it("includes all expected values: user, assistant, system", () => {
    const values = messageRoleEnum.enumValues;
    expect(values).toContain("user");
    expect(values).toContain("assistant");
    expect(values).toContain("system");
    expect(values).toHaveLength(3);
  });
});

describe("artifact_type enum", () => {
  it("is exported", () => {
    expect(artifactTypeEnum).toBeDefined();
  });

  it("includes expected artifact types", () => {
    const values = artifactTypeEnum.enumValues;
    expect(values).toContain("chat_turn");
    expect(values).toContain("message");
    expect(values).toContain("note");
  });
});

describe("memory enums", () => {
  it("exports memory_tier values", () => {
    expect(memoryTierEnum.enumValues).toEqual(
      expect.arrayContaining(["short_term", "long_term", "personality"])
    );
  });

  it("exports memory_kind values", () => {
    expect(memoryKindEnum.enumValues).toEqual(
      expect.arrayContaining([
        "fact",
        "preference",
        "identity",
        "relationship",
        "goal",
        "project",
        "event",
        "constraint",
      ])
    );
  });

  it("exports memory_status values", () => {
    expect(memoryStatusEnum.enumValues).toEqual(
      expect.arrayContaining(["active", "superseded", "rejected"])
    );
  });

  it("exports memory_relation_type values", () => {
    expect(memoryRelationTypeEnum.enumValues).toEqual(
      expect.arrayContaining(["semantic", "contradiction", "supersedes", "derived"])
    );
  });
});

// ----------------------------------------------------------------
// 5. Vector custom type is defined for 768 dimensions
// ----------------------------------------------------------------
describe("vector custom type", () => {
  it("defines the embedding column with vector(768) data type", () => {
    // The nodes table has an 'embedding' column using the custom vector type.
    // We can inspect the column's SQL data type via its config.
    const embeddingColumn = nodes.embedding;
    expect(embeddingColumn).toBeDefined();

    // Access the underlying column's SQL type name
    // Drizzle stores the dataType on the column config
    const sqlType = embeddingColumn.getSQLType();
    expect(sqlType).toBe("vector(768)");
  });
});

// ----------------------------------------------------------------
// 6. ULID generation for node IDs
// ----------------------------------------------------------------
describe("node ID uses ULID format", () => {
  it("defines the id column as varchar(26) to hold a ULID", () => {
    const idColumn = nodes.id;
    expect(idColumn).toBeDefined();

    // ULID is stored as a 26-character string
    // Check the SQL type is varchar with length 26
    const sqlType = idColumn.getSQLType();
    expect(sqlType).toBe("varchar(26)");
  });

  it("sets the id column as the primary key", () => {
    const config = getTableConfig(nodes);
    const primaryKeys = config.columns.filter((col) => col.primary);
    const pkNames = primaryKeys.map((col) => col.name);
    expect(pkNames).toContain("id");
  });

  it("the ulid package is listed as a dependency for ID generation", async () => {
    // Verify the ulid package is available (declared as a dependency)
    // We import the package.json to check, but we can also just attempt to import it
    const { ulid } = await import("ulid");
    expect(ulid).toBeDefined();
    expect(typeof ulid).toBe("function");

    // Verify generated ULID is 26 characters
    const id = ulid();
    expect(id).toHaveLength(26);
  });
});
