"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memories?: {
    id: string;
    title: string | null;
    summary: string | null;
    type: string;
  }[];
}

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("sessionId");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function createMessageId() {
    return crypto.randomUUID();
  }

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    async function loadSession(sessionId: string) {
      setSessionLoading(true);
      try {
        const res = await api(`/chat/sessions/${sessionId}/messages?limit=200`);
        const data = await res.json();

        if (!res.ok) {
          setMessages([]);
          setConversationId(null);
          return;
        }

        const loadedMessages: ChatMessage[] = (data.messages ?? [])
          .filter((msg: { role: string }) => msg.role === "user" || msg.role === "assistant")
          .map((msg: { id: string; role: "user" | "assistant"; content: string }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }));

        setConversationId(sessionId);
        setMessages(loadedMessages);
      } finally {
        setSessionLoading(false);
      }
    }

    if (!activeSessionId) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    void loadSession(activeSessionId);
  }, [activeSessionId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || sessionLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "user", content: userMessage },
    ]);
    setLoading(true);

    try {
      const res = await api("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.conversationId) {
          setConversationId(data.conversationId);
          if (data.conversationId !== activeSessionId) {
            router.replace(`/chat?sessionId=${data.conversationId}`);
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: data.message,
            memories: data.memories,
          },
        ]);
      } else {
        const backendError =
          typeof data?.error === "string" && data.error.length > 0
            ? data.error
            : `Request failed (${res.status})`;
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: `Sorry, something went wrong: ${backendError}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: "Failed to connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#fef8f0]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-[720px] space-y-5">
          {messages.length === 0 && (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center border border-[#fbbf9b]/60 bg-white">
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-[1.95rem] italic font-serif leading-[1.02] tracking-[-0.01em] text-[#111118] md:text-[2.35rem]">
                Chat with yourself
              </h3>
              <p className="max-w-sm text-[13px] font-medium text-zinc-500 leading-relaxed">
                Ask questions, search by meaning, or store new memories in this chat.
              </p>
            </div>
          )}

          {sessionLoading && (
            <p className="text-center text-[12px] font-medium text-zinc-500">
              Loading conversation...
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[80%] border px-4 py-3 text-[14px] ${
                  msg.role === "user"
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-[#fbbf9b]/40 bg-white text-zinc-800"
                }`}
              >
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {msg.memories && msg.memories.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-dashed border-[#fbbf9b]/40 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#d97706]">
                      Referenced memories
                    </p>
                    {msg.memories.map((m) => (
                      <a
                        key={m.id}
                        href={`/memories/${m.id}`}
                        className="block border border-[#fbbf9b]/30 bg-[#fef8f0] px-3 py-2 text-[12px] hover:border-[#fbbf9b]/60 hover:bg-[#fef2e4]/80 transition-colors"
                      >
                        <span className="font-bold text-zinc-800">{m.title || "Untitled"}</span>
                        {m.summary && (
                          <span className="ml-1 text-zinc-500">— {m.summary.slice(0, 80)}...</span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 border border-[#fbbf9b]/40 bg-white px-4 py-3">
                <div className="h-1 w-1 animate-pulse bg-[#d97706]" />
                <div className="h-1 w-1 animate-pulse bg-[#fbbf9b] [animation-delay:150ms]" />
                <div className="h-1 w-1 animate-pulse bg-[#fef2e4] [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-[#fbbf9b]/25 bg-[#fef8f0] px-6 py-4">
        <div className="mx-auto flex max-w-[720px] gap-2">
          <div className="group relative flex-1">
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4] transition-colors group-focus-within:border-[#d97706]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4] transition-colors group-focus-within:border-[#d97706]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4] transition-colors group-focus-within:border-[#d97706]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4] transition-colors group-focus-within:border-[#d97706]" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your memories..."
              disabled={loading || sessionLoading}
              className="w-full border border-zinc-200 bg-white px-4 py-2.5 text-[14px] text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-[#fbbf9b]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || sessionLoading || !input.trim()}
            className="group relative bg-transparent px-6 py-2.5 text-[13px] font-bold text-white transition-colors disabled:opacity-40"
          >
            <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
            <span className="relative z-10 tracking-tight">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
