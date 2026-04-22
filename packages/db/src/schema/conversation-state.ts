import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { users } from "./users";

export const conversationState = pgTable(
  "conversation_state",
  {
    conversationId: uuid("conversation_id")
      .primaryKey()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    summary: text("summary"),
    activeTopics: jsonb("active_topics").$type<string[]>().notNull().default([]),
    openLoops: jsonb("open_loops").$type<string[]>().notNull().default([]),
    recentPreferences: jsonb("recent_preferences")
      .$type<string[]>()
      .notNull()
      .default([]),
    lastUserGoal: text("last_user_goal"),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversation_state_user_idx").on(table.userId)]
);
