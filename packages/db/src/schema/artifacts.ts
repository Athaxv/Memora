import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { vector } from "./vector";

export const artifactTypeEnum = pgEnum("artifact_type", [
  "note",
  "link",
  "document",
  "message",
  "idea",
  "media",
  "chat_turn",
]);

export const artifacts = pgTable(
  "artifacts",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: artifactTypeEnum("type").notNull().default("note"),
    rawContent: text("raw_content").notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    sourceRef: text("source_ref"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("artifacts_user_id_idx").on(table.userId),
    index("artifacts_type_idx").on(table.userId, table.type),
    index("artifacts_created_at_idx").on(table.createdAt),
  ]
);
