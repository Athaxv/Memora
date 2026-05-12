"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

type GraphNode = {
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
  metadata?: Record<string, unknown>;
};

type GraphEdge = {
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
};

type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/** Stable fallback so hooks don’t see new object/array references every render when the query is idle. */
const EMPTY_GRAPH_PAYLOAD: GraphPayload = { nodes: [], edges: [] };

const STABLE_EMPTY_CONNECTED_IDS = new Set<string>();

type MemoryNodeData = {
  summary: string;
  content: string;
  tags: string[];
  importance: number;
  createdAt: string;
  source: string;
  active: boolean;
  dimmed: boolean;
  kind: "memory";
};

type RootNodeData = {
  summary: string;
  content: string;
  active: boolean;
  dimmed: boolean;
  kind: "root";
};

type TopicNodeData = {
  summary: string;
  active: boolean;
  dimmed: boolean;
  kind: "topic";
};

type TimelineNodeData = {
  summary: string;
  content: string;
  active: boolean;
  dimmed: boolean;
  kind: "timeline";
};

type AssetNodeData = {
  summary: string;
  content: string;
  assetType: string;
  active: boolean;
  dimmed: boolean;
  kind: "asset";
};

type FlowNodeData =
  | MemoryNodeData
  | RootNodeData
  | TopicNodeData
  | TimelineNodeData
  | AssetNodeData;

const EDGE_COLORS: Record<GraphEdge["relationType"], string> = {
  root_link: "#7c3aed",
  topic_link: "#8b5cf6",
  timeline_link: "#0ea5e9",
  asset_link: "#f59e0b",
  semantic: "#a855f7",
  tag: "#6366f1",
  temporal: "#3b82f6",
};

const EDGE_LABELS: Record<GraphEdge["relationType"], string> = {
  root_link: "root",
  topic_link: "topic",
  timeline_link: "timeline",
  asset_link: "asset",
  semantic: "semantic",
  tag: "shared tag",
  temporal: "timeline",
};

function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function relatedMemoryIdFromAssetNode(nodeId: string): string | null {
  if (!nodeId.startsWith("asset:")) return null;
  const sourceId = nodeId.slice("asset:".length).trim();
  return sourceId || null;
}

