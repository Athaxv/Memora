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
import { users } from "./users.js";
import { nodes } from "./nodes.js";

export const edgeTypeEnum = pgEnum("edge_type", [
  "semantic",
  "temporal",
  "source",
  "tag",
  "reference",
  "derived",
]);

export const edges = pgTable(
  "edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceNodeId: varchar("source_node_id", { length: 26 })
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    targetNodeId: varchar("target_node_id", { length: 26 })
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    type: edgeTypeEnum("type").notNull(),
    weight: real("weight").default(1.0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("edges_source_idx").on(table.sourceNodeId),
    index("edges_target_idx").on(table.targetNodeId),
    index("edges_user_type_idx").on(table.userId, table.type),
    uniqueIndex("edges_unique_idx").on(
      table.sourceNodeId,
      table.targetNodeId,
      table.type
    ),
  ]
);
