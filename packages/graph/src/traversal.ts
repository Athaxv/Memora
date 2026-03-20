import { sql } from "drizzle-orm";
import { nodes, edges } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { Node } from "./types";

export async function getRelatedNodes(
  db: Database,
  nodeId: string,
  userId: string,
  limit: number = 10
): Promise<{ node: Node; edgeType: string; weight: number }[]> {
  const results = await db.execute(sql`
    SELECT n.*, e.type as edge_type, e.weight
    FROM edges e
    JOIN nodes n ON (
      CASE
        WHEN e.source_node_id = ${nodeId} THEN n.id = e.target_node_id
        ELSE n.id = e.source_node_id
      END
    )
    WHERE e.user_id = ${userId}
      AND (e.source_node_id = ${nodeId} OR e.target_node_id = ${nodeId})
      AND n.deleted_at IS NULL
    ORDER BY e.weight DESC
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
    edgeType: row.edge_type as string,
    weight: row.weight as number,
  }));
}
