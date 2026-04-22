import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  pgEnum,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { vector } from "./vector";

export const memoryTierEnum = pgEnum("memory_tier", [
  "short_term",
  "long_term",
  "personality",
]);

export const memoryKindEnum = pgEnum("memory_kind", [
  "fact",
  "preference",
  "identity",
  "relationship",
  "goal",
  "project",
  "event",
  "constraint",
]);

export const memoryStatusEnum = pgEnum("memory_status", [
  "active",
  "superseded",
  "rejected",
]);

export const memoryRecords = pgTable(
  "memory_records",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: memoryTierEnum("tier").notNull().default("long_term"),
    kind: memoryKindEnum("kind").notNull(),
    canonicalText: text("canonical_text").notNull(),
    summary: text("summary"),
    jsonPayload: jsonb("json_payload").$type<Record<string, unknown>>(),
    salience: real("salience").notNull().default(0.5),
    confidence: real("confidence").notNull().default(0.5),
    status: memoryStatusEnum("status").notNull().default("active"),
    dedupeKey: varchar("dedupe_key", { length: 255 }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    reinforcementCount: integer("reinforcement_count").notNull().default(1),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memory_records_user_tier_idx").on(table.userId, table.tier),
    index("memory_records_user_kind_idx").on(table.userId, table.kind),
    index("memory_records_status_idx").on(table.userId, table.status),
    index("memory_records_dedupe_idx").on(table.userId, table.dedupeKey),
    index("memory_records_last_seen_idx").on(table.lastSeenAt),
  ]
);
