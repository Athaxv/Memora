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

interface DateGroup {
  label: string;
  memories: MemoryNode[];
}

function groupByDate(memories: MemoryNode[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, MemoryNode[]> = {};
  const order: string[] = [];

  for (const memory of memories) {
    const date = new Date(memory.createdAt);
    let label: string;

    if (date >= today) {
      label = "Today";
    } else if (date >= yesterday) {
      label = "Yesterday";
    } else if (date >= weekAgo) {
      label = "This Week";
    } else if (date >= monthAgo) {
      label = "This Month";
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label]!.push(memory);
  }

  return order.map((label) => ({ label, memories: groups[label]! }));
}

export function TimelineView({
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

  const groups = groupByDate(memories);

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
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

      {groups.map((group) => (
        <div key={group.label} className="relative mb-8">
          {/* Date label */}
          <div className="relative mb-3 flex items-center pl-4">
            <div className="absolute left-[13px] h-2.5 w-2.5 rounded-full border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900" />
            <span className="ml-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.label}
            </span>
          </div>

          {/* Memory cards for this date group */}
          <div className="space-y-3 pl-10">
            {group.memories.map((memory) => (
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
          </div>
        </div>
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
