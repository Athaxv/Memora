"use client";

const NODE_TYPES = [
  { value: "", label: "All types" },
  { value: "note", label: "Notes" },
  { value: "link", label: "Links" },
  { value: "document", label: "Documents" },
  { value: "message", label: "Messages" },
  { value: "idea", label: "Ideas" },
  { value: "media", label: "Media" },
];

export function Sidebar({
  selectedType,
  onTypeChange,
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
}) {
  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Filter by type
      </h3>
      <ul className="space-y-1">
        {NODE_TYPES.map((t) => (
          <li key={t.value}>
            <button
              onClick={() => onTypeChange(t.value)}
              className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                selectedType === t.value
                  ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
