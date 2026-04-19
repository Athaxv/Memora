"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type GraphNode = {
  id: string;
  kind: "memory" | "root";
  content: string | null;
  summary: string;
  tags: string[];
  importance: number;
  createdAt: string;
  source: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "root" | "semantic" | "tag" | "temporal";
  weight: number;
};

type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

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
  title: string;
  subtitle: string;
  totalNodes: number;
  clusterTag: string;
  active: boolean;
  dimmed: boolean;
  kind: "root";
};

type FlowNodeData = MemoryNodeData | RootNodeData;

const EDGE_COLORS: Record<GraphEdge["type"], string> = {
  root: "#a16207",
  semantic: "#d97706",
  tag: "#0f766e",
  temporal: "#1d4ed8",
};

const EDGE_LABELS: Record<GraphEdge["type"], string> = {
  root: "cluster",
  semantic: "semantic",
  tag: "shared tag",
  temporal: "timeline",
};

function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function RootNode({ data }: NodeProps<Node<RootNodeData>>) {
  return (
    <div
      className={`w-80 rounded-xl border px-4 py-4 shadow-[0_10px_30px_rgba(9,9,11,0.08)] transition-all ${
        data.active
          ? "border-[#d97706] bg-[#fff7ed]"
          : "border-zinc-300 bg-white"
      } ${data.dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-[#d97706]" />
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d97706]">Root Node</p>
      <h2 className="mt-1 text-[18px] font-black tracking-tight text-zinc-900">{data.title}</h2>
      <p className="mt-1 text-[12px] text-zinc-600">{data.subtitle}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5">
          <p className="text-zinc-400">Cluster</p>
          <p className="font-bold text-zinc-800">{data.clusterTag}</p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5">
          <p className="text-zinc-400">Members</p>
          <p className="font-bold text-zinc-800">{data.totalNodes}</p>
        </div>
      </div>
    </div>
  );
}

function MemoryCardNode({ data }: NodeProps<Node<MemoryNodeData>>) {
  return (
    <div
      className={`w-72 rounded-xl border px-3.5 py-3 shadow-[0_8px_20px_rgba(9,9,11,0.08)] transition-all ${
        data.active
          ? "border-[#d97706] bg-white shadow-[0_12px_30px_rgba(217,119,6,0.22)]"
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
          <span className="rounded bg-[#d97706] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">
            {Math.round(data.importance * 100)}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[14px] font-black leading-tight text-zinc-900">
          {data.summary || "Untitled memory"}
        </p>
        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d97706]" />
      </div>

      <p className="mb-3 line-clamp-3 text-[12px] leading-relaxed text-zinc-600">{data.content}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {data.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-[#fdba74]/60 bg-[#fff7ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a3412]"
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
  root: RootNode,
  memory: MemoryCardNode,
};

export default function MemoryGraphPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadGraph = useCallback(async (showFullscreenLoader = false) => {
    if (showFullscreenLoader) {
      setLoading(true);
    } else {
      setReloading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams({ limit: "50", edgeLimitPerNode: "3" });
      const response = await api(`/memory/graph?${params.toString()}`);
      if (!response.ok) {
        setError("Failed to load memory graph.");
        return;
      }

      const data = (await response.json()) as GraphPayload;
      setPayload(data);
    } finally {
      if (showFullscreenLoader) {
        setLoading(false);
      } else {
        setReloading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadGraph(true);
  }, [loadGraph]);

  const memoryNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "memory"),
    [payload.nodes]
  );

  const rootNodes = useMemo(
    () => payload.nodes.filter((node) => node.kind === "root"),
    [payload.nodes]
  );

  const rootEdges = useMemo(
    () => payload.edges.filter((edge) => edge.type === "root"),
    [payload.edges]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const node of memoryNodes) {
      for (const tag of node.tags) tagSet.add(tag);
    }
    return ["all", ...[...tagSet].sort((a, b) => a.localeCompare(b))];
  }, [memoryNodes]);

  const visibleMemoryIds = useMemo(() => {
    if (selectedTag === "all") return new Set(memoryNodes.map((n) => n.id));
    return new Set(memoryNodes.filter((n) => n.tags.includes(selectedTag)).map((n) => n.id));
  }, [memoryNodes, selectedTag]);

  const visibleRootIds = useMemo(() => {
    if (selectedTag === "all") return new Set(rootNodes.map((node) => node.id));

    const related = new Set<string>();
    for (const edge of rootEdges) {
      if (visibleMemoryIds.has(edge.target)) {
        related.add(edge.source);
      }
    }
    return related;
  }, [selectedTag, rootNodes, rootEdges, visibleMemoryIds]);

  const clusterMembers = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const edge of rootEdges) {
      const list = map.get(edge.source) ?? [];
      if (!list.includes(edge.target)) {
        list.push(edge.target);
      }
      map.set(edge.source, list);
    }
    return map;
  }, [rootEdges]);

  const rootFlowNodes = useMemo(() => {
    const roots = rootNodes.filter((root) => visibleRootIds.has(root.id));
    return roots.map<Node<RootNodeData>>((node, index) => ({
      id: node.id,
      type: "root",
      position: { x: index * 420, y: 10 },
      draggable: false,
      selectable: true,
      data: {
        title: node.summary,
        subtitle: node.content ?? "Cluster root",
        totalNodes: (clusterMembers.get(node.id) ?? []).filter((id) => visibleMemoryIds.has(id)).length,
        clusterTag: node.tags[0] ?? "general",
        active: false,
        dimmed: false,
        kind: "root",
      },
    }));
  }, [rootNodes, visibleRootIds, clusterMembers, visibleMemoryIds]);

  const memoryFlowNodes = useMemo(() => {
    const memoryById = new Map(memoryNodes.map((node) => [node.id, node]));
    const rows: Node<MemoryNodeData>[] = [];

    let xFallback = 0;
    for (const rootNode of rootFlowNodes) {
      const members = (clusterMembers.get(rootNode.id) ?? [])
        .filter((id) => visibleMemoryIds.has(id))
        .map((id) => memoryById.get(id))
        .filter((node): node is GraphNode => !!node)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const cols = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(Math.max(members.length, 1)))));
      const xGap = 300;
      const yGap = 220;

      members.forEach((member, index) => {
        rows.push({
          id: member.id,
          type: "memory",
          position: {
            x: rootNode.position.x + (index % cols) * xGap,
            y: 220 + Math.floor(index / cols) * yGap,
          },
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

      xFallback = Math.max(xFallback, rootNode.position.x + cols * 300 + 120);
    }

    const placed = new Set(rows.map((node) => node.id));
    const unassigned = memoryNodes.filter(
      (node) => visibleMemoryIds.has(node.id) && !placed.has(node.id)
    );

    unassigned.forEach((member, index) => {
      rows.push({
        id: member.id,
        type: "memory",
        position: {
          x: xFallback + (index % 3) * 300,
          y: 220 + Math.floor(index / 3) * 220,
        },
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

    return rows;
  }, [memoryNodes, rootFlowNodes, clusterMembers, visibleMemoryIds]);

  const baseNodes = useMemo(
    () => [...rootFlowNodes, ...memoryFlowNodes],
    [rootFlowNodes, memoryFlowNodes]
  );

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
        animated: edge.type === "semantic",
        label: EDGE_LABELS[edge.type],
        labelShowBg: true,
        labelBgPadding: [4, 2],
        labelStyle: {
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fill: EDGE_COLORS[edge.type],
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_COLORS[edge.type],
          width: edge.type === "root" ? 12 : 16,
          height: edge.type === "root" ? 12 : 16,
        },
        style: {
          stroke: EDGE_COLORS[edge.type],
          strokeDasharray:
            edge.type === "root" ? "2 6" : edge.type === "temporal" ? "6 4" : undefined,
          strokeWidth: edge.type === "root" ? 1.4 : Math.max(1.2, Math.min(4, edge.weight * 4)),
          opacity: edge.type === "root" ? 0.7 : 0.9,
        },
        data: {
          edgeType: edge.type,
          weight: edge.weight,
        },
      }));
  }, [payload.edges, visibleNodeIds]);

  const baseEdges = useMemo(() => graphEdges, [graphEdges]);

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();

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
      <div className="flex h-full items-center justify-center bg-[#fef8f0]">
        <div className="flex gap-1.5">
          <div className="h-1.5 w-1.5 border border-[#d97706] bg-[#d97706] animate-pulse" />
          <div className="h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fbbf9b] animate-pulse [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 border border-[#fbbf9b]/50 bg-[#fef2e4] animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#fef8f0] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[16px] font-bold tracking-tight text-zinc-900">Memory Graph</h1>
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {flowNodes.length} nodes / {flowEdges.length} edges
        </span>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#d97706]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Semantic</span>
          <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Tag</span>
          <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Temporal</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadGraph(false);
            }}
            disabled={reloading}
            aria-label={reloading ? "Reloading graph" : "Reload graph"}
            title={reloading ? "Reloading graph" : "Reload graph"}
            className="inline-flex h-9 w-9 items-center justify-center border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {reloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#fbbf9b] border-t-[#d97706]" />
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
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden rounded-xl border border-[#d6d3d1] bg-[radial-gradient(circle_at_top,#fff7ed_0,#ffffff_38%,#fff7ed_100%)]">
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
            onNodeClick={(_, node) => setActiveNodeId(node.id)}
            onNodeDoubleClick={(_, node) => {
              if ((node.data as FlowNodeData).kind !== "memory") return;
              router.push(`/memories/${node.id}`);
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
                  ? "#f59e0b"
                  : node.id === activeNodeId
                    ? "#d97706"
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
