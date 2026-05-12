"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { VaultSearchBar } from "@/app/components/vault/vault-search-bar";
import { RecentItems } from "@/app/components/vault/recent-items";
import { EmptyState } from "@/app/components/vault/empty-state";
import { UniversalCapture } from "@/app/components/upload/universal-capture";
import { Upload } from "lucide-react";

interface MemoryNode {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

type MemoriesListPage = {
  nodes: MemoryNode[];
  nextCursor: string | null;
};

export default function VaultPage() {
  const queryClient = useQueryClient();
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.memories.list,
    enabled: !searchMode,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "20");
      const res = await api(`/memories?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load memories");
      }
      return (await res.json()) as MemoriesListPage;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? null,
  });

  const searchResultQuery = useQuery({
    queryKey: queryKeys.memories.search(searchQuery),
    enabled: searchMode && searchQuery.length > 0,
    queryFn: async () => {
      const res = await api("/memories/search", {
        method: "POST",
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const data = await res.json();
      return data.results.map((r: { node: MemoryNode }) => r.node) as MemoryNode[];
    },
  });

  const memories: MemoryNode[] = searchMode
    ? (searchResultQuery.data ?? [])
    : (listQuery.data?.pages.flatMap((p) => p.nodes) ?? []);

  const nextCursor =
    !searchMode && listQuery.hasNextPage
      ? listQuery.data?.pages[listQuery.data.pages.length - 1]?.nextCursor ?? null
      : null;

  const loading = searchMode
    ? searchResultQuery.isFetching
    : listQuery.isFetching;

  const initialLoad = searchMode
    ? searchResultQuery.isPending
    : listQuery.isPending;

  async function handleSave(url: string) {
    setSavingUrl(true);
    await api("/ingest", {
      method: "POST",
      body: JSON.stringify({ type: "url", content: url, createdFrom: "vault" }),
    });
    setSavingUrl(false);
    setSearchMode(false);
    await queryClient.invalidateQueries({ queryKey: ["memories"] });
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setSearchMode(true);
  }

  function handleLoadMore() {
    if (nextCursor && !listQuery.isFetching && listQuery.hasNextPage) {
      void listQuery.fetchNextPage();
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <main className="flex-1 px-4 md:px-6 py-4 md:py-0">
        <VaultSearchBar onSave={handleSave} onSearch={handleSearch} />

        <div className="mx-auto -mt-6 mb-6 flex max-w-[640px] justify-end">
          <button
            type="button"
            onClick={() => setCaptureOpen((open) => !open)}
            className="flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-[12px] font-bold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
          >
            <Upload size={14} />
            Upload
          </button>
        </div>

        {captureOpen && (
          <div className="mx-auto mb-6 w-full max-w-[640px]">
            <UniversalCapture
              createdFrom="vault"
              onCancel={() => setCaptureOpen(false)}
              onCaptured={() => {
                setCaptureOpen(false);
                setSearchMode(false);
                void queryClient.invalidateQueries({ queryKey: ["memories"] });
              }}
            />
          </div>
        )}

        {/* Saving indicator */}
        {savingUrl && (
          <div className="relative mx-auto mb-6 flex max-w-[640px] items-center gap-3 border border-zinc-200 bg-white px-5 py-3">
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
            <div className="flex gap-1">
              <div className="h-1 w-1 bg-zinc-900 animate-pulse" />
              <div className="h-1 w-1 bg-zinc-400 animate-pulse [animation-delay:150ms]" />
              <div className="h-1 w-1 bg-zinc-200 animate-pulse [animation-delay:300ms]" />
            </div>
            <span className="text-[13px] font-medium text-zinc-600">
              Saving and processing with AI...
            </span>
          </div>
        )}

        {/* Search mode header */}
        {searchMode && !savingUrl && (
          <div className="mx-auto mb-4 flex max-w-[640px] items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900">
              Search results
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchMode(false);
                void listQuery.refetch();
              }}
              className="text-[12px] font-bold text-zinc-500 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 hover:text-zinc-900 transition-colors"
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
