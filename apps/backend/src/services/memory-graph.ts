import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { conversations, edges, messages, nodeTags, nodes, tags } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import { generateEmbedding } from "@repo/ai/embeddings";
import { extractMemoryCandidates, type MemoryCandidate } from "@repo/memory";
import {
  createNode as graphCreateNode,
  listNodes,
  semanticSearch,
  updateNode as graphUpdateNode,
  type Node as GraphNode,
} from "@repo/graph";
import { canWriteMemory, isDurableMemoryText } from "./memory-policy";

export interface MemoryGraphNode {
  id: string;
  kind: "memory" | "root";
  content: string | null;
  summary: string;
  tags: string[];
  importance: number;
  createdAt: string;
  source: string;
  embedding?: number[];
}

export interface MemoryGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "root" | "semantic" | "tag" | "temporal";
  weight: number;
  reasons: {
    root?: number;
    semantic?: number;
    tag?: number;
    temporal?: number;
  };
}

export interface MemoryGraphResult {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
}

interface MemoryGraphOpts {
  limit?: number;
  edgeLimitPerNode?: number;
  tag?: string;
  from?: Date;
  to?: Date;
}

type CandidateEdge = {
  source: string;
  target: string;
  semantic?: number;
  tag?: number;
  temporal?: number;
};

const DEFAULT_NODE_LIMIT = 50;
const DEFAULT_EDGE_LIMIT_PER_NODE = 3;
const TEMPORAL_WINDOW_HOURS = 48;
const TEMPORAL_NEIGHBORS = 2;
const CANDIDATE_MULTIPLIER = 4;
const MAX_ROOTS = 6;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function edgeId(prefix: string, source: string, target: string): string {
  return `${prefix}_${pairKey(source, target).replace(":", "_")}`;
}

