import { getRelatedNodes, listNodes, semanticSearch } from "@repo/graph";
import { generateEmbedding } from "@repo/ai/embeddings";
import { searchMemories, touchMemoriesAccessed, type RetrievedMemory } from "@repo/memory";
import type { Database } from "@repo/db/client";
import type { RetrievalMode } from "./decision-engine";
import { rankRetrievedMemories } from "./memory-policy";

export interface RetrievalResult {
  memories: RetrievedMemory[];
  legacyNodes: Array<{
    id: string;
    title: string | null;
    summary: string | null;
    type: string;
    similarity: number;
  }>;
}

export async function retrieveMemoryContext(params: {
  db: Database;
  userId: string;
  message: string;
  hfApiKey?: string;
  mode: Exclude<RetrievalMode, "NONE">;
  conversationState?: {
    activeTopics: string[];
    recentPreferences: string[];
  } | null;
}): Promise<RetrievalResult> {
  const memoryLimit =
    params.mode === "HIGH" ? 12 : params.mode === "MEDIUM" ? 5 : 2;
  const legacyLimit =
    params.mode === "HIGH" ? 10 : params.mode === "MEDIUM" ? 5 : 2;
  const fallbackLimit = params.mode === "LOW" ? 2 : 5;

  const activeTopic =
    params.conversationState?.activeTopics.find((topic) => topic.trim().length > 0) ?? "";
  const expandedQuery = activeTopic
    ? `${params.message}\n\nActive topic: ${activeTopic}`
    : params.message;

  const memories = await searchMemories({
    db: params.db,
    userId: params.userId,
    query: expandedQuery,
    hfApiKey: params.hfApiKey,
    limit: memoryLimit,
  });

  if (params.mode === "LOW") {
    const lowRanked = rankRetrievedMemories(
      memories.map((memory) => ({
        ...memory,
        type: memory.kind,
        similarity: memory.score,
        importance: memory.salience,
        priority:
          memory.kind === "goal" || memory.kind === "preference"
            ? (memory.kind as "goal" | "preference")
            : undefined,
      }))
    );
    const lowPrioritized = [
      ...lowRanked.filter((memory) => memory.priority),
      ...lowRanked,
    ].filter(
      (memory, index, all) => all.findIndex((entry) => entry.id === memory.id) === index
    );

    await touchMemoriesAccessed(
      params.db,
      lowPrioritized.map((memory) => memory.id)
    );

    return {
      memories: lowPrioritized.map((memory) => ({
        id: memory.id,
        summary: memory.summary,
        canonicalText: memory.canonicalText,
        kind: memory.kind,
        tier: memory.tier,
        salience: memory.salience,
        confidence: memory.confidence,
        score: memory.similarity,
      })),
      legacyNodes: [],
    };
  }

  const queryEmbedding = await generateEmbedding(
    expandedQuery,
    params.hfApiKey,
    "query"
  );
  let legacyResults: Awaited<ReturnType<typeof semanticSearch>> = [];

  if (queryEmbedding) {
    legacyResults = await semanticSearch(params.db, params.userId, queryEmbedding, {
      limit: legacyLimit,
    });

    if (params.mode === "HIGH" && legacyResults.length > 0) {
      const related = await Promise.all(
        legacyResults.slice(0, 2).map((seed) =>
          getRelatedNodes(params.db, seed.node.id, params.userId, 3)
        )
      );

      const seenNodeIds = new Set(legacyResults.map((result) => result.node.id));
      for (const bucket of related) {
        for (const item of bucket) {
          if (seenNodeIds.has(item.node.id)) continue;
          seenNodeIds.add(item.node.id);
          legacyResults.push({
            node: item.node,
            similarity: Math.min(0.92, item.weight),
          });
        }
      }
    }
  }

  if (legacyResults.length === 0) {
    const fallback = await listNodes(params.db, params.userId, {
      limit: fallbackLimit,
      search: expandedQuery,
    });
    legacyResults = fallback.nodes.map((node) => ({
      node,
      similarity: 0.35,
    }));
  }

  await touchMemoriesAccessed(
    params.db,
    memories.map((memory) => memory.id)
  );

  const normalizedRanked = rankRetrievedMemories(
    memories.map((memory) => ({
      ...memory,
      type: memory.kind,
      similarity: memory.score,
      importance: memory.salience,
      priority:
        memory.kind === "goal" || memory.kind === "preference"
          ? (memory.kind as "goal" | "preference")
          : undefined,
    }))
  );

  const priorityInjected = [
    ...normalizedRanked.filter((memory) => memory.priority),
    ...normalizedRanked,
  ].filter(
    (memory, index, all) => all.findIndex((entry) => entry.id === memory.id) === index
  );

  const rankedLegacy = rankRetrievedMemories(
    legacyResults.slice(0, legacyLimit + 5).map((result) => ({
      id: result.node.id,
      title: result.node.title,
      summary: result.node.summary,
      type: result.node.type,
      similarity: result.similarity,
      importance:
        typeof result.node.metadata?.importance === "number"
          ? result.node.metadata.importance
          : 0.5,
      createdAt: result.node.createdAt?.toISOString?.(),
    }))
  );

  return {
    memories: priorityInjected.map((memory) => ({
      id: memory.id,
      summary: memory.summary,
      canonicalText: memory.canonicalText,
      kind: memory.kind,
      tier: memory.tier,
      salience: memory.salience,
      confidence: memory.confidence,
      score: memory.similarity,
    })),
    legacyNodes: rankedLegacy.map((memory) => ({
      id: memory.id,
      title: memory.title ?? null,
      summary: memory.summary,
      type: memory.type,
      similarity: memory.similarity,
    })),
  };
}
