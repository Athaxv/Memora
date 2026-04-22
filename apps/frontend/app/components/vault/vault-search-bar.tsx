"use client";

import { useState, useRef, useEffect } from "react";
import { isUrl } from "@/lib/url-utils";

export function VaultSearchBar({
  onSave,
  onSearch,
}: {
  onSave: (url: string) => void;
  onSearch: (query: string) => void;
}) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputIsUrl = isUrl(input);

  // Focus on "/" key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    if (inputIsUrl) {
      setSaving(true);
      onSave(input.trim());
      setInput("");
      setSaving(false);
    } else {
      onSearch(input.trim());
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] pt-16 pb-10">
      {/* Greeting */}
      <h2 className="text-[1.25rem] md:text-[1.5rem] font-bold text-[#111118] tracking-tight mb-1">
        Your vault
      </h2>
      <p className="text-[13px] md:text-[14px] text-zinc-400 font-medium mb-6 md:mb-8">
        Save a link or search your memories
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative group">
          {/* Corner squares */}
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white transition-colors group-focus-within:border-zinc-900" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white transition-colors group-focus-within:border-zinc-900" />
          <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white transition-colors group-focus-within:border-zinc-900" />
          <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white transition-colors group-focus-within:border-zinc-900" />

          <div className="flex items-center border border-zinc-200 bg-white transition-colors group-focus-within:border-zinc-200">
            {/* Search / link icon */}
            <div className="pl-5 text-zinc-400 transition-colors group-focus-within:text-zinc-900">
              {inputIsUrl ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search your vault or paste a URL to save..."
              disabled={saving}
              className="flex-1 bg-transparent px-4 py-4 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none"
            />

            {/* URL mode: show save button */}
            {inputIsUrl && input.trim() ? (
              <button
                type="submit"
                disabled={saving}
                className="mr-3 border border-zinc-900 bg-zinc-900 px-5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              /* Keyboard hint */
              !input && (
                <div className="mr-4 flex items-center">
                  <kbd className="border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">/</kbd>
                </div>
              )
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
