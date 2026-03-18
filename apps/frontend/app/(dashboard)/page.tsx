"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/app/components/dashboard/header";
import { Sidebar } from "@/app/components/dashboard/sidebar";
import { QuickCapture } from "@/app/components/dashboard/quick-capture";
import { MemoryFeed } from "@/app/components/dashboard/memory-feed";

interface MemoryNode {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  const fetchMemories = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (selectedType) params.set("type", selectedType);
      params.set("limit", "20");

      const res = await fetch(`/api/memories?${params}`);
      const data = await res.json();

      if (cursor) {
        setMemories((prev) => [...prev, ...data.nodes]);
      } else {
        setMemories(data.nodes);
      }
      setNextCursor(data.nextCursor);
      setLoading(false);
    },
    [selectedType]
  );

  useEffect(() => {
    setSearchMode(false);
    fetchMemories();
  }, [fetchMemories]);

  async function handleSearch(query: string) {
    setLoading(true);
    setSearchMode(true);

    const res = await fetch("/api/memories/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setMemories(
      data.results.map((r: { node: MemoryNode }) => r.node)
    );
    setNextCursor(null);
    setLoading(false);
  }

  async function handleCapture(content: string, type: "text" | "url") {
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });

    if (res.ok) {
      // Refresh the feed
      fetchMemories();
    }
  }

  function handleLoadMore() {
    if (nextCursor && !loading) {
      fetchMemories(nextCursor);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={handleSearch} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedType={selectedType}
          onTypeChange={(type) => {
            setSelectedType(type);
            setSearchMode(false);
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <QuickCapture onCapture={handleCapture} />

          {searchMode && (
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Search results ({memories.length})
              </span>
              <button
                onClick={() => {
                  setSearchMode(false);
                  fetchMemories();
                }}
                className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                Clear search
              </button>
            </div>
          )}

          <div className="p-4">
            <MemoryFeed
              memories={memories}
              nextCursor={nextCursor}
              onLoadMore={handleLoadMore}
              loading={loading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
