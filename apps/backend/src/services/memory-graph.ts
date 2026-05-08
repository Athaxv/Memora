import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { conversations, edges, messages, nodeTags, nodes, tags, users } from "@repo/db/schema";
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
  kind: "root" | "topic" | "timeline" | "memory" | "asset";
  content: string | null;
  summary: string;
  tags: string[];
  importance: number;
  createdAt: string;
  source: string;
  parentId: string | null;
  depth: number;
  topicId: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface MemoryGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "tree" | "cross";
  relationType:
    | "root_link"
    | "topic_link"
    | "timeline_link"
    | "asset_link"
    | "semantic"
    | "tag"
    | "temporal";
  weight: number;
  reasons: {
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

type TopicInfo = {
  topicId: string;
  topicLabel: string;
};

const DEFAULT_NODE_LIMIT = 50;
const DEFAULT_EDGE_LIMIT_PER_NODE = 3;
const TEMPORAL_WINDOW_HOURS = 48;
const TEMPORAL_NEIGHBORS = 2;
const CANDIDATE_MULTIPLIER = 4;
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function inferTopicLabel(params: {
  tags: string[];
  summary: string | null;
  title: string | null;
  source: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const explicit =
    typeof params.metadata?.topicLabel === "string" ? params.metadata.topicLabel.trim() : "";
  if (explicit) return explicit;
  if (params.tags.length > 0) return params.tags[0]!;
  if (params.source === "upload") return "uploaded-content";
  const seed = (params.summary ?? params.title ?? "general").trim().toLowerCase();
  const words = seed
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "that", "this"].includes(w))
    .slice(0, 2);
  return words.length > 0 ? words.join(" ") : "general";
}

function buildTopicInfo(params: {
  tags: string[];
  summary: string | null;
  title: string | null;
  source: string | null;
  metadata?: Record<string, unknown> | null;
}): TopicInfo {
  const label = inferTopicLabel(params);
  return {
    topicId: `topic:${slugify(label) || "general"}`,
    topicLabel: label,
  };
}

