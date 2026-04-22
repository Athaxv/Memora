import {
  pgTable,
  uuid,
  varchar,
  real,
  timestamp,
  jsonb,
  index,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { memoryRecords } from "./memory-records";

export const memoryRelationTypeEnum = pgEnum("memory_relation_type", [
  "semantic",
  "temporal",
  "preference",
  "identity",
  "project",
  "relationship",
  "contradiction",
  "supersedes",
  "derived",
]);

export const memoryEdges = pgTable(
  "memory_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceMemoryId: varchar("source_memory_id", { length: 26 })
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    targetMemoryId: varchar("target_memory_id", { length: 26 })
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    relationType: memoryRelationTypeEnum("relation_type").notNull(),
    weight: real("weight").default(1.0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memory_edges_source_idx").on(table.sourceMemoryId),
    index("memory_edges_target_idx").on(table.targetMemoryId),
    index("memory_edges_user_type_idx").on(table.userId, table.relationType),
    uniqueIndex("memory_edges_unique_idx").on(
      table.sourceMemoryId,
      table.targetMemoryId,
      table.relationType
    ),
  ]
);
