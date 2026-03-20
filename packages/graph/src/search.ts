import { sql } from "drizzle-orm";
import type { Database } from "@repo/db/client";
import type { SearchResult, Node } from "./types";

export async function semanticSearch(
  db: Database,
  userId: string,
  queryEmbedding: number[],
  opts: {
    limit?: number;
    threshold?: number;
    type?: string;
  } = {}
): Promise<SearchResult[]> {
  const limit = opts.limit ?? 10;
  const threshold = opts.threshold ?? 0.5;
  const embeddingStr = JSON.stringify(queryEmbedding);

  const typeFilter = opts.type
    ? sql`AND type = ${opts.type}`
    : sql``;

  const results = await db.execute(sql`
    SELECT *,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM nodes
    WHERE user_id = ${userId}
      AND deleted_at IS NULL
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
      ${typeFilter}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return results.rows.map((row) => ({
    node: {
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as Node["type"],
      title: row.title as string | null,
      content: row.content as string | null,
      summary: row.summary as string | null,
      source: row.source as string | null,
      sourceUrl: row.source_url as string | null,
      metadata: row.metadata as Record<string, unknown> | null,
      embedding: row.embedding as number[] | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    },
    similarity: row.similarity as number,
  }));
}
