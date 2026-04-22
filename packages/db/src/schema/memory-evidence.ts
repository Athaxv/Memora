import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  real,
  index,
} from "drizzle-orm/pg-core";
import { memoryRecords } from "./memory-records";
import { artifacts } from "./artifacts";
import { messages } from "./messages";

export const memoryEvidence = pgTable(
  "memory_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memoryId: varchar("memory_id", { length: 26 })
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    artifactId: varchar("artifact_id", { length: 26 }).references(() => artifacts.id, {
      onDelete: "set null",
    }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    evidenceText: text("evidence_text").notNull(),
    confidence: real("confidence").notNull().default(0.5),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memory_evidence_memory_idx").on(table.memoryId),
    index("memory_evidence_artifact_idx").on(table.artifactId),
    index("memory_evidence_message_idx").on(table.messageId),
  ]
);
