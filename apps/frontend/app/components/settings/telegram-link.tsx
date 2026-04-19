"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type LinkState =
  | { step: "loading" }
  | { step: "not_linked" }
  | { step: "pending"; deepLink: string; expiresAt: string }
  | { step: "verified"; chatId: string; botUrl: string | null };

export function TelegramLink() {
  const [state, setState] = useState<LinkState>({ step: "loading" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await api("/telegram/status");
    if (!res.ok) return;

    const data = await res.json();
    if (!data.linked) {
      setState((prev) =>
        prev.step === "pending" ? prev : { step: "not_linked" }
      );
    } else if (data.verified) {
      setState({ step: "verified", chatId: data.chatId, botUrl: data.botUrl ?? null });
    } else {
      setState({ step: "not_linked" });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (state.step !== "pending") return;

    const pollId = window.setInterval(() => {
      void fetchStatus();
    }, 3000);

    return () => window.clearInterval(pollId);
  }, [fetchStatus, state]);

  async function handleStartLink() {
    setError("");
    setSubmitting(true);
    const res = await api("/telegram/link/start", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setSubmitting(false);

    if (res.ok) {
      const data = (await res.json()) as {
        deepLink: string;
        expiresAt: string;
      };
      setState({ step: "pending", deepLink: data.deepLink, expiresAt: data.expiresAt });
      window.open(data.deepLink, "_blank", "noopener,noreferrer");
      return;
    }

    const data = await res.json();
    setError(data.error || "Failed to start Telegram linking");
  }

  async function handleUnlink() {
    setSubmitting(true);
    await api("/telegram/link", { method: "DELETE" });
    setSubmitting(false);
    setState({ step: "not_linked" });
  }

  if (state.step === "loading") {
    return (
      <div className="border border-zinc-200 bg-white p-6">
        <div className="h-4 w-32 animate-pulse bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 5 10 16l-5-5" />
          <path d="M3 19 21 5" />
        </svg>
        <h3 className="text-[14px] font-bold text-zinc-900">Telegram</h3>
        {state.step === "verified" && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#d97706]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d97706]" />
            Connected
          </span>
        )}
      </div>

      <p className="mb-5 text-[13px] text-zinc-500">
        Connect your Telegram account in one click. We will open your bot and link it after you tap Start.
      </p>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {state.step === "not_linked" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleStartLink}
            disabled={submitting}
            className="bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            {submitting ? "Starting..." : "Connect Telegram"}
          </button>
          <span className="text-[12px] text-zinc-500">You will be redirected to the Telegram bot.</span>
        </div>
      )}

      {state.step === "pending" && (
        <div>
          <p className="mb-3 text-[12px] text-zinc-500">
            We are waiting for confirmation from Telegram. Tap Start in the bot chat to finish linking.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.open(state.deepLink, "_blank", "noopener,noreferrer")}
              disabled={submitting}
              className="bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              Open Bot Again
            </button>
            <button
              onClick={() => fetchStatus()}
              disabled={submitting}
              className="border border-zinc-300 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              Check Status
            </button>
          </div>
          <p className="mt-3 text-[12px] text-zinc-400">
            Link expires at {new Date(state.expiresAt).toLocaleTimeString()}.
          </p>
          <button
            onClick={() => {
              setState({ step: "not_linked" });
              setError("");
            }}
            className="mt-3 text-[12px] text-zinc-400 underline decoration-[#fbbf9b] underline-offset-4 transition-colors hover:text-[#d97706]"
          >
            Cancel and restart linking
          </button>
        </div>
      )}

      {state.step === "verified" && (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[13px] text-zinc-600">
              Linked: <span className="font-mono">{state.chatId}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!state.botUrl) return;
                window.open(state.botUrl, "_blank", "noopener,noreferrer");
              }}
              disabled={submitting || !state.botUrl}
              className="border border-zinc-300 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              Open Telegram
            </button>
            <button
              onClick={handleUnlink}
              disabled={submitting}
              className="text-[12px] font-bold uppercase tracking-widest text-red-500 transition-colors hover:text-red-700 disabled:opacity-40"
            >
              {submitting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
