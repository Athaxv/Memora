import { and, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { edges, nodeTags, nodes, tags } from "@repo/db/schema";
import type { Database } from "@repo/db/client";

export interface MemoryGraphNode {
  id: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  source: string;
}

export interface MemoryGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "semantic" | "tag" | "temporal";
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

const DEFAULT_NODE_LIMIT = 100;
const DEFAULT_EDGE_LIMIT_PER_NODE = 4;
const TEMPORAL_WINDOW_HOURS = 72;
const TEMPORAL_NEIGHBORS = 2;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function edgeId(source: string, target: string): string {
  return `e_${pairKey(source, target).replace(":", "_")}`;
}

function pickEdgeType(edge: CandidateEdge): "semantic" | "tag" | "temporal" {
  const semantic = edge.semantic ?? 0;
  const tag = (edge.tag ?? 0) * 0.7;
  const temporal = (edge.temporal ?? 0) * 0.5;

  if (semantic >= tag && semantic >= temporal) return "semantic";
  if (tag >= semantic && tag >= temporal) return "tag";
  return "temporal";
}

function scoreEdge(edge: CandidateEdge): number {
  const semantic = edge.semantic ?? 0;
  const tag = (edge.tag ?? 0) * 0.7;
  const temporal = (edge.temporal ?? 0) * 0.5;
  return clamp01(semantic + tag + temporal);
}

export async function getMemoryGraph(
  db: Database,
  userId: string,
  opts: MemoryGraphOpts = {}
): Promise<MemoryGraphResult> {
  const nodeLimit = opts.limit ?? DEFAULT_NODE_LIMIT;
  const edgeLimitPerNode = opts.edgeLimitPerNode ?? DEFAULT_EDGE_LIMIT_PER_NODE;

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
      createdAt: nodes.createdAt,
    })
    .from(nodes)
    .where(and(...nodeConditions))
    .orderBy(desc(nodes.createdAt))
    .limit(nodeLimit);

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
    const list = tagsByNode.get(row.nodeId) ?? [];
    list.push(row.tagName);
    tagsByNode.set(row.nodeId, list);
  }

  const filteredNodeIds = opts.tag
    ? nodeIds.filter((id) =>
        (tagsByNode.get(id) ?? []).some(
          (tagName) => tagName.toLowerCase() === opts.tag!.toLowerCase()
        )
      )
    : nodeIds;

  if (filteredNodeIds.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeSet = new Set(filteredNodeIds);

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
        inArray(edges.sourceNodeId, filteredNodeIds),
        inArray(edges.targetNodeId, filteredNodeIds)
      )
    );

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
  for (const id of filteredNodeIds) {
    tagSets.set(id, new Set((tagsByNode.get(id) ?? []).map((t) => t.toLowerCase())));
  }

  const idsForPairs = [...filteredNodeIds];
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
    .map((edge) => ({ edge, score: scoreEdge(edge) }))
    .filter(({ score }) => score > 0.15)
    .sort((a, b) => b.score - a.score);

  const degree = new Map<string, number>();
  const maxEdges = Math.max(40, filteredNodeIds.length * edgeLimitPerNode);
  const selected: MemoryGraphEdge[] = [];

  for (const { edge, score } of rankedEdges) {
    if (selected.length >= maxEdges) break;

    const srcDegree = degree.get(edge.source) ?? 0;
    const dstDegree = degree.get(edge.target) ?? 0;
    if (srcDegree >= edgeLimitPerNode || dstDegree >= edgeLimitPerNode) continue;

    degree.set(edge.source, srcDegree + 1);
    degree.set(edge.target, dstDegree + 1);

    selected.push({
      id: edgeId(edge.source, edge.target),
      source: edge.source,
      target: edge.target,
      type: pickEdgeType(edge),
      weight: Number(score.toFixed(4)),
      reasons: {
        semantic: edge.semantic,
        tag: edge.tag,
        temporal: edge.temporal,
      },
    });
  }

  const graphNodes: MemoryGraphNode[] = rawNodes
    .filter((n) => nodeSet.has(n.id))
    .map((n) => ({
      id: n.id,
      content: n.content ?? "",
      summary: n.summary ?? n.title ?? "Untitled memory",
      tags: (tagsByNode.get(n.id) ?? []).slice(0, 6),
      createdAt: n.createdAt.toISOString(),
      source: n.source ?? "manual",
    }));

  return {
    nodes: graphNodes,
    edges: selected,
  };
}
