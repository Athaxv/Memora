import { pgTable, uuid, varchar, primaryKey } from "drizzle-orm/pg-core";
import { nodes } from "./nodes";
import { tags } from "./tags";

export const nodeTags = pgTable(
  "node_tags",
  {
    nodeId: varchar("node_id", { length: 26 })
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.nodeId, table.tagId] })]
);
