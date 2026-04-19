"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type LinkState =
  | { step: "loading" }
  | { step: "not_linked" }
  | { step: "pending"; phoneNumber: string }
  | { step: "verified"; phoneNumber: string };

export function WhatsAppLink() {
  const [state, setState] = useState<LinkState>({ step: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await api("/whatsapp/status");
    if (res.ok) {
      const data = await res.json();
      if (!data.linked) {
        setState({ step: "not_linked" });
      } else if (data.verified) {
        setState({ step: "verified", phoneNumber: data.phoneNumber });
      } else {
        setState({ step: "pending", phoneNumber: data.phoneNumber });
      }
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleVerify() {
    setError("");
    setSubmitting(true);
    const res = await api("/whatsapp/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      setState({ step: "verified", phoneNumber: data.phoneNumber });
    } else {
      const data = await res.json();
      setError(data.error || "Verification failed");
    }
  }

  async function handleUnlink() {
    setSubmitting(true);
    await api("/whatsapp/link", { method: "DELETE" });
    setSubmitting(false);
    setState({ step: "not_linked" });
    setCode("");
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
      <div className="flex items-center gap-3 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <h3 className="text-[14px] font-bold text-zinc-900">WhatsApp</h3>
        {state.step === "verified" && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#d97706]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d97706] animate-pulse" />
            Connected
          </span>
        )}
      </div>

      <p className="text-[13px] text-zinc-500 mb-5">
        Link your WhatsApp to save memories and query your knowledge graph by texting the bot.
      </p>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Not linked */}
      {state.step === "not_linked" && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.open(
                "https://mail.google.com/mail/?view=cm&fs=1&to=laatharv@gmail.com&su=Request%20for%20WhatsApp%20Integration%20-%20Memory%20OS&body=Hi%20Atharv%2C%0A%0AI%20want%20to%20request%20WhatsApp%20integration%20for%20our%20project.%0A%0AProject%20Name%3A%20Memory%20OS%0AUse%20Case%3A%20%5Bplease%20describe%5D%0AExpected%20Flow%3A%20%5Bplease%20describe%5D%0APriority%3A%20%5BLow%2FMedium%2FHigh%5D%0ATimeline%3A%20%5Bplease%20share%5D%0A%0AThanks%2C",
                "_blank",
                "noopener,noreferrer"
              );
            }}
            disabled={submitting}
            className="bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            Contact us
          </button>
          <span className="text-[12px] text-zinc-500">We will help you set up WhatsApp access.</span>
        </div>
      )}

      {/* Verification pending */}
      {state.step === "pending" && (
        <div>
          <p className="text-[12px] text-zinc-500 mb-3">
            Verification code sent to {state.phoneNumber}. Enter it below or reply to the WhatsApp message.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              maxLength={6}
              className="w-40 border border-zinc-200 bg-[#fef8f0] px-4 py-2.5 text-center text-[15px] font-mono tracking-[0.3em] text-zinc-900 placeholder:text-zinc-400 placeholder:tracking-normal placeholder:font-sans outline-none focus:border-[#fbbf9b] transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={submitting || code.length !== 6}
              className="bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? "Verifying..." : "Verify"}
            </button>
          </div>
          <button
            onClick={() => {
              setState({ step: "not_linked" });
              setCode("");
              setError("");
            }}
            className="mt-3 text-[12px] text-zinc-400 underline underline-offset-4 decoration-[#fbbf9b] hover:text-[#d97706] transition-colors"
          >
            Use a different number
          </button>
        </div>
      )}

      {/* Verified */}
      {state.step === "verified" && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-zinc-600">
            Linked: <span className="font-mono">{state.phoneNumber}</span>
          </span>
          <button
            onClick={handleUnlink}
            disabled={submitting}
            className="text-[12px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      )}
    </div>
  );
}
