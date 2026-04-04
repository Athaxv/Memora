"use client";

import { clearToken } from "@/lib/token";

export function VaultHeader() {
  function handleSignOut() {
    clearToken();
    window.location.href = "/login";
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200/80 bg-white px-8 py-4">
      <div className="flex items-center gap-2 text-zinc-900">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          <path d="M9 21h6" />
        </svg>
        <span className="text-[15px] font-bold tracking-tight">Memory OS</span>
      </div>

      <button
        onClick={handleSignOut}
        className="relative text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
