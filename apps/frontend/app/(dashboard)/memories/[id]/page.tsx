"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
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

function CornerAccents() {
  return (
    <>
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
    </>
  );
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
      <div className="flex h-full items-center justify-center bg-white">
        <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <span className="text-[13px] font-medium text-zinc-400">Memory not found</span>
      </div>
    );
  }

  const date = new Date(memory.createdAt);

  return (
    <div className="flex h-full flex-col bg-white">
      <main className="flex-1 px-6 py-8 overflow-auto">
        <div className="mx-auto max-w-[720px] space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to vault
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              Delete
            </button>
          </div>

          {/* Header card */}
          <div className="relative border border-zinc-200/80 bg-white p-8">
            <CornerAccents />

            <div className="flex items-center gap-2 mb-4">
              <span className="border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-zinc-900">
                {memory.type}
              </span>
              {memory.source && (
                <span className="text-[11px] font-medium text-zinc-400">
                  via {memory.source}
                </span>
              )}
              <span className="ml-auto text-[11px] font-medium text-zinc-400">
                {date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-[1.75rem] font-bold text-[#111118] tracking-tight leading-[1.15]">
              {memory.title || "Untitled"}
            </h1>

            {memory.sourceUrl && (
              <a
                href={memory.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block truncate text-[13px] font-medium text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
              >
                {memory.sourceUrl}
              </a>
            )}
          </div>

          {/* AI Summary */}
          {memory.summary && (
            <div className="relative border border-zinc-200/80 bg-white p-8">
              <CornerAccents />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-3">
                AI Summary
              </h3>
              <p className="text-[14px] text-zinc-700 leading-relaxed font-medium">
                {memory.summary}
              </p>
            </div>
          )}

          {/* Content */}
          {memory.content && (
            <div className="relative border border-zinc-200/80 bg-white p-8">
              <CornerAccents />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-3">
                Content
              </h3>
              <pre className="whitespace-pre-wrap text-[13px] text-zinc-600 leading-relaxed font-sans">
                {memory.content.slice(0, 5000)}
              </pre>
            </div>
          )}

          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className="relative border border-zinc-200/80 bg-white p-8">
              <CornerAccents />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-4">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`border px-2.5 py-1 text-[11px] font-bold ${
                      tag.isAi
                        ? "border-zinc-200 bg-white text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {tag.name}
                    {tag.isAi && <span className="ml-1 opacity-60">AI</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected Memories */}
          {memory.related.length > 0 && (
            <div className="relative border border-zinc-200/80 bg-white p-8">
              <CornerAccents />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-4">
                Connected memories
              </h3>
              <div className="divide-y divide-dashed divide-[#fbbf9b]/25">
                {memory.related.map((r) => (
                  <Link
                    key={r.node.id}
                    href={`/memories/${r.node.id}`}
                    className="group flex items-center gap-4 py-3 px-1 transition-all hover:bg-white/50 hover:px-2"
                  >
                    <span className="shrink-0 border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-900">
                      {r.node.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-bold text-zinc-900 group-hover:text-[#111118]">
                        {r.node.title || "Untitled"}
                      </p>
                      {r.node.summary && (
                        <p className="truncate text-[12px] text-zinc-500 mt-0.5">
                          {r.node.summary}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-900">
                      {(r.weight * 100).toFixed(0)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
