"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";

export function UploadResumeStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function readErrorMessage(res: Response): Promise<string> {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data && typeof data.error === "string") {
        return data.error;
      }
    }

    const text = await res.text().catch(() => "");
    return text || "Failed to upload resume";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api("/ingest/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError(await readErrorMessage(res));
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Save resume reference to profile
      const profileRes = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ resumeNodeId: data.nodeId }),
      });

      if (!profileRes.ok) {
        setError(await readErrorMessage(profileRes));
        return;
      }

      setFileName(file.name);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12">
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

      <h1 className="text-[1.5rem] md:text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        Upload your resume
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-zinc-500 font-medium">
        We&apos;ll extract and index it so you can search it later.
      </p>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50/50 px-4 py-2.5 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      {!fileName ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.docx"
            onChange={handleFile}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors disabled:opacity-50"
          >
            <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="relative z-10 text-white">
              {loading ? "Uploading..." : "Choose file"}
            </span>
          </button>

          <p className="mt-3 text-center text-[12px] text-zinc-400 font-medium">
            PDF, DOCX, TXT, Markdown, or CSV — up to 10MB
          </p>
        </>
      ) : (
        <div className="space-y-6">
          {/* Success card */}
          <div className="relative border border-zinc-200 bg-[#fdfdfd] p-5">
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white" />

            <p className="text-[12px] font-bold uppercase tracking-widest text-[#d97706] mb-2">
              Uploaded
            </p>
            <p className="text-[15px] font-bold text-[#111118]">{fileName}</p>
          </div>

          <button
            onClick={onNext}
            className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors"
          >
            <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
            <span className="relative z-10 text-white">Continue</span>
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-[13px] font-medium text-zinc-400">
        <button
          onClick={onNext}
          className="underline underline-offset-4 decoration-[#fbbf9b]/50 hover:decoration-[#d97706] hover:text-[#d97706] transition-colors"
        >
          Skip for now
        </button>
      </p>
    </div>
  );
}