function normalizeTag(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function rootIdFromLabel(label: string): string {
  return `root:${label.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()}`;
}

function toTitleCase(label: string): string {
  return label
    .split(" ")
    .map((part) => (part.length ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function recencyScore(createdAt: Date): number {
  const ageDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  return clamp01(Math.exp(-ageDays / 30));
}

function dominantEdge(edge: CandidateEdge): { type: "semantic" | "tag" | "temporal"; score: number } | null {
  if (edge.semantic && edge.semantic > 0) {
    return { type: "semantic", score: clamp01(edge.semantic) };
  }
  if (edge.tag && edge.tag > 0) {
    return { type: "tag", score: clamp01(edge.tag * 0.78) };
  }
  if (edge.temporal && edge.temporal > 0) {
    return { type: "temporal", score: clamp01(edge.temporal * 0.55) };
  }
  return null;
}

function usageScore(usageCount: number, maxUsage: number): number {
  if (maxUsage <= 0 || usageCount <= 0) return 0;
  return clamp01(Math.log1p(usageCount) / Math.log1p(maxUsage));
}

export async function getMemoryGraph(
  db: Database,
  userId: string,
  opts: MemoryGraphOpts = {}
): Promise<MemoryGraphResult> {
  const nodeLimit = opts.limit ?? DEFAULT_NODE_LIMIT;
  const edgeLimitPerNode = opts.edgeLimitPerNode ?? DEFAULT_EDGE_LIMIT_PER_NODE;
  const candidateLimit = Math.max(nodeLimit * CANDIDATE_MULTIPLIER, 200);

  const nodeConditions = [eq(nodes.userId, userId), isNull(nodes.deletedAt)];
  if (opts.from) nodeConditions.push(gte(nodes.createdAt, opts.from));
  if (opts.to) nodeConditions.push(lte(nodes.createdAt, opts.to));

  const rawNodes = await db
    .select({
      id: nodes.id,
      content: nodes.content,
      summary: nodes.summary,
      title: nodes.title,
      source: nodes.source,
      embedding: nodes.embedding,
      createdAt: nodes.createdAt,
    })
    .from(nodes)
    .where(and(...nodeConditions))
    .orderBy(desc(nodes.createdAt))
    .limit(candidateLimit);

  if (rawNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeIds = rawNodes.map((n) => n.id);

  const rawTags = await db
    .select({
      nodeId: nodeTags.nodeId,
      tagName: tags.name,
    })
    .from(nodeTags)
    .innerJoin(tags, eq(nodeTags.tagId, tags.id))
    .where(inArray(nodeTags.nodeId, nodeIds));

  const tagsByNode = new Map<string, string[]>();
  for (const row of rawTags) {
    const normalized = normalizeTag(row.tagName);
    const list = tagsByNode.get(row.nodeId) ?? [];
    if (!list.includes(normalized)) {
      list.push(normalized);
      tagsByNode.set(row.nodeId, list);
    }
  }

  const semanticRows = await db
    .select({
      sourceNodeId: edges.sourceNodeId,
      targetNodeId: edges.targetNodeId,
      weight: edges.weight,
    })
    .from(edges)
    .where(
      and(
        eq(edges.userId, userId),
        eq(edges.type, "semantic"),
        inArray(edges.sourceNodeId, nodeIds),
        inArray(edges.targetNodeId, nodeIds)
      )
    );

  const usageRows = await db.execute(sql`
    SELECT
      ref.memory_id,
      COUNT(*)::int AS usage_count
    FROM ${messages} m
    INNER JOIN ${conversations} c ON c.id = m.conversation_id
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(m.metadata->'memoryIds', '[]'::jsonb)) AS ref(memory_id)
    WHERE c.user_id = ${userId}
    GROUP BY ref.memory_id
  `);

  const usageCountByNode = new Map<string, number>();
  let maxUsage = 0;
  for (const row of usageRows.rows) {
    const memoryId = String(row.memory_id);
    const count = Number(row.usage_count || 0);
    usageCountByNode.set(memoryId, count);
    if (count > maxUsage) maxUsage = count;
  }

  const degreeByNode = new Map<string, number>();
  const maxSemanticByNode = new Map<string, number>();
  for (const row of semanticRows) {
    const src = row.sourceNodeId;
    const dst = row.targetNodeId;
    const weight = row.weight ?? 0;

    degreeByNode.set(src, (degreeByNode.get(src) ?? 0) + (weight >= 0.82 ? 1 : 0));
    degreeByNode.set(dst, (degreeByNode.get(dst) ?? 0) + (weight >= 0.82 ? 1 : 0));

    maxSemanticByNode.set(src, Math.max(maxSemanticByNode.get(src) ?? 0, weight));
    maxSemanticByNode.set(dst, Math.max(maxSemanticByNode.get(dst) ?? 0, weight));
  }

  const maxStrongConnections = Math.max(...degreeByNode.values(), 0);

  const scored = rawNodes.map((node) => {
    const recency = recencyScore(node.createdAt);
    const strongConnections = degreeByNode.get(node.id) ?? 0;
    const connectionScore =
      maxStrongConnections > 0 ? strongConnections / maxStrongConnections : 0;
    const usage = usageScore(usageCountByNode.get(node.id) ?? 0, maxUsage);
    const uniqueness = 1 - (maxSemanticByNode.get(node.id) ?? 0);

    const importance = clamp01(
      0.35 * recency +
        0.3 * clamp01(connectionScore) +
        0.2 * usage +
        0.15 * clamp01(uniqueness)
    );

    return {
      ...node,
      tags: tagsByNode.get(node.id) ?? [],
      importance,
      recency,
    };
  });

  const filteredByTag = opts.tag
    ? scored.filter((node) => node.tags.includes(normalizeTag(opts.tag!)))
    : scored;

  const selectedNodes = [...filteredByTag]
    .sort((a, b) => b.importance - a.importance || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, nodeLimit);

  if (selectedNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const selectedIds = selectedNodes.map((node) => node.id);
  const nodeSet = new Set(selectedIds);

  const candidates = new Map<string, CandidateEdge>();

  for (const row of semanticRows) {
    if (!nodeSet.has(row.sourceNodeId) || !nodeSet.has(row.targetNodeId)) continue;
    if (row.sourceNodeId === row.targetNodeId) continue;

    const key = pairKey(row.sourceNodeId, row.targetNodeId);
    const prev = candidates.get(key);
    const next: CandidateEdge = {
      source: row.sourceNodeId,
      target: row.targetNodeId,
      semantic: Math.max(prev?.semantic ?? 0, row.weight ?? 0),
      tag: prev?.tag,
      temporal: prev?.temporal,
    };

    candidates.set(key, next);
  }

  const tagSets = new Map<string, Set<string>>();
  for (const node of selectedNodes) {
    tagSets.set(node.id, new Set(node.tags));
  }

  const idsForPairs = [...selectedIds];
  for (let i = 0; i < idsForPairs.length; i++) {
    for (let j = i + 1; j < idsForPairs.length; j++) {
      const a = idsForPairs[i]!;
      const b = idsForPairs[j]!;
      const tagsA = tagSets.get(a)!;
      const tagsB = tagSets.get(b)!;
      if (tagsA.size === 0 || tagsB.size === 0) continue;

      let overlap = 0;
      for (const tagName of tagsA) {
        if (tagsB.has(tagName)) overlap++;
      }
      if (overlap === 0) continue;

      const union = new Set([...tagsA, ...tagsB]).size;
      const tagScore = clamp01(overlap / Math.max(1, union));
      const key = pairKey(a, b);
      const prev = candidates.get(key);
      candidates.set(key, {
        source: a,
        target: b,
        semantic: prev?.semantic,
        tag: Math.max(prev?.tag ?? 0, tagScore),
        temporal: prev?.temporal,
      });
    }
  }

  const timeRows = rawNodes
    .filter((n) => nodeSet.has(n.id))
    .map((n) => ({ id: n.id, createdAt: n.createdAt }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const temporalWindowMs = TEMPORAL_WINDOW_HOURS * 60 * 60 * 1000;

  for (let i = 0; i < timeRows.length; i++) {
    for (let j = i + 1; j < Math.min(timeRows.length, i + 1 + TEMPORAL_NEIGHBORS); j++) {
      const a = timeRows[i]!;
      const b = timeRows[j]!;
      const deltaMs = Math.abs(b.createdAt.getTime() - a.createdAt.getTime());
      if (deltaMs > temporalWindowMs) continue;

      const temporalScore = clamp01(1 - deltaMs / temporalWindowMs);
      const key = pairKey(a.id, b.id);
      const prev = candidates.get(key);
      candidates.set(key, {
        source: a.id,
        target: b.id,
        semantic: prev?.semantic,
        tag: prev?.tag,
        temporal: Math.max(prev?.temporal ?? 0, temporalScore),
      });
    }
  }

  const rankedEdges = [...candidates.values()]
    .map((edge) => {
      const dominant = dominantEdge(edge);
      if (!dominant) return null;
      return {
        edge,
        type: dominant.type,
        score: dominant.score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
    .filter(({ score }) => score > 0.2)
    .sort((a, b) => b.score - a.score);

  const degree = new Map<string, number>();
  const maxEdges = Math.max(20, Math.min(selectedNodes.length * 2, 120));
  const selected: MemoryGraphEdge[] = [];

  for (const { edge, type, score } of rankedEdges) {
    if (selected.length >= maxEdges) break;

    const srcDegree = degree.get(edge.source) ?? 0;
    const dstDegree = degree.get(edge.target) ?? 0;
    if (srcDegree >= edgeLimitPerNode || dstDegree >= edgeLimitPerNode) continue;

    degree.set(edge.source, srcDegree + 1);
    degree.set(edge.target, dstDegree + 1);

    selected.push({
      id: edgeId("rel", edge.source, edge.target),
      source: edge.source,
      target: edge.target,
      type,
      weight: Number(score.toFixed(4)),
      reasons: {
        semantic: edge.semantic,
        tag: edge.tag,
        temporal: edge.temporal,
      },
    });
  }

  const tagFrequency = new Map<string, number>();
  for (const node of selectedNodes) {
    for (const tag of node.tags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
    }
  }

  const rootLabels = [...tagFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= 2)
    .slice(0, MAX_ROOTS)
    .map(([tag]) => tag);

  if (rootLabels.length === 0) {
    rootLabels.push("general");
  }

  const rootLoad = new Map(rootLabels.map((label) => [label, 0]));
  const rootAssignments = new Map<string, string>();

  for (const node of selectedNodes) {
    const candidateRoots = rootLabels.filter((root) => node.tags.includes(root));
    const pool = candidateRoots.length > 0 ? candidateRoots : rootLabels;

    pool.sort((a, b) => {
      const loadDiff = (rootLoad.get(a) ?? 0) - (rootLoad.get(b) ?? 0);
      if (loadDiff !== 0) return loadDiff;
      return (tagFrequency.get(b) ?? 0) - (tagFrequency.get(a) ?? 0);
    });

    const assignedRoot = pool[0]!;
    rootAssignments.set(node.id, assignedRoot);
    rootLoad.set(assignedRoot, (rootLoad.get(assignedRoot) ?? 0) + 1);
  }

  const nowIso = new Date().toISOString();
  const rootNodes: MemoryGraphNode[] = rootLabels.map((label) => {
    const rootId = rootIdFromLabel(label);
    const load = rootLoad.get(label) ?? 0;

    return {
      id: rootId,
      kind: "root",
      content: `${load} linked memories`,
      summary: toTitleCase(label),
      tags: [label],
      importance: 1,
      createdAt: nowIso,
      source: "cluster",
    };
  });

  const rootEdges: MemoryGraphEdge[] = selectedNodes.map((node) => {
    const rootLabel = rootAssignments.get(node.id) ?? "general";
    const rootId = rootIdFromLabel(rootLabel);

    return {
      id: edgeId("root", rootId, node.id),
      source: rootId,
      target: node.id,
      type: "root",
      weight: 1,
      reasons: { root: 1 },
    };
  });

  const memoryNodes: MemoryGraphNode[] = selectedNodes.map((n) => ({
    id: n.id,
    kind: "memory",
    content: n.content ?? null,
    summary: n.summary ?? n.title ?? "Untitled memory",
    tags: n.tags.slice(0, 6),
    importance: Number(n.importance.toFixed(4)),
    createdAt: n.createdAt.toISOString(),
    source: n.source ?? "manual",
    embedding: n.embedding ?? undefined,
  }));

  return {
    nodes: [...rootNodes, ...memoryNodes],
    edges: [...rootEdges, ...selected],
  };
}

export interface StructuredMemory {
  id: string;
  type: "goal" | "preference" | "fact" | "behavior";
  entity: string;
  content: string;
  importance: number;
  createdAt: string;
  isDurable: boolean;
}

interface GraphMutationDeps {
  db: Database;
  userId: string;
  hfApiKey?: string;
}

interface MemoryExtractionParams extends GraphMutationDeps {
  groqApiKey: string;
  userMessage: string;
  assistantMessage?: string;
  explicitStore?: boolean;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  isMemoryQuery?: boolean;
  intent?: string;
  extractionConfidence?: number;
}

interface GraphMutationOutcome {
  action: "CREATE" | "UPDATE" | "LINK" | "SKIP";
  nodeId: string;
  linkedToNodeId?: string;
  similarity?: number;
}

function inferMemoryType(kind: string): StructuredMemory["type"] {
  if (kind === "goal" || kind === "project") return "goal";
  if (kind === "preference") return "preference";
  if (kind === "identity" || kind === "relationship") return "behavior";
  return "fact";
}

function extractEntity(candidate: MemoryCandidate): string {
  const payloadEntity =
    (typeof candidate.jsonPayload?.entity === "string" && candidate.jsonPayload.entity.trim()) ||
    (typeof candidate.jsonPayload?.subject === "string" && candidate.jsonPayload.subject.trim()) ||
    "";
  if (payloadEntity) return payloadEntity.slice(0, 120);

  const fromText = candidate.summary.match(/\b(my|i|our)\s+([a-z0-9 _-]{2,40})/i);
  if (fromText?.[2]) return fromText[2].trim().slice(0, 120);

  return "user";
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function buildStructuredMemory(candidate: MemoryCandidate): StructuredMemory {
  const content = candidate.canonicalText.trim().slice(0, 1200);
  return {
    id: "",
    type: inferMemoryType(candidate.kind),
    entity: extractEntity(candidate),
    content,
    importance: clamp(candidate.salience * 0.65 + candidate.confidence * 0.35),
    createdAt: new Date().toISOString(),
    isDurable: isDurableMemoryText(content),
  };
}

function memoryTitle(memory: StructuredMemory): string {
  const entityPrefix = memory.entity === "user" ? "" : `${memory.entity}: `;
  return `${entityPrefix}${memory.type}`.slice(0, 120);
}

async function findBestSimilarityMatch(
  deps: GraphMutationDeps,
  memory: StructuredMemory
): Promise<{ node: GraphNode; similarity: number } | null> {
  const embedding = await generateEmbedding(memory.content, deps.hfApiKey, "query");
  if (!embedding) return null;

  const candidates = await semanticSearch(deps.db, deps.userId, embedding, {
    limit: 4,
    threshold: 0.75,
  });
  if (candidates.length === 0) return null;
  return candidates[0] ?? null;
}

async function findRelatedEntityNode(
  deps: GraphMutationDeps,
  memory: StructuredMemory,
  excludeNodeId?: string
): Promise<GraphNode | null> {
  if (!memory.entity || memory.entity === "user") return null;
  const listed = await listNodes(deps.db, deps.userId, {
    limit: 5,
    search: memory.entity,
  });
  return listed.nodes.find((node) => node.id !== excludeNodeId) ?? null;
}

function hasSameEntityAndType(existingNode: GraphNode, memory: StructuredMemory): boolean {
  const metadata = (existingNode.metadata ?? {}) as Record<string, unknown>;
  const entity = typeof metadata.entity === "string" ? metadata.entity : "user";
  const type = typeof metadata.memoryType === "string" ? metadata.memoryType : "fact";
  return entity.toLowerCase() === memory.entity.toLowerCase() && type === memory.type;
}

export async function createNode(
  memory: StructuredMemory,
  deps: GraphMutationDeps
): Promise<GraphNode> {
  if (!memory.isDurable) {
    throw new Error("Skipping non-durable memory create");
  }
  const embedding = await generateEmbedding(memory.content, deps.hfApiKey, "document");
  return graphCreateNode(deps.db, {
    userId: deps.userId,
    type: "note",
    title: memoryTitle(memory),
    summary: memory.content.slice(0, 180),
    content: memory.content,
    source: "decision-engine",
    embedding: embedding ?? undefined,
    metadata: {
      memoryType: memory.type,
      entity: memory.entity,
      importance: memory.importance,
      createdAt: memory.createdAt,
    },
  });
}

export async function updateNode(
  existingNode: GraphNode,
  memory: StructuredMemory,
  deps: GraphMutationDeps
): Promise<GraphNode | null> {
  if (!memory.isDurable) {
    return null;
  }
  const metadata = {
    ...(existingNode.metadata ?? {}),
    memoryType: memory.type,
    entity: memory.entity,
    importance: Math.max(
      memory.importance,
      Number((existingNode.metadata as Record<string, unknown> | null)?.importance ?? 0)
    ),
    lastUpdatedAt: new Date().toISOString(),
  };

  return graphUpdateNode(deps.db, existingNode.id, deps.userId, {
    title: memoryTitle(memory),
    summary: memory.content.slice(0, 180),
    content: memory.content,
    metadata,
  });
}

export async function linkNodes(
  nodeA: GraphNode,
  nodeB: GraphNode,
  relation: string,
  deps: GraphMutationDeps
): Promise<void> {
  if (nodeA.id === nodeB.id) return;
  await deps.db
    .insert(edges)
    .values({
      userId: deps.userId,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
      type: "reference",
      weight: 0.75,
      metadata: { relation, source: "decision-engine" },
    })
    .onConflictDoNothing();
}

async function applyMemoryToGraph(
  deps: GraphMutationDeps,
  memory: StructuredMemory
): Promise<GraphMutationOutcome> {
  if (!memory.isDurable) {
    return { action: "SKIP", nodeId: "" };
  }

  const similar = await findBestSimilarityMatch(deps, memory);
  if (similar && similar.similarity > 0.9) {
    const updated = await updateNode(similar.node, memory, deps);
    return {
      action: "UPDATE",
      nodeId: updated?.id ?? similar.node.id,
      similarity: similar.similarity,
    };
  }

  if (similar && hasSameEntityAndType(similar.node, memory)) {
    const updated = await updateNode(similar.node, memory, deps);
    return {
      action: "UPDATE",
      nodeId: updated?.id ?? similar.node.id,
      similarity: similar.similarity,
    };
  }

  const relatedEntityNode = await findRelatedEntityNode(deps, memory, similar?.node.id);
  if (relatedEntityNode && similar?.node) {
    await linkNodes(similar.node, relatedEntityNode, "related_entity", deps);
    return {
      action: "LINK",
      nodeId: similar.node.id,
      linkedToNodeId: relatedEntityNode.id,
      similarity: similar.similarity,
    };
  }

  const created = await createNode(memory, deps);
  if (relatedEntityNode) {
    await linkNodes(created, relatedEntityNode, "related_entity", deps);
    return {
      action: "LINK",
      nodeId: created.id,
      linkedToNodeId: relatedEntityNode.id,
    };
  }

  return { action: "CREATE", nodeId: created.id };
}

export async function runMemoryExtraction(params: MemoryExtractionParams) {
  if (params.isMemoryQuery) {
    return {
      candidates: [] as StructuredMemory[],
      operations: [] as GraphMutationOutcome[],
    };
  }

  if (
    !canWriteMemory({
      intent: params.intent ?? "ask",
      isMemoryQuery: !!params.isMemoryQuery,
      extractionConfidence: params.extractionConfidence ?? 0,
      message: params.userMessage,
    })
  ) {
    return {
      candidates: [] as StructuredMemory[],
      operations: [] as GraphMutationOutcome[],
    };
  }

  const candidates = await extractMemoryCandidates({
    apiKey: params.groqApiKey,
    input: {
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
      recentHistory: params.history,
      explicitStore: params.explicitStore,
    },
  });

  const structured = candidates.map(buildStructuredMemory);
  const operations = await Promise.all(
    structured.map((memory) =>
      applyMemoryToGraph(
        { db: params.db, userId: params.userId, hfApiKey: params.hfApiKey },
        memory
      )
    )
  );

  return {
    candidates: structured,
    operations,
  };
}
