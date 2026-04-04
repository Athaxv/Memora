"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface IngestResult {
  nodeId: string;
  title: string;
  summary: string;
  tags: string[];
}

export function SaveFirstLinkStep({ onNext }: { onNext: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await api("/ingest", {
        method: "POST",
        body: JSON.stringify({ type: "url", content: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save link");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12">
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />

      <h1 className="text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        Save your first link
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-zinc-500 font-medium">
        Paste any URL below — we&apos;ll extract, summarize, and tag it with AI.
      </p>

      {!result ? (
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="border border-red-200 bg-red-50/50 px-4 py-2.5 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="url" className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-zinc-500">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full border border-zinc-200 bg-[#fdfdfd] px-4 py-2.5 text-[14px] text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-400"
              placeholder="https://example.com/interesting-article"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors disabled:opacity-50"
          >
            <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="relative z-10 text-white">
              {loading ? "Saving..." : "Save link"}
            </span>
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Result card */}
          <div className="relative border border-zinc-200 bg-[#fdfdfd] p-5">
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />

            <p className="text-[12px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Saved</p>
            <p className="text-[15px] font-bold text-[#111118] mb-2">{result.title || "Untitled"}</p>
            {result.summary && (
              <p className="text-[13px] text-zinc-500 font-medium mb-3 leading-relaxed">{result.summary}</p>
            )}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span key={tag} className="border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onNext}
            className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors"
          >
            <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="relative z-10 text-white">Continue</span>
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-[13px] font-medium text-zinc-400">
        <button onClick={onNext} className="underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500 hover:text-zinc-600 transition-colors">
          Skip for now
        </button>
      </p>
    </div>
  );
}
