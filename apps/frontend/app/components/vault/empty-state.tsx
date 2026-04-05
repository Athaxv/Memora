export function EmptyState() {
  return (
    <div className="mx-auto w-full max-w-[640px] py-20 text-center">
      <div className="relative mx-auto mb-8 inline-flex items-center justify-center border border-zinc-200 bg-white p-5">
        <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
        <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
        <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
        <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf9b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      <h2 className="text-[1.15rem] font-bold text-[#111118] tracking-tight mb-2">
        Your vault is empty
      </h2>
      <p className="text-[13px] text-zinc-500 font-medium max-w-[320px] mx-auto mb-6 leading-relaxed">
        Paste a URL in the search bar above to save your first link. We&apos;ll extract, summarize, and tag it automatically.
      </p>

      <div className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400">
        <span>Press</span>
        <kbd className="border border-[#fbbf9b]/50 bg-[#fef2e4] px-1.5 py-0.5 text-[10px] font-bold text-[#d97706]">/</kbd>
        <span>to focus the search bar</span>
      </div>
    </div>
  );
}
