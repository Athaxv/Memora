import type { nodes, edges, tags } from "@repo/db/schema";

export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;
export type Tag = typeof tags.$inferSelect;

export interface ListNodesOptions {
  cursor?: string;
  limit?: number;
  type?: string;
  tagIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ListNodesResult {
  nodes: Node[];
  nextCursor: string | null;
}

export interface SearchResult {
  node: Node;
  similarity: number;
}

export interface CreateNodeInput {
  userId: string;
  type: "link" | "note" | "document" | "message" | "idea" | "media";
  title?: string;
  content?: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface UpdateNodeInput {
  title?: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}
