export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12">
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />

      <h1 className="text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        Welcome to Memory OS
      </h1>
      <p className="mt-2 mb-10 text-[14px] text-zinc-500 font-medium">
        Your safe place for links, ideas, and knowledge. AI-powered from day one.
      </p>

      <div className="space-y-5 mb-10">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 bg-[#fdfdfd]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Save Links</p>
            <p className="text-[13px] text-zinc-500 font-medium">Paste any URL — we extract and summarize it automatically</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 bg-[#fdfdfd]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
              <path d="M9 21h6" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500 mb-1">AI-Powered</p>
            <p className="text-[13px] text-zinc-500 font-medium">Auto-tags, summaries, and semantic search built in</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 bg-[#fdfdfd]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Your Vault</p>
            <p className="text-[13px] text-zinc-500 font-medium">Private, organized, always searchable</p>
          </div>
        </div>
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
        <span className="relative z-10 text-white">Get started</span>
      </button>
    </div>
  );
}
