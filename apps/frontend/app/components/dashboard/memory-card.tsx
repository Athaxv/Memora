import Link from "next/link";

interface MemoryCardProps {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  source: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  note: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  link: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  document: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  message: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  idea: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  media: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

export function MemoryCard({
  id,
  title,
  summary,
  type,
  source,
  createdAt,
}: MemoryCardProps) {
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/memories/${id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[type] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          {type}
        </span>
        {source && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            via {source}
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
          {formattedDate}
        </span>
      </div>

      <h3 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {title || "Untitled"}
      </h3>

      {summary && (
        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {summary}
        </p>
      )}
    </Link>
  );
}
