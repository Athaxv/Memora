import { eq, and, sql } from "drizzle-orm";
import { nodes, edges } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { Edge } from "./types";

const SIMILARITY_THRESHOLD = 0.75;
const MAX_EDGES_PER_NODE = 10;

export async function computeSemanticEdges(
  db: Database,
  nodeId: string,
  userId: string,
  embedding: number[]
): Promise<number> {
  const embeddingStr = JSON.stringify(embedding);

  const similarNodes = await db.execute(sql`
    SELECT id, 1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM nodes
    WHERE user_id = ${userId}
      AND id != ${nodeId}
      AND deleted_at IS NULL
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${SIMILARITY_THRESHOLD}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${MAX_EDGES_PER_NODE}
  `);

  let edgeCount = 0;

  for (const row of similarNodes.rows) {
    const targetId = row.id as string;
    const similarity = row.similarity as number;

    await db
      .insert(edges)
      .values({
        userId,
        sourceNodeId: nodeId,
        targetNodeId: targetId,
        type: "semantic",
        weight: similarity,
      })
      .onConflictDoNothing();

    edgeCount++;
  }

  return edgeCount;
}

export async function createEdge(
  db: Database,
  input: {
    userId: string;
    sourceNodeId: string;
    targetNodeId: string;
    type: "semantic" | "temporal" | "source" | "tag" | "reference" | "derived";
    weight?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<Edge> {
  const [edge] = await db
    .insert(edges)
    .values({
      userId: input.userId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      type: input.type,
      weight: input.weight ?? 1.0,
      metadata: input.metadata,
    })
    .onConflictDoNothing()
    .returning();

  return edge!;
}

export async function getEdgesForNode(
  db: Database,
  nodeId: string,
  userId: string
): Promise<Edge[]> {
  return db
    .select()
    .from(edges)
    .where(
      and(
        eq(edges.userId, userId),
        sql`(${edges.sourceNodeId} = ${nodeId} OR ${edges.targetNodeId} = ${nodeId})`
      )
    );
}
