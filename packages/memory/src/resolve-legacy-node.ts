import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { memoryEvidence, memoryRecords, nodes } from "@repo/db/schema";
import type { Database } from "@repo/db/client";

/**
 * Maps normalized memory_record ids to legacy graph node ids when linked via
 * memory_evidence.artifactId → nodes.metadata.artifactId (ingestion pipeline).
 */
export async function resolveLegacyNodeIdsForMemoryRecords(
  db: Database,
  userId: string,
  memoryIds: string[]
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  for (const id of memoryIds) {
    result.set(id, null);
  }
  if (memoryIds.length === 0) {
    return result;
  }

  const evidenceRows = await db
    .select({
      memoryId: memoryEvidence.memoryId,
      artifactId: memoryEvidence.artifactId,
    })
    .from(memoryEvidence)
    .innerJoin(memoryRecords, eq(memoryEvidence.memoryId, memoryRecords.id))
    .where(
      and(
        eq(memoryRecords.userId, userId),
        inArray(memoryEvidence.memoryId, memoryIds),
        isNotNull(memoryEvidence.artifactId)
      )
    );

  const artifactIds = [
    ...new Set(
      evidenceRows
        .map((r) => r.artifactId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  if (artifactIds.length === 0) {
    return result;
  }

  const artifactKey = sql<string>`${nodes.metadata}->>'artifactId'`;

  const nodeRows = await db
    .select({
      id: nodes.id,
      artifactId: artifactKey,
    })
    .from(nodes)
    .where(
      and(
        eq(nodes.userId, userId),
        isNull(nodes.deletedAt),
        inArray(artifactKey, artifactIds)
      )
    );

  const artifactToNode = new Map<string, string>();
  for (const row of nodeRows) {
    if (row.artifactId && !artifactToNode.has(row.artifactId)) {
      artifactToNode.set(row.artifactId, row.id);
    }
  }

  for (const row of evidenceRows) {
    if (!row.artifactId) continue;
    const nodeId = artifactToNode.get(row.artifactId);
    if (nodeId) {
      result.set(row.memoryId, nodeId);
    }
  }

  return result;
}
