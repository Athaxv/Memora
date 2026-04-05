import Link from "next/link";
import { relativeTime } from "@/lib/relative-time";
import { extractDomain } from "@/lib/url-utils";

interface VaultItemRowProps {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  sourceUrl: string | null;
  createdAt: string;
}

export function VaultItemRow({ id, title, summary, type, sourceUrl, createdAt }: VaultItemRowProps) {
  const domain = sourceUrl ? extractDomain(sourceUrl) : "";
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;

  return (
    <Link
      href={`/memories/${id}`}
      className="group relative flex items-center gap-4 border-b border-dashed border-[#fbbf9b]/20 px-2 py-4 transition-all hover:bg-[#fef2e4]/50 hover:px-3"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-200 bg-white transition-colors group-hover:border-[#fbbf9b]/60">
        {faviconUrl ? (
          <img src={faviconUrl} alt="" width={16} height={16} className="block" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {type === "note" ? (
              <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>
            ) : type === "document" ? (
              <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><path d="M8 13h8" /><path d="M8 17h8" /></>
            ) : (
              <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>
            )}
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-bold text-zinc-900 group-hover:text-[#111118] transition-colors">
            {title || "Untitled"}
          </p>
          {domain && (
            <span className="hidden sm:inline shrink-0 text-[11px] font-medium text-zinc-400">
              {domain}
            </span>
          )}
        </div>
        {summary && (
          <p className="truncate text-[13px] text-zinc-500 mt-0.5 leading-snug">
            {summary}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#d97706] transition-colors">
        {relativeTime(createdAt)}
      </span>

      {/* Hover arrow */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#fbbf9b] opacity-0 group-hover:opacity-100 transition-opacity">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}
