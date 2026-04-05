"use client";

import { useEffect, useRef } from "react";
import { VaultItemRow } from "./vault-item-row";

interface MemoryNode {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export function RecentItems({
  memories,
  nextCursor,
  onLoadMore,
  loading,
  label = "Recent",
}: {
  memories: MemoryNode[];
  nextCursor: string | null;
  onLoadMore: () => void;
  loading: boolean;
  label?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loading, onLoadMore]);

  return (
    <div className="mx-auto w-full max-w-[640px] pb-16">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d97706]">
          {label}
        </p>
        <p className="text-[11px] font-medium text-zinc-400">
          {memories.length} item{memories.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border-t border-dashed border-[#fbbf9b]/30">
        {memories.map((m) => (
          <VaultItemRow
            key={m.id}
            id={m.id}
            title={m.title}
            summary={m.summary}
            type={m.type}
            sourceUrl={m.sourceUrl ?? m.source}
            createdAt={m.createdAt}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 gap-2">
          <div className="h-1 w-1 bg-[#d97706] animate-pulse" />
          <div className="h-1 w-1 bg-[#fbbf9b] animate-pulse [animation-delay:150ms]" />
          <div className="h-1 w-1 bg-[#fef2e4] animate-pulse [animation-delay:300ms]" />
        </div>
      )}

      {nextCursor && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
