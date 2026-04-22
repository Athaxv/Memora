import { and, desc, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "@repo/ai/embeddings";
import { memoryRecords } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { RetrievedMemory } from "./types";

function isMissingMemoryTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('relation "memory_records" does not exist') ||
    message.includes("relation 'memory_records' does not exist") ||
    message.includes("memory_records")
  );
}

function recencyBoost(date: Date | null): number {
  if (!date) return 0;
  const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(1, Math.exp(-ageDays / 30)));
}

export async function searchMemories(params: {
  db: Database;
  userId: string;
  query: string;
  hfApiKey?: string;
  limit?: number;
}): Promise<RetrievedMemory[]> {
  const { db, userId, query, hfApiKey, limit = 8 } = params;
  const results = new Map<string, RetrievedMemory>();

  try {
    const lexicalRows = await db.execute(sql`
      SELECT
        id,
        kind,
        tier,
        canonical_text,
        summary,
        salience,
        confidence,
        last_seen_at,
        ts_rank_cd(
          to_tsvector('english', coalesce(canonical_text, '') || ' ' || coalesce(summary, '')),
          plainto_tsquery('english', ${query})
        ) AS lexical_score
      FROM memory_records
      WHERE user_id = ${userId}
        AND status = 'active'
        AND to_tsvector('english', coalesce(canonical_text, '') || ' ' || coalesce(summary, ''))
            @@ plainto_tsquery('english', ${query})
      ORDER BY lexical_score DESC, last_seen_at DESC
      LIMIT ${limit}
    `);

    for (const row of lexicalRows.rows) {
      const id = String(row.id);
      results.set(id, {
        id,
        kind: row.kind as RetrievedMemory["kind"],
        tier: row.tier as RetrievedMemory["tier"],
        canonicalText: String(row.canonical_text),
        summary: String(row.summary ?? row.canonical_text),
        salience: Number(row.salience ?? 0.5),
        confidence: Number(row.confidence ?? 0.5),
        score:
          Number(row.lexical_score ?? 0) +
          0.15 * recencyBoost(row.last_seen_at ? new Date(String(row.last_seen_at)) : null),
      });
    }

    const queryEmbedding = await generateEmbedding(query, hfApiKey, "query");
    if (queryEmbedding) {
      const embeddingStr = JSON.stringify(queryEmbedding);
      const semanticRows = await db.execute(sql`
        SELECT
          id,
          kind,
          tier,
          canonical_text,
          summary,
          salience,
          confidence,
          last_seen_at,
          1 - (embedding <=> ${embeddingStr}::vector) AS similarity
        FROM memory_records
        WHERE user_id = ${userId}
          AND status = 'active'
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${embeddingStr}::vector) > 0.35
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `);

      for (const row of semanticRows.rows) {
        const id = String(row.id);
        const semanticScore = Number(row.similarity ?? 0);
        const existing = results.get(id);
        results.set(id, {
          id,
          kind: row.kind as RetrievedMemory["kind"],
          tier: row.tier as RetrievedMemory["tier"],
          canonicalText: String(row.canonical_text),
          summary: String(row.summary ?? row.canonical_text),
          salience: Number(row.salience ?? existing?.salience ?? 0.5),
          confidence: Number(row.confidence ?? existing?.confidence ?? 0.5),
          score:
            Math.max(existing?.score ?? 0, 0) +
            semanticScore * 0.8 +
            Number(row.salience ?? 0.5) * 0.15 +
            recencyBoost(row.last_seen_at ? new Date(String(row.last_seen_at)) : null) * 0.05,
        });
      }
    }
  } catch (error) {
    if (isMissingMemoryTableError(error)) {
      return [];
    }
    throw error;
  }

  return [...results.values()]
    .sort((a, b) => b.score - a.score || b.salience - a.salience)
    .slice(0, limit);
}
