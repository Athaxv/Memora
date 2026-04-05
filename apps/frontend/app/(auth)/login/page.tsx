"use client";

import { useState } from "react";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Cookies (access + refresh) were set server-side on this response.
      window.location.href = data.user.onboardingCompleted ? "/vault" : "/onboarding";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12">
      {/* Corner squares */}
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

      <h1 className="text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-zinc-500 font-medium">
        Sign in to your Memory OS
      </p>

      <button
        onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
        className="mb-5 flex w-full items-center justify-center gap-2.5 border border-zinc-200 bg-[#fdfdfd] px-4 py-3 text-[14px] font-medium text-zinc-700 transition-colors hover:bg-[#fef8f0]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-zinc-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="border border-red-200 bg-red-50/50 px-4 py-2.5 text-[13px] font-medium text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-zinc-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-zinc-200 bg-[#fdfdfd] px-4 py-2.5 text-[14px] text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-[#fbbf9b]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[12px] font-bold uppercase tracking-widest text-zinc-500">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-zinc-200 bg-[#fdfdfd] px-4 py-2.5 text-[14px] text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-[#fbbf9b]"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors disabled:opacity-50"
        >
          <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="relative z-10 text-white">
            {loading ? "Signing in..." : "Sign in"}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] font-medium text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-900 underline underline-offset-4 decoration-[#fbbf9b] hover:decoration-[#d97706] transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
