"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { VaultHeader } from "@/app/components/vault/vault-header";
import { VaultSearchBar } from "@/app/components/vault/vault-search-bar";
import { RecentItems } from "@/app/components/vault/recent-items";
import { EmptyState } from "@/app/components/vault/empty-state";

interface MemoryNode {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export default function VaultPage() {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  const fetchMemories = useCallback(async (cursor?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "20");

    const res = await api(`/memories?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (cursor) {
        setMemories((prev) => [...prev, ...data.nodes]);
      } else {
        setMemories(data.nodes);
      }
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  async function handleSave(url: string) {
    setSavingUrl(true);
    await api("/ingest", {
      method: "POST",
      body: JSON.stringify({ type: "url", content: url }),
    });
    setSavingUrl(false);
    setSearchMode(false);
    fetchMemories();
  }

  async function handleSearch(query: string) {
    setLoading(true);
    setSearchMode(true);

    const res = await api("/memories/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const data = await res.json();
      setMemories(data.results.map((r: { node: MemoryNode }) => r.node));
      setNextCursor(null);
    }
    setLoading(false);
  }

  function handleLoadMore() {
    if (nextCursor && !loading) {
      fetchMemories(nextCursor);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      <VaultHeader />

      <main className="flex-1 px-6">
        <VaultSearchBar onSave={handleSave} onSearch={handleSearch} />

        {/* Saving indicator */}
        {savingUrl && (
          <div className="mx-auto mb-6 flex max-w-[640px] items-center gap-3 border border-zinc-200 bg-white px-5 py-3">
            <div className="flex gap-1">
              <div className="h-1 w-1 bg-zinc-900 animate-pulse" />
              <div className="h-1 w-1 bg-zinc-600 animate-pulse [animation-delay:150ms]" />
              <div className="h-1 w-1 bg-zinc-400 animate-pulse [animation-delay:300ms]" />
            </div>
            <span className="text-[13px] font-medium text-zinc-600">
              Saving and processing with AI...
            </span>
          </div>
        )}

        {/* Search mode header */}
        {searchMode && !savingUrl && (
          <div className="mx-auto mb-4 flex max-w-[640px] items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
              Search results
            </span>
            <button
              onClick={() => {
                setSearchMode(false);
                fetchMemories();
              }}
              className="text-[12px] font-bold text-zinc-500 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {!initialLoad && memories.length === 0 && !searchMode && !savingUrl ? (
          <EmptyState />
        ) : (
          !savingUrl && (
            <RecentItems
              memories={memories}
              nextCursor={searchMode ? null : nextCursor}
              onLoadMore={handleLoadMore}
              loading={loading}
              label={searchMode ? `${memories.length} result${memories.length !== 1 ? "s" : ""}` : "Recent"}
            />
          )
        )}
      </main>
    </div>
  );
}