function RootNode({ data }: NodeProps<Node<RootNodeData>>) {
  return (
    <div
      className={`w-64 rounded-full border px-6 py-8 text-center ${
        data.active ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Root</p>
      <p className="mt-1 text-[16px] font-black text-zinc-900">{data.content || "User"}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{data.summary}</p>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-zinc-700" />
    </div>
  );
}

function TopicNode({ data }: NodeProps<Node<TopicNodeData>>) {
  return (
    <div
      className={`w-52 rounded-lg border px-3 py-2 text-center ${
        data.active ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2 bg-zinc-500" />
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Topic</p>
      <p className="line-clamp-2 text-[13px] font-black text-zinc-900">{data.summary}</p>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-zinc-500" />
    </div>
  );
}

function TimelineNode({ data }: NodeProps<Node<TimelineNodeData>>) {
  return (
    <div
      className={`w-48 rounded-md border px-3 py-2 text-center ${
        data.active ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2 bg-sky-500" />
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">Timeline</p>
      <p className="line-clamp-1 text-[12px] font-black text-zinc-900">{data.summary}</p>
      <p className="line-clamp-1 text-[10px] text-zinc-500">{data.content}</p>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-sky-500" />
    </div>
  );
}

function AssetNode({ data }: NodeProps<Node<AssetNodeData>>) {
  return (
    <div
      className={`w-56 rounded-lg border px-3 py-2 ${
        data.active ? "border-amber-700 bg-amber-50" : "border-amber-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2 bg-amber-500" />
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Asset</p>
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">
          {data.assetType || "file"}
        </span>
      </div>
      <p className="line-clamp-2 text-[12px] font-black text-zinc-900">{data.summary}</p>
      <p className="mt-1 line-clamp-1 text-[10px] text-zinc-500">{data.content}</p>
    </div>
  );
}

function MemoryCardNode({ data }: NodeProps<Node<MemoryNodeData>>) {
  return (
    <div
      className={`w-72 rounded-xl border px-3.5 py-3 shadow-[0_8px_20px_rgba(9,9,11,0.08)] transition-all ${
        data.active
          ? "border-zinc-900 bg-white shadow-[0_12px_30px_rgba(124,58,237,0.15)]"
          : "border-zinc-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2 bg-zinc-400" />

      <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-zinc-900 px-2.5 py-1.5 text-white">
        <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-100">
          Memory Node
        </p>
        <div className="flex items-center gap-1">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-200">
            {data.source}
          </span>
          <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">
            {Math.round(data.importance * 100)}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[14px] font-black leading-tight text-zinc-900">
          {data.summary || "Untitled memory"}
        </p>
        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-900" />
      </div>

      <p className="mb-3 line-clamp-3 text-[12px] leading-relaxed text-zinc-600">{data.content}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {data.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700"
          >
            {tag}
          </span>
        ))}
        {data.tags.length === 0 && (
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            no tags
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>
          {new Date(data.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="font-bold uppercase tracking-widest">open details</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-zinc-400" />
    </div>
  );
}

const nodeTypes = {
  memory: MemoryCardNode,
  root: RootNode,
  topic: TopicNode,
  timeline: TimelineNode,
  asset: AssetNode,
};

const graphQueryParams = new URLSearchParams({
  limit: "50",
  edgeLimitPerNode: "3",
}).toString();

export default function MemoryGraphPage() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedNodeType, setSelectedNodeType] = useState<string>("all");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { data, isLoading: loading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.memories.graph(graphQueryParams),
    queryFn: async () => {
      const response = await api(`/memories/graph?${graphQueryParams}`);
      if (!response.ok) {
        throw new Error("Failed to load memory graph.");
      }
      return (await response.json()) as GraphPayload;
    },
    staleTime: 90_000,
  });

  const payload = data ?? EMPTY_GRAPH_PAYLOAD;

  const reloading = isFetching && !loading;
  const error = isError ? "Failed to load memory graph." : "";

  const rootNode = useMemo(
    () => payload.nodes.find((node) => node.kind === "root") ?? null,
    [payload.nodes]
  );
  const topicNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "topic"),
    [payload.nodes]
  );
  const memoryNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "memory"),
    [payload.nodes]
  );
  const timelineNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "timeline"),
    [payload.nodes]
  );
  const assetNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "asset"),
    [payload.nodes]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const node of memoryNodes) {
      for (const tag of node.tags) tagSet.add(tag);
    }
    return ["all", ...[...tagSet].sort((a, b) => a.localeCompare(b))];
  }, [memoryNodes]);

  const visibleMemoryIds = useMemo(() => {
    if (
      selectedNodeType !== "all" &&
      selectedNodeType !== "memory" &&
      selectedNodeType !== "asset"
    ) {
      return new Set<string>();
    }
    if (selectedTag === "all") return new Set(memoryNodes.map((n) => n.id));
    return new Set(memoryNodes.filter((n) => n.tags.includes(selectedTag)).map((n) => n.id));
  }, [memoryNodes, selectedTag, selectedNodeType]);

  const memoryFlowNodes = useMemo(() => {
    const result: Node<FlowNodeData>[] = [];
    const center = { x: 0, y: 0 };
    const topicRadius = 420;
    const memoryRadiusBase = 760;

    if (rootNode) {
      result.push({
        id: rootNode.id,
        type: "root",
        position: center,
        data: {
          summary: rootNode.summary,
          content: rootNode.content ?? "User",
          active: false,
          dimmed: false,
          kind: "root",
        },
      });
    }

    const visibleTopics = topicNodes.filter((topic) =>
      [...memoryNodes, ...assetNodes].some(
        (leaf) =>
          leaf.topicId === topic.id &&
          (leaf.kind !== "memory" || visibleMemoryIds.has(leaf.id))
      )
    );
    const topicAngleStep = (2 * Math.PI) / Math.max(visibleTopics.length, 1);

    visibleTopics.forEach((topic, index) => {
      const angle = index * topicAngleStep;
      const tx = Math.cos(angle) * topicRadius;
      const ty = Math.sin(angle) * topicRadius;
      result.push({
        id: topic.id,
        type: "topic",
        position: { x: tx, y: ty },
        data: {
          summary: topic.summary,
          active: false,
          dimmed: false,
          kind: "topic",
        },
      });

      const topicTimelines = timelineNodes.filter((timeline) => timeline.topicId === topic.id);
      const timelineSpread = Math.max(0.2, Math.min(0.8, topicTimelines.length * 0.08));
      const timelineStart = angle - timelineSpread / 2;
      const timelineStep =
        topicTimelines.length > 1 ? timelineSpread / (topicTimelines.length - 1) : 0;
      topicTimelines.forEach((timeline, timelineIndex) => {
        const ta = timelineStart + timelineIndex * timelineStep;
        result.push({
          id: timeline.id,
          type: "timeline",
          position: { x: Math.cos(ta) * 640, y: Math.sin(ta) * 640 },
          data: {
            summary: timeline.summary,
            content: timeline.content ?? "",
            active: false,
            dimmed: false,
            kind: "timeline",
          },
        });
      });

      const topicMemories = memoryNodes
        .filter((memory) => memory.topicId === topic.id && visibleMemoryIds.has(memory.id))
        .sort((a, b) => a.depth - b.depth || b.importance - a.importance);
      const byDepth = new Map<number, GraphNode[]>();
      for (const memory of topicMemories) {
        const list = byDepth.get(memory.depth) ?? [];
        list.push(memory);
        byDepth.set(memory.depth, list);
      }

      for (const [depth, levelNodes] of byDepth.entries()) {
        const spread = Math.max(0.28, Math.min(0.9, levelNodes.length * 0.11));
        const start = angle - spread / 2;
        const step = levelNodes.length > 1 ? spread / (levelNodes.length - 1) : 0;
        const ring = memoryRadiusBase + Math.max(0, depth - 2) * 210;
        levelNodes.forEach((member, idx) => {
          const a = start + idx * step;
          result.push({
            id: member.id,
            type: "memory",
            position: { x: Math.cos(a) * ring, y: Math.sin(a) * ring },
            data: {
              summary: member.summary,
              content: truncate(member.content || "No content available."),
              tags: member.tags,
              importance: member.importance,
              createdAt: member.createdAt,
              source: member.source,
              active: false,
              dimmed: false,
              kind: "memory",
            },
          });
        });
      }

      const filteredAssets = assetNodes.filter((asset) => {
        if (asset.topicId !== topic.id) return false;
        if (selectedNodeType === "all" || selectedNodeType === "asset") return true;
        const assetType =
          typeof asset.metadata?.assetType === "string"
            ? asset.metadata.assetType.toLowerCase()
            : "";
        return assetType.includes(selectedNodeType);
      });
      const assetSpread = Math.max(0.22, Math.min(0.95, filteredAssets.length * 0.11));
      const assetStart = angle - assetSpread / 2;
      const assetStep = filteredAssets.length > 1 ? assetSpread / (filteredAssets.length - 1) : 0;
      filteredAssets.forEach((asset, idx) => {
        const a = assetStart + idx * assetStep;
        result.push({
          id: asset.id,
          type: "asset",
          position: { x: Math.cos(a) * 1140, y: Math.sin(a) * 1140 },
          data: {
            summary: asset.summary,
            content: String(asset.content ?? ""),
            assetType:
              typeof asset.metadata?.assetType === "string" ? asset.metadata.assetType : "asset",
            active: false,
            dimmed: false,
            kind: "asset",
          },
        });
      });
    });

    return result;
  }, [
    rootNode,
    topicNodes,
    memoryNodes,
    timelineNodes,
    assetNodes,
    visibleMemoryIds,
    selectedNodeType,
  ]);

  const baseNodes = useMemo(() => [...memoryFlowNodes], [memoryFlowNodes]);

  const visibleNodeIds = useMemo(
    () => new Set(baseNodes.map((node) => node.id)),
    [baseNodes]
  );

  const graphEdges = useMemo<Edge[]>(() => {
    return payload.edges
      .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: edge.type === "cross" && edge.relationType === "semantic",
        label: EDGE_LABELS[edge.relationType],
        labelShowBg: true,
        labelBgPadding: [4, 2],
        labelStyle: {
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fill: EDGE_COLORS[edge.relationType],
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_COLORS[edge.relationType],
          width: edge.type === "tree" ? 14 : 12,
          height: edge.type === "tree" ? 14 : 12,
        },
        style: {
          stroke: EDGE_COLORS[edge.relationType],
          strokeDasharray: edge.type === "cross" ? "5 5" : undefined,
          strokeWidth:
            edge.type === "tree"
              ? Math.max(1.4, Math.min(4.5, edge.weight * 4.5))
              : Math.max(1, Math.min(2.4, edge.weight * 2.4)),
          opacity: edge.type === "tree" ? 0.95 : 0.45,
        },
        data: {
          edgeType: edge.type,
          relationType: edge.relationType,
          weight: edge.weight,
        },
      }));
  }, [payload.edges, visibleNodeIds]);

  const baseEdges = useMemo(() => graphEdges, [graphEdges]);

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return STABLE_EMPTY_CONNECTED_IDS;

    const connected = new Set<string>([activeNodeId]);
    for (const edge of baseEdges) {
      if (edge.source === activeNodeId) connected.add(edge.target);
      if (edge.target === activeNodeId) connected.add(edge.source);
    }
    return connected;
  }, [activeNodeId, baseEdges]);

  useEffect(() => {
    setFlowNodes((prev) => {
      const positions = new Map(prev.map((node) => [node.id, node.position]));

      return baseNodes.map((node) => {
        const active = node.id === activeNodeId;
        const dimmed =
          !!activeNodeId && connectedNodeIds.size > 0 && !connectedNodeIds.has(node.id);

        return {
          ...node,
          position: positions.get(node.id) ?? node.position,
          data: {
            ...node.data,
            active,
            dimmed,
          },
        };
      });
    });
  }, [baseNodes, activeNodeId, connectedNodeIds, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(() => {
      if (!activeNodeId) return baseEdges;

      return baseEdges.map((edge) => {
        const isActive = edge.source === activeNodeId || edge.target === activeNodeId;
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: isActive ? 1 : 0.15,
          },
        };
      });
    });
  }, [baseEdges, activeNodeId, setFlowEdges]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
          <div className="h-1.5 w-1.5 border border-zinc-200 bg-zinc-400 animate-pulse [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 border border-zinc-200 bg-white animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[16px] font-bold tracking-tight text-zinc-900">Memory Graph</h1>
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {flowNodes.length} nodes / {flowEdges.length} edges
        </span>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Semantic</span>
          <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Tag</span>
          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Temporal</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            disabled={reloading}
            aria-label={reloading ? "Reloading graph" : "Reload graph"}
            title={reloading ? "Reloading graph" : "Reload graph"}
            className="inline-flex h-9 w-9 items-center justify-center border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {reloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#7c3aed]" />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10" />
                <path d="M20.5 15a9 9 0 0 1-14.8 3.4L1 14" />
              </svg>
            )}
          </button>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            Filter tag
          </label>
          <select
            value={selectedTag}
            onChange={(event) => {
              setSelectedTag(event.target.value);
              setActiveNodeId(null);
            }}
            className="border border-zinc-300 bg-white px-3 py-2 text-[12px] text-zinc-700"
          >
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            Type
          </label>
          <select
            value={selectedNodeType}
            onChange={(event) => {
              setSelectedNodeType(event.target.value);
              setActiveNodeId(null);
            }}
            className="border border-zinc-300 bg-white px-3 py-2 text-[12px] text-zinc-700"
          >
            {["all", "memory", "asset", "document", "image", "link"].map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden rounded-xl border border-[#d6d3d1] bg-[radial-gradient(circle_at_top,#f4f4f5_0,#ffffff_38%,#f4f4f5_100%)]">
          <ReactFlow
            fitView
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            minZoom={0.35}
            maxZoom={1.8}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onPaneClick={() => setActiveNodeId(null)}
            onNodeClick={(_, node) => {
              const kind = (node.data as FlowNodeData).kind;
              if (kind === "asset") {
                const sourceMemoryId = relatedMemoryIdFromAssetNode(node.id);
                if (sourceMemoryId) {
                  router.push(`/memories/${sourceMemoryId}`);
                  return;
                }
              }
              setActiveNodeId(node.id);
            }}
            onNodeDoubleClick={(_, node) => {
              const kind = (node.data as FlowNodeData).kind;
              if (kind === "memory") {
                router.push(`/memories/${node.id}`);
                return;
              }
              if (kind === "asset") {
                const asset = payload.nodes.find((entry) => entry.id === node.id);
                const url =
                  typeof asset?.metadata?.assetPublicUrl === "string"
                    ? asset.metadata.assetPublicUrl
                    : typeof asset?.metadata?.sourceUrl === "string"
                      ? asset.metadata.sourceUrl
                      : null;
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }
            }}
            defaultEdgeOptions={{
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
          >
            <MiniMap
              pannable
              zoomable
              className="border border-zinc-300 bg-white"
              nodeColor={(node) =>
                node.data?.kind === "root"
                  ? "#111827"
                  : node.data?.kind === "topic"
                    ? "#7c3aed"
                    : node.data?.kind === "timeline"
                      ? "#0ea5e9"
                      : node.data?.kind === "asset"
                        ? "#f59e0b"
                    : node.id === activeNodeId
                      ? "#7c3aed"
                      : "#d4d4d8"
              }
            />
            <Controls className="border border-zinc-300 bg-white" />
            <Background color="#d6d3d1" gap={20} size={1} />
          </ReactFlow>
        </div>
      )}

      <p className="mt-3 text-[11px] text-zinc-500">
        Tip: click a node to highlight connected memories, double-click to open full memory.
      </p>
    </div>
  );
}
