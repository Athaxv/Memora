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
import { customType } from "drizzle-orm/pg-core";
import { users } from "./users";

const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      return JSON.parse(value) as number[];
    }
    return value as number[];
  },
});

export const nodeTypeEnum = pgEnum("node_type", [
  "link",
  "note",
  "document",
  "message",
  "idea",
  "media",
]);

export const nodes = pgTable(
  "nodes",
  {
    id: varchar("id", { length: 26 }).primaryKey(), // ULID
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: nodeTypeEnum("type").notNull().default("note"),
    title: varchar("title", { length: 500 }),
    content: text("content"),
    summary: text("summary"),
    source: varchar("source", { length: 100 }),
    sourceUrl: text("source_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("nodes_user_id_idx").on(table.userId),
    index("nodes_user_type_idx").on(table.userId, table.type),
    index("nodes_created_at_idx").on(table.createdAt),
  ]
);
