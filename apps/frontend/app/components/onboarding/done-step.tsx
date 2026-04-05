"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function DoneStep() {
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    window.location.href = "/vault";
  }

  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12 text-center">
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

      <div className="relative mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center border border-[#fbbf9b]/60 bg-[#fef2e4]">
        <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
        <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
        <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
        <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        You&apos;re all set
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-zinc-500 font-medium">
        Your vault is ready. Start saving links and let AI organize them for you.
      </p>

      <button
        onClick={handleFinish}
        disabled={loading}
        className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors disabled:opacity-50"
      >
        <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
        <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
        <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
        <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
        <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
        <span className="relative z-10 text-white">
          {loading ? "Setting up..." : "Go to your vault"}
        </span>
      </button>
    </div>
  );
}
