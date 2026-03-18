"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function Header({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <Link
        href="/"
        className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
      >
        Memory OS
      </Link>

      <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search memories... (press "/" to focus)'
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
      </form>

      <nav className="flex items-center gap-3">
        <Link
          href="/chat"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          Chat
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
