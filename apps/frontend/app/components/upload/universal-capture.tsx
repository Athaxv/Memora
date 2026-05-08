"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { isUrl } from "@/lib/url-utils";
import {
  Check,
  FileUp,
  Image,
  Link2,
  Loader2,
  NotebookPen,
  Upload,
  X,
} from "lucide-react";

type CaptureMode = "file" | "link" | "note";

export interface CaptureResult {
  nodeId: string;
  artifactId?: string;
  title: string | null;
  summary: string;
  tags: string[];
  edgeCount: number;
}

export function UniversalCapture({
  createdFrom,
  onCaptured,
  onCancel,
  dense = false,
}: {
  createdFrom: "vault" | "chat";
  onCaptured?: (result: CaptureResult) => void;
  onCancel?: () => void;
  dense?: boolean;
}) {
  const [mode, setMode] = useState<CaptureMode>("file");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CaptureResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const modes: Array<{ id: CaptureMode; label: string; icon: typeof FileUp }> = [
    { id: "file", label: "File", icon: FileUp },
    { id: "link", label: "Link", icon: Link2 },
    { id: "note", label: "Note", icon: NotebookPen },
  ];

  async function readError(res: Response) {
    try {
      const data = await res.json();
      return typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  }

  function resetCapture() {
    setText("");
    setTags("");
    setSelectedFile(null);
    setLastResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    setError(null);
    setLastResult(null);
    setLoading(true);

    try {
      let res: Response;

      if (mode === "file") {
        if (!selectedFile) {
          setError("Choose a file to upload.");
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("createdFrom", createdFrom);
        if (tags.trim()) formData.append("tags", tags);
        formData.append(
          "metadata",
          JSON.stringify({
            originalName: selectedFile.name,
            size: selectedFile.size,
            lastModified: selectedFile.lastModified,
          })
        );

        res = await api("/ingest/upload", {
          method: "POST",
          body: formData,
        });
      } else {
        const content = text.trim();
        if (!content) {
          setError(mode === "link" ? "Paste a link to save." : "Write a note to save.");
          return;
        }

        if (mode === "link" && !isUrl(content)) {
          setError("Enter a valid URL.");
          return;
        }

        res = await api("/ingest", {
          method: "POST",
          body: JSON.stringify({
            type: mode === "link" ? "url" : "text",
            content,
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            createdFrom,
          }),
        });
      }

      if (!res.ok) {
        setError(await readError(res));
        return;
      }

      const result = (await res.json()) as CaptureResult;
      setLastResult(result);
      onCaptured?.(result);
      resetCapture();
      setLastResult(result);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  return (
    <section
      className={`relative border border-zinc-200 bg-white ${
        dense ? "p-3 shadow-lg shadow-zinc-900/5" : "p-4"
      }`}
    >
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900">
            Capture
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            Upload files, links, images, or notes.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            aria-label="Close capture"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1 border border-zinc-200 bg-zinc-50 p-1">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-bold transition-colors ${
                active
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "file" ? (
        <>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-28 w-full flex-col items-center justify-center border border-dashed px-4 py-5 text-center transition-colors ${
              dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center border border-zinc-200 bg-white text-zinc-900">
              {selectedFile?.type.startsWith("image/") ? <Image size={17} /> : <Upload size={17} />}
            </div>
            <span className="max-w-full truncate text-[13px] font-bold text-zinc-900">
              {selectedFile?.name ?? "Choose or drop a file"}
            </span>
            <span className="mt-1 text-[11px] font-medium text-zinc-400">
              PDF, DOCX, images, text, markdown, or CSV.
            </span>
          </button>
        </>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === "link" ? "Paste a URL or tweet link..." : "Write or paste a note..."}
          rows={dense ? 3 : 4}
          className="w-full resize-none border border-zinc-200 bg-white px-3 py-3 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900"
        />
      )}

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Optional tags, comma separated"
        className="mt-3 w-full border border-zinc-200 bg-white px-3 py-2.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900"
      />

      {error && <p className="mt-3 text-[12px] font-bold text-red-600">{error}</p>}
      {lastResult && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
          <Check size={14} />
          Saved {lastResult.title || "memory"}.
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={resetCapture}
          disabled={loading}
          className="px-3 py-2 text-[12px] font-bold text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Processing" : "Save memory"}
        </button>
      </div>
    </section>
  );
}
