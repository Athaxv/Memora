"use client";

import { useEffect, useRef, useCallback } from "react";
import { MemoryCard } from "./memory-card";

interface MemoryNode {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  createdAt: string;
}

export function MemoryFeed({
  memories,
  nextCursor,
  onLoadMore,
  loading,
}: {
  memories: MemoryNode[];
  nextCursor: string | null;
  onLoadMore: () => void;
  loading: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && nextCursor && !loading) {
        onLoadMore();
      }
    },
    [nextCursor, loading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (memories.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-4xl">🧠</div>
        <h3 className="mb-2 text-lg font-medium text-zinc-700 dark:text-zinc-300">
          No memories yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start capturing thoughts, links, and ideas above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          id={memory.id}
          title={memory.title}
          summary={memory.summary}
          type={memory.type}
          source={memory.source}
          createdAt={memory.createdAt}
        />
      ))}

      {loading && (
        <div className="py-4 text-center text-sm text-zinc-400">
          Loading...
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
