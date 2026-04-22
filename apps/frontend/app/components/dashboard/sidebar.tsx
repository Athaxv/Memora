"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  MessageSquare,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  User,
  Network,
  Trash2,
} from "lucide-react";
import { api, logout } from "@/lib/api";

const STORAGE_KEY = "memory_os_sidebar_collapsed";

const navItems = [
  { label: "Vault", href: "/vault", icon: Archive },
  { label: "Memory Graph", href: "/memory-graph", icon: Network },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("sessionId");
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentChats, setRecentChats] = useState<
    Array<{
      id: string;
      title: string | null;
      preview: string | null;
      updatedAt: string;
    }>
  >([]);
  const [chatCursor, setChatCursor] = useState<string | null>(null);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "true") setCollapsed(true);
        else setCollapsed(false);
      }
    };

    // Initial check
    handleResize();
    setMounted(true);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    void loadRecentChats(true);
  }, []);

  async function loadRecentChats(reset = false) {
    if (chatLoading) return;
    if (!reset && !chatHasMore) return;

    setChatLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "10");
      if (!reset && chatCursor) {
        params.set("cursor", chatCursor);
      }

      const res = await api(`/chat/sessions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) return;

      const incoming = data.sessions ?? [];
      setRecentChats((prev) => {
        if (reset) return incoming;

        const deduped = new Map(prev.map((chat) => [chat.id, chat]));
        for (const chat of incoming) deduped.set(chat.id, chat);
        return Array.from(deduped.values());
      });

      setChatCursor(data.nextCursor ?? null);
      setChatHasMore(Boolean(data.hasMore));
    } finally {
      setChatLoading(false);
    }
  }

  async function handleDeleteChat(chatId: string) {
    if (deletingChatId) return;

    setDeletingChatId(chatId);
    try {
      const res = await api(`/chat/sessions/${chatId}`, { method: "DELETE" });
      if (!res.ok) return;
      setRecentChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } finally {
      setDeletingChatId(null);
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  async function handleSignOut() {
    await logout();
    // Hard navigation flushes any stale React state tied to the old user.
    window.location.href = "/login";
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`
        ${collapsed ? "w-16" : "w-60"}
        flex h-screen shrink-0 flex-col border-r border-zinc-200/50 bg-zinc-50/70 backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${mounted ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 overflow-hidden px-4 py-5">
        <div className={`shrink-0 text-zinc-900 ${collapsed ? "mx-auto" : ""}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
            <path d="M9 21h6" />
          </svg>
        </div>
        <span
          className={`
            text-[15px] font-bold tracking-tight text-zinc-900 whitespace-nowrap
            transition-all duration-300
            ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
          `}
        >
          Memora
        </span>
      </div>

      {/* Toggle — directly below logo */}
      <div className={`px-2 pb-3 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`
            flex items-center gap-3 rounded-md px-3 py-2
            text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50
            transition-all duration-150 w-full
            ${collapsed ? "justify-center px-0" : ""}
          `}
        >
          {collapsed ? (
            <PanelLeft size={18} strokeWidth={1.5} className="shrink-0" />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.5} className="shrink-0" />
          )}
          <span
            className={`
              text-[13px] font-medium whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
            `}
          >
            Collapse
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200/80" />

      {/* Primary action */}
      <div className="px-2 pt-3">
        <Link
          href="/chat"
          className={`
            group relative flex items-center gap-3 rounded-sm px-3 py-2.5
            text-white transition-all duration-150
            hover:bg-zinc-800
            ${collapsed ? "mx-auto h-10 w-10 justify-center gap-0 px-0 py-0" : ""}
          `}
          title={collapsed ? "Start new chat" : undefined}
        >
          <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800 rounded-sm" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
          <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
          <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
          <svg
            className="relative z-10 shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span
            className={`
              relative z-10 text-[13px] font-bold whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
            `}
          >
            Start new chat
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-2 pt-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                relative flex items-center gap-3 rounded-md py-2.5
                transition-all duration-150
                ${
                  active
                    ? "bg-white border border-zinc-200 text-zinc-900 font-semibold shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 border border-transparent"
                }
                ${collapsed ? "mx-auto h-10 w-10 justify-center gap-0 px-0 py-0" : "px-3"}
              `}
            >
              {/* Corner accents on active item */}
              {active && (
                <>
                  <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                  <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                  <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                  <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
                </>
              )}

              <Icon size={18} strokeWidth={1.5} className="shrink-0" />
              <span
                className={`
                  text-[13px] whitespace-nowrap overflow-hidden
                  transition-all duration-300
                  ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="relative flex h-full min-h-0 flex-1 flex-col border-t border-zinc-200/50 px-2 pt-3 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-2 top-0 h-6 bg-gradient-to-b from-zinc-50/0 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-2 bottom-0 h-6 bg-gradient-to-t from-zinc-50/0 to-transparent z-10" />

          <div className="px-3 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Recents
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1 pb-2 scroll-smooth overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(161,161,170,0.5)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-zinc-50 [&::-webkit-scrollbar-thumb]:bg-zinc-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400">
            {recentChats.map((chat) => {
              const isActive = pathname === "/chat" && activeSessionId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 rounded-md border px-2 py-2 transition-colors ${
                    isActive
                      ? "border-zinc-200 bg-white shadow-sm"
                      : "border-transparent hover:border-zinc-200/80 hover:bg-zinc-100/50"
                  }`}
                >
                  <Link href={`/chat?sessionId=${chat.id}`} className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-medium leading-5 text-zinc-900">
                      {chat.title || "Untitled chat"}
                    </p>
                  </Link>

                  <button
                    onClick={() => void handleDeleteChat(chat.id)}
                    disabled={deletingChatId === chat.id}
                    className="shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-800 disabled:opacity-50"
                    title="Delete chat"
                  >
                    <Trash2 size={13} strokeWidth={1.6} />
                  </button>
                </div>
              );
            })}

            {recentChats.length === 0 && !chatLoading && (
              <p className="px-2 text-[12px] text-zinc-400">No recent chats</p>
            )}

            {(chatHasMore || chatLoading) && (
              <button
                onClick={() => void loadRecentChats(false)}
                disabled={chatLoading}
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {chatLoading ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 border-t border-zinc-200/50 px-2 py-3">
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`
            flex items-center gap-3 rounded-md py-2.5 w-full
            text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50
            transition-all duration-150
            ${collapsed ? "justify-center px-2" : "px-3"}
          `}
        >
          <LogOut size={18} strokeWidth={1.5} className="shrink-0" />
          <span
            className={`
              text-[12px] font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
            `}
          >
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}