function toTimelineBucket(value: unknown, createdAt: Date): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  const utc = new Date(Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), createdAt.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function timelineId(topicId: string, bucket: string, sessionHint: string): string {
  return `timeline:${slugify(topicId)}:${slugify(bucket)}:${slugify(sessionHint)}`;
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
      metadata: nodes.metadata,
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
  const relationEdges: Array<{
    source: string;
    target: string;
    relationType: "semantic" | "tag" | "temporal";
    weight: number;
    reasons: MemoryGraphEdge["reasons"];
  }> = [];

  for (const { edge, type, score } of rankedEdges) {
    if (relationEdges.length >= maxEdges) break;

    const srcDegree = degree.get(edge.source) ?? 0;
    const dstDegree = degree.get(edge.target) ?? 0;
    if (srcDegree >= edgeLimitPerNode || dstDegree >= edgeLimitPerNode) continue;

    degree.set(edge.source, srcDegree + 1);
    degree.set(edge.target, dstDegree + 1);

    relationEdges.push({
      source: edge.source,
      target: edge.target,
      relationType: type,
      weight: Number(score.toFixed(4)),
      reasons: {
        semantic: edge.semantic,
        tag: edge.tag,
        temporal: edge.temporal,
      },
    });
  }

  const adjacency = new Map<string, typeof relationEdges>();
  for (const edge of relationEdges) {
    const sourceList = adjacency.get(edge.source) ?? [];
    sourceList.push(edge);
    adjacency.set(edge.source, sourceList);

    const targetList = adjacency.get(edge.target) ?? [];
    targetList.push(edge);
    adjacency.set(edge.target, targetList);
  }

  const orderedNodes = [...selectedNodes].sort(
    (a, b) => b.importance - a.importance || b.createdAt.getTime() - a.createdAt.getTime()
  );

  const topicByNode = new Map<string, TopicInfo>();
  for (const node of selectedNodes) {
    topicByNode.set(
      node.id,
      buildTopicInfo({
        tags: node.tags,
        summary: node.summary,
        title: node.title,
        source: node.source,
        metadata: (node.metadata ?? null) as Record<string, unknown> | null,
      })
    );
  }

  const parentByNode = new Map<string, string | null>();
  const depthByNode = new Map<string, number>();
  const topicIdByNode = new Map<string, string>();
  const treeKeySet = new Set<string>();
  const assignedByTopic = new Map<string, Set<string>>();
  const unassignedByTopic = new Map<string, Set<string>>();
  const orderedByTopic = new Map<string, typeof orderedNodes>();
  const treeEdges: MemoryGraphEdge[] = [];

  const topicIds = new Set<string>();
  for (const node of orderedNodes) {
    const topic = topicByNode.get(node.id) ?? { topicId: "topic:general", topicLabel: "general" };
    topicIds.add(topic.topicId);
    topicIdByNode.set(node.id, topic.topicId);
    if (!assignedByTopic.has(topic.topicId)) {
      assignedByTopic.set(topic.topicId, new Set<string>());
      unassignedByTopic.set(topic.topicId, new Set<string>());
      orderedByTopic.set(topic.topicId, []);
    }
    assignedByTopic.get(topic.topicId)!.add(node.id);
    unassignedByTopic.get(topic.topicId)!.add(node.id);
    orderedByTopic.get(topic.topicId)!.push(node);
  }

  for (const topicId of topicIds) {
    const topicAssigned = new Set<string>();
    const topicUnassigned = new Set(unassignedByTopic.get(topicId)!);
    const topicOrdered = orderedByTopic.get(topicId)!;
    const seed = topicOrdered.find((node) => topicUnassigned.has(node.id));
    if (!seed) continue;

    topicAssigned.add(seed.id);
    topicUnassigned.delete(seed.id);
    parentByNode.set(seed.id, topicId);
    depthByNode.set(seed.id, 2);

    while (topicUnassigned.size > 0) {
      let best:
        | {
            source: string;
            target: string;
            relationType: "semantic" | "tag" | "temporal";
            weight: number;
            reasons: MemoryGraphEdge["reasons"];
          }
        | null = null;

      for (const currentId of topicAssigned) {
        const neighbors = adjacency.get(currentId) ?? [];
        for (const edge of neighbors) {
          const otherId = edge.source === currentId ? edge.target : edge.source;
          if (!topicUnassigned.has(otherId)) continue;
          if ((topicIdByNode.get(otherId) ?? "") !== topicId) continue;
          if (!best || edge.weight > best.weight) {
            best = {
              source: currentId,
              target: otherId,
              relationType: edge.relationType,
              weight: edge.weight,
              reasons: edge.reasons,
            };
          }
        }
      }

      if (!best) {
        const nextSeed = topicOrdered.find((node) => topicUnassigned.has(node.id));
        if (!nextSeed) break;
        topicAssigned.add(nextSeed.id);
        topicUnassigned.delete(nextSeed.id);
        parentByNode.set(nextSeed.id, topicId);
        depthByNode.set(nextSeed.id, 2);
        continue;
      }

      topicAssigned.add(best.target);
      topicUnassigned.delete(best.target);
      parentByNode.set(best.target, best.source);
      depthByNode.set(best.target, (depthByNode.get(best.source) ?? 2) + 1);

      const treeKey = pairKey(best.source, best.target);
      treeKeySet.add(treeKey);
      treeEdges.push({
        id: edgeId("tree", best.source, best.target),
        source: best.source,
        target: best.target,
        type: "tree",
        relationType: best.relationType,
        weight: best.weight,
        reasons: best.reasons,
      });
    }
  }

  const crossEdges: MemoryGraphEdge[] = relationEdges
    .filter((edge) => !treeKeySet.has(pairKey(edge.source, edge.target)))
    .slice(0, Math.max(15, Math.min(40, selectedNodes.length)))
    .map((edge) => ({
      id: edgeId("cross", edge.source, edge.target),
      source: edge.source,
      target: edge.target,
      type: "cross",
      relationType: edge.relationType,
      weight: edge.weight,
      reasons: edge.reasons,
    }));

  const memoryNodes: MemoryGraphNode[] = selectedNodes.map((n) => {
    const topic = topicByNode.get(n.id) ?? { topicId: "topic:general", topicLabel: "general" };
    const nodeMetadata = (n.metadata ?? null) as Record<string, unknown> | null;
    const bucket = toTimelineBucket(nodeMetadata?.timelineBucket, n.createdAt);
    const sessionHint =
      typeof nodeMetadata?.createdFrom === "string" && nodeMetadata.createdFrom
        ? nodeMetadata.createdFrom
        : "timeline";
    const parentTimelineId = timelineId(topic.topicId, bucket, sessionHint);
    return {
      id: n.id,
      kind: "memory",
      content: n.content ?? null,
      summary: n.summary ?? n.title ?? "Untitled memory",
      tags: n.tags.slice(0, 6),
      importance: Number(n.importance.toFixed(4)),
      createdAt: n.createdAt.toISOString(),
      source: n.source ?? "manual",
      parentId: parentTimelineId,
      depth: 3,
      topicId: topic.topicId,
      embedding: n.embedding ?? undefined,
      metadata: nodeMetadata ?? undefined,
    };
  });

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      onboardingCompleted: users.onboardingCompleted,
      socialLinks: users.socialLinks,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const rootId = `root:user:${userId}`;
  const topicNodeMap = new Map<string, MemoryGraphNode>();
  for (const node of memoryNodes) {
    const topicLabel = (topicByNode.get(node.id)?.topicLabel ?? node.tags[0] ?? "general").trim();
    if (!topicNodeMap.has(node.topicId)) {
      topicNodeMap.set(node.topicId, {
        id: node.topicId,
        kind: "topic",
        content: `Topic branch: ${topicLabel}`,
        summary: topicLabel,
        tags: [topicLabel],
        importance: 0.85,
        createdAt: new Date().toISOString(),
        source: "topic-router",
        parentId: rootId,
        depth: 1,
        topicId: node.topicId,
      });
    }
  }

  const rootNode: MemoryGraphNode = {
    id: rootId,
    kind: "root",
    content: user?.name ?? "User",
    summary: "User Root",
    tags: ["root", "profile"],
    importance: 1,
    createdAt: new Date().toISOString(),
    source: "onboarding",
    parentId: null,
    depth: 0,
    topicId: rootId,
    metadata: {
      name: user?.name ?? null,
      email: user?.email ?? null,
      onboardingCompleted: user?.onboardingCompleted ?? false,
      socialLinks: user?.socialLinks ?? null,
    },
  };

  const topicEdges: MemoryGraphEdge[] = [...topicNodeMap.values()].map((topicNode) => ({
    id: edgeId("topic", rootId, topicNode.id),
    source: rootId,
    target: topicNode.id,
    type: "tree",
    relationType: "topic_link",
    weight: 1,
    reasons: {},
  }));

  const timelineNodeMap = new Map<string, MemoryGraphNode>();
  for (const memory of memoryNodes) {
    const meta = memory.metadata ?? {};
    const bucket = toTimelineBucket(meta.timelineBucket, new Date(memory.createdAt));
    const sessionHint =
      typeof meta.createdFrom === "string" && meta.createdFrom ? meta.createdFrom : "timeline";
    const tId = timelineId(memory.topicId, bucket, sessionHint);
    if (!timelineNodeMap.has(tId)) {
      timelineNodeMap.set(tId, {
        id: tId,
        kind: "timeline",
        content: `${bucket} · ${sessionHint}`,
        summary: `Timeline ${bucket}`,
        tags: [bucket],
        importance: 0.72,
        createdAt: memory.createdAt,
        source: "timeline-router",
        parentId: memory.topicId,
        depth: 2,
        topicId: memory.topicId,
        metadata: {
          timelineBucket: bucket,
          sessionHint,
        },
      });
    }
  }

  const timelineEdges: MemoryGraphEdge[] = [...timelineNodeMap.values()].map((timelineNode) => ({
    id: edgeId("timeline", timelineNode.topicId, timelineNode.id),
    source: timelineNode.topicId,
    target: timelineNode.id,
    type: "tree",
    relationType: "timeline_link",
    weight: 0.95,
    reasons: {},
  }));

  const timelineLeafEdges: MemoryGraphEdge[] = memoryNodes.map((node) => ({
    id: edgeId("timeline-leaf", node.parentId ?? node.topicId, node.id),
    source: node.parentId ?? node.topicId,
    target: node.id,
    type: "tree",
    relationType: "timeline_link",
    weight: 0.88,
    reasons: {},
  }));

  const assetNodes: MemoryGraphNode[] = [];
  const assetEdges: MemoryGraphEdge[] = [];
  for (const node of memoryNodes) {
    const meta = (node.metadata ?? {}) as Record<string, unknown>;
    const isNewAsset = Number(meta.assetNodeVersion ?? 0) >= 2;
    if (!isNewAsset) continue;
    const assetType = typeof meta.assetType === "string" ? meta.assetType : "";
    if (!["document", "image", "link", "tweet", "web_link", "media"].includes(assetType)) continue;
    const assetId = `asset:${node.id}`;
    assetNodes.push({
      id: assetId,
      kind: "asset",
      content:
        typeof meta.assetPublicUrl === "string"
          ? meta.assetPublicUrl
          : typeof meta.sourceUrl === "string"
            ? meta.sourceUrl
            : node.content,
      summary: typeof meta.assetOriginalName === "string" ? meta.assetOriginalName : node.summary,
      tags: [assetType],
      importance: Math.max(0.6, node.importance - 0.08),
      createdAt: node.createdAt,
      source: "asset",
      parentId: node.parentId,
      depth: node.depth,
      topicId: node.topicId,
      metadata: {
        ...meta,
        graphNodeType: "asset",
      },
    });
    assetEdges.push({
      id: edgeId("asset", node.id, assetId),
      source: node.id,
      target: assetId,
      type: "cross",
      relationType: "asset_link",
      weight: 0.92,
      reasons: {},
    });
  }

  return {
    nodes: [
      rootNode,
      ...topicNodeMap.values(),
      ...timelineNodeMap.values(),
      ...memoryNodes,
      ...assetNodes,
    ],
    edges: [
      ...topicEdges,
      ...timelineEdges,
      ...timelineLeafEdges,
      ...treeEdges,
      ...crossEdges,
      ...assetEdges,
    ],
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

function resolveTopicFromMemory(memory: StructuredMemory): TopicInfo {
  const source = `${memory.entity} ${memory.content}`.toLowerCase();
  if (/\bgate\b/.test(source)) return { topicId: "topic:gate", topicLabel: "gate" };
  if (/\b(dbms|os|operating systems|education|exam)\b/.test(source)) {
    return { topicId: "topic:education", topicLabel: "education" };
  }
  if (/\b(interview|communication|career)\b/.test(source)) {
    return { topicId: "topic:career", topicLabel: "career" };
  }
  const label = memory.type === "preference" ? "preferences" : memory.type;
  return { topicId: `topic:${slugify(label) || "general"}`, topicLabel: label };
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
      topicId: resolveTopicFromMemory(memory).topicId,
      topicLabel: resolveTopicFromMemory(memory).topicLabel,
      branchPath: [resolveTopicFromMemory(memory).topicId],
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
    topicId:
      (existingNode.metadata as Record<string, unknown> | null)?.topicId ??
      resolveTopicFromMemory(memory).topicId,
    topicLabel:
      (existingNode.metadata as Record<string, unknown> | null)?.topicLabel ??
      resolveTopicFromMemory(memory).topicLabel,
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
