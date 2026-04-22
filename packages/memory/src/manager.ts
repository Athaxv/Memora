import { and, desc, eq, inArray } from "drizzle-orm";
import { ulid } from "ulid";
import { memoryEdges, memoryEvidence, memoryRecords } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import { generateEmbedding } from "@repo/ai/embeddings";
import type { MemoryCandidate, MergeMemoryInput, MemoryRecord } from "./types";

function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("error connecting to database") ||
    message.includes("fetch failed") ||
    message.includes("connection") ||
    message.includes("network")
  );
}

function payloadField(
  payload: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function sameSubjectPredicate(a: MemoryCandidate, b: MemoryRecord): boolean {
  const candidateSubject = payloadField(a.jsonPayload, "subject");
  const candidatePredicate = payloadField(a.jsonPayload, "predicate");
  const recordPayload = (b.jsonPayload ?? {}) as Record<string, unknown>;
  return (
    candidateSubject !== null &&
    candidatePredicate !== null &&
    candidateSubject === payloadField(recordPayload, "subject") &&
    candidatePredicate === payloadField(recordPayload, "predicate")
  );
}

function shouldSupersede(candidate: MemoryCandidate, record: MemoryRecord): boolean {
  if (!sameSubjectPredicate(candidate, record)) return false;
  if (candidate.kind !== record.kind) return false;
  const candidateObject = payloadField(candidate.jsonPayload, "object");
  const recordObject = payloadField(record.jsonPayload as Record<string, unknown>, "object");
  return candidateObject !== null && recordObject !== null && candidateObject !== recordObject;
}

async function attachEvidence(
  db: Database,
  params: {
    memoryId: string;
    artifactId?: string;
    messageId?: string;
    confidence: number;
    evidenceText: string;
  }
) {
  await db.insert(memoryEvidence).values({
    memoryId: params.memoryId,
    artifactId: params.artifactId,
    messageId: params.messageId,
    confidence: params.confidence,
    evidenceText: params.evidenceText,
  });
}

async function createSupersedesEdge(
  db: Database,
  params: {
    userId: string;
    sourceMemoryId: string;
    targetMemoryId: string;
    reason: string;
  }
) {
  await db
    .insert(memoryEdges)
    .values({
      userId: params.userId,
      sourceMemoryId: params.sourceMemoryId,
      targetMemoryId: params.targetMemoryId,
      relationType: "supersedes",
      weight: 1,
      metadata: { reason: params.reason },
    })
    .onConflictDoNothing();
}

export async function mergeMemoryCandidates(
  db: Database,
  params: MergeMemoryInput & { hfApiKey?: string }
): Promise<MemoryRecord[]> {
  const written: MemoryRecord[] = [];

  for (const candidate of params.candidates) {
    const existing = candidate.dedupeKey
      ? await db
          .select()
          .from(memoryRecords)
          .where(
            and(
              eq(memoryRecords.userId, params.userId),
              eq(memoryRecords.dedupeKey, candidate.dedupeKey),
              eq(memoryRecords.status, "active")
            )
          )
      : [];

    if (existing[0]) {
      const [updated] = await db
        .update(memoryRecords)
        .set({
          summary: candidate.summary,
          canonicalText: candidate.canonicalText,
          jsonPayload: candidate.jsonPayload,
          salience: Math.max(existing[0].salience ?? 0, candidate.salience),
          confidence: Math.max(existing[0].confidence ?? 0, candidate.confidence),
          lastSeenAt: new Date(),
          updatedAt: new Date(),
          reinforcementCount: (existing[0].reinforcementCount ?? 1) + 1,
        })
        .where(eq(memoryRecords.id, existing[0].id))
        .returning();

      if (updated) {
        await attachEvidence(db, {
          memoryId: updated.id,
          artifactId: params.artifactId,
          messageId: params.messageId,
          confidence: candidate.confidence,
          evidenceText: candidate.evidenceText,
        });
        written.push(updated);
      }
      continue;
    }

    const activeSamePredicate = await db
      .select()
      .from(memoryRecords)
          .where(
        and(
          eq(memoryRecords.userId, params.userId),
          eq(memoryRecords.kind, candidate.kind),
          eq(memoryRecords.status, "active")
        )
      )
      .orderBy(desc(memoryRecords.lastSeenAt))
      .limit(20);

    const superseded = activeSamePredicate.find((record) => shouldSupersede(candidate, record));

    const embedding = await generateEmbedding(
      `${candidate.summary}\n\n${candidate.canonicalText}`,
      params.hfApiKey,
      "document"
    );

    const [created] = await db
      .insert(memoryRecords)
      .values({
        id: ulid(),
        userId: params.userId,
        tier: candidate.tier,
        kind: candidate.kind,
        canonicalText: candidate.canonicalText,
        summary: candidate.summary,
        jsonPayload: candidate.jsonPayload,
        salience: candidate.salience,
        confidence: candidate.confidence,
        status: "active",
        dedupeKey: candidate.dedupeKey,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        embedding: embedding ?? undefined,
      })
      .returning();

    if (!created) continue;

    if (superseded) {
      await db
        .update(memoryRecords)
        .set({
          status: "superseded",
          updatedAt: new Date(),
        })
        .where(eq(memoryRecords.id, superseded.id));

      await createSupersedesEdge(db, {
        userId: params.userId,
        sourceMemoryId: created.id,
        targetMemoryId: superseded.id,
        reason: "same-subject-predicate-newer-value",
      });
    }

    await attachEvidence(db, {
      memoryId: created.id,
      artifactId: params.artifactId,
      messageId: params.messageId,
      confidence: candidate.confidence,
      evidenceText: candidate.evidenceText,
    });

    written.push(created);
  }

  return written;
}

export async function touchMemoriesAccessed(
  db: Database,
  memoryIds: string[]
): Promise<void> {
  if (memoryIds.length === 0) return;
  try {
    await db
      .update(memoryRecords)
      .set({ lastAccessedAt: new Date(), updatedAt: new Date() })
      .where(inArray(memoryRecords.id, memoryIds));
  } catch (error) {
    if (isConnectivityError(error)) {
      return;
    }
    throw error;
  }
}
