"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  MessageSquare,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  User,
} from "lucide-react";
import { clearToken } from "@/lib/token";

const STORAGE_KEY = "memory_os_sidebar_collapsed";

const navItems = [
  { label: "Vault", href: "/vault", icon: Archive },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function handleSignOut() {
    clearToken();
    window.location.href = "/login";
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`
        ${collapsed ? "w-[60px]" : "w-56"}
        flex h-screen shrink-0 flex-col border-r border-zinc-200/80 bg-[#fdfdfd]
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
          Memory OS
        </span>
      </div>

      {/* Toggle — directly below logo */}
      <div className={`px-2 pb-3 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`
            flex items-center gap-3 rounded-sm px-3 py-2
            text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50
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

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 pt-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                relative flex items-center gap-3 rounded-sm py-2.5
                transition-all duration-150
                ${
                  active
                    ? "bg-white border border-zinc-200 text-[#111118] font-semibold"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border border-transparent"
                }
                ${collapsed ? "justify-center px-2" : "px-3"}
              `}
            >
              {/* Corner accents on active item */}
              {active && (
                <>
                  <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
                  <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
                  <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
                  <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
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

      {/* Footer */}
      <div className="border-t border-zinc-200/80 px-2 py-3">
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`
            flex items-center gap-3 rounded-sm py-2.5 w-full
            text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50
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
