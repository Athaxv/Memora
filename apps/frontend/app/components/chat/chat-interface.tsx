"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowUp } from "lucide-react";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  memories?: {
    id: string;
    title: string | null;
    summary: string | null;
    type: string;
  }[];
}

interface PersistedMessage {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  metadata?: {
    memoryRefs?: Array<{
      id: string;
      title?: string | null;
      summary?: string | null;
      type?: string;
    }>;
    memoryIds?: string[];
  };
}

function normalizeMemoriesFromMetadata(msg: PersistedMessage): ChatMessage["memories"] {
  if (Array.isArray(msg.metadata?.memoryRefs) && msg.metadata.memoryRefs.length > 0) {
    return msg.metadata.memoryRefs
      .filter((m) => typeof m?.id === "string" && m.id.length > 0)
      .map((m) => ({
        id: m.id,
        title: m.title ?? null,
        summary: m.summary ?? null,
        type: m.type ?? "note",
      }));
  }

  if (Array.isArray(msg.metadata?.memoryIds) && msg.metadata.memoryIds.length > 0) {
    return msg.metadata.memoryIds
      .filter((id) => typeof id === "string" && id.length > 0)
      .map((id) => ({
        id,
        title: null,
        summary: null,
        type: "note",
      }));
  }

  return undefined;
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
          .filter((msg: PersistedMessage) => msg.role === "user" || msg.role === "assistant")
          .map((msg: PersistedMessage) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: msg.createdAt,
            memories: normalizeMemoriesFromMetadata(msg),
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
      { id: createMessageId(), role: "user", content: userMessage, createdAt: new Date().toISOString() },
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
            createdAt: new Date().toISOString(),
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
    <div className="relative flex h-full flex-col bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 md:pt-8 pb-28 md:pb-32">
        <div className="mx-auto max-w-[720px] space-y-5">
          {messages.length === 0 && (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center border border-zinc-200 bg-white">
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="stroke-zinc-900"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-[1.5rem] italic font-serif leading-[1.02] tracking-[-0.01em] text-[#111118] md:text-[1.95rem] lg:text-[2.35rem]">
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
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative max-w-[80%] border px-4 py-3 text-[14px] ${msg.role === "user"
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-800"
                  }`}
              >
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />

                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {msg.memories && msg.memories.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-dashed border-zinc-200 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">
                      Referenced memories
                    </p>
                    {msg.memories.map((m) => (
                      <a
                        key={m.id}
                        href={`/memories/${m.id}`}
                        className="block border border-zinc-200 bg-white px-3 py-2 text-[12px] hover:border-zinc-200 hover:bg-white/80 transition-colors"
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
              {msg.createdAt && (
                <span className="text-[10px] font-medium text-zinc-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="relative max-w-[80%] text-[14px] text-zinc-800">
                <Reasoning isStreaming={true} defaultOpen={false}>
                  <ReasoningTrigger />
                  <ReasoningContent>Thinking about your memories...</ReasoningContent>
                </Reasoning>
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="absolute bottom-4 md:bottom-6 left-0 right-0 px-4 md:px-6"
      >
        <div className="mx-auto flex w-full max-w-[720px] items-center gap-2 rounded-2xl border border-zinc-200/60 bg-white/70 p-2 shadow-lg shadow-zinc-900/5 backdrop-blur-xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your memories..."
            disabled={loading || sessionLoading}
            className="flex-1 bg-transparent px-3 py-1.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          <button
            type="submit"
            disabled={loading || sessionLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
