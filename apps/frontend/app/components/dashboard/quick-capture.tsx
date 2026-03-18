"use client";

import { useState } from "react";

export function QuickCapture({
  onCapture,
}: {
  onCapture: (content: string, type: "text" | "url") => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    const isUrl = /^https?:\/\//i.test(content.trim());
    onCapture(content.trim(), isUrl ? "url" : "text");
    setContent("");
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture a thought, paste a link, save an idea... (press n)"
          disabled={loading}
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
