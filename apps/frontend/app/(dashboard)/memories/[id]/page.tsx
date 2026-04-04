"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface MemoryDetail {
  id: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; isAi: boolean }[];
  related: {
    node: {
      id: string;
      title: string | null;
      summary: string | null;
      type: string;
      createdAt: string;
    };
    edgeType: string;
    weight: number;
  }[];
}

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await api(`/memories/${params.id}`);
      if (res.ok) {
        setMemory(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Delete this memory?")) return;
    const res = await api(`/memories/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/vault");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Memory not found</span>
      </div>
    );
  }

  const date = new Date(memory.createdAt);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/vault"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          &larr; Back
        </Link>
        <button
          onClick={handleDelete}
          className="ml-auto rounded-lg px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {memory.type}
        </span>
        {memory.source && (
          <span className="text-xs text-zinc-400">via {memory.source}</span>
        )}
        <span className="ml-auto text-xs text-zinc-400">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {memory.title || "Untitled"}
      </h1>

      {memory.sourceUrl && (
        <a
          href={memory.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {memory.sourceUrl}
        </a>
      )}

      {memory.summary && (
        <div className="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            AI Summary
          </h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {memory.summary}
          </p>
        </div>
      )}

      {memory.content && (
        <div className="mb-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Content
          </h3>
          <div className="prose prose-sm max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-300">
            <pre className="whitespace-pre-wrap text-sm">
              {memory.content.slice(0, 5000)}
            </pre>
          </div>
        </div>
      )}

      {memory.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tag.isAi
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {tag.name}
                {tag.isAi && (
                  <span className="ml-1 text-violet-400 dark:text-violet-500">
                    AI
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {memory.related.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Connected Memories
          </h3>
          <div className="space-y-2">
            {memory.related.map((r) => (
              <Link
                key={r.node.id}
                href={`/memories/${r.node.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {r.node.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {r.node.title || "Untitled"}
                  </p>
                  {r.node.summary && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {r.node.summary}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {r.edgeType} ({(r.weight * 100).toFixed(0)}%)
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
