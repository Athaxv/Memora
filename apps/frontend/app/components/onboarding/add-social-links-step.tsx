"use client";

import { useState } from "react";
import { Github, Linkedin, Twitter, Globe } from "lucide-react";
import { api } from "@/lib/api";

const fields = [
  { key: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
  { key: "twitter", label: "Twitter / X", icon: Twitter, placeholder: "https://x.com/username" },
  { key: "portfolio", label: "Portfolio", icon: Globe, placeholder: "https://yoursite.com" },
] as const;

export function AddSocialLinksStep({ onNext }: { onNext: () => void }) {
  const [values, setValues] = useState({
    github: "",
    linkedin: "",
    twitter: "",
    portfolio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Filter out empty strings
    const socialLinks: Record<string, string> = {};
    for (const [key, val] of Object.entries(values)) {
      if (val.trim()) socialLinks[key] = val.trim();
    }

    try {
      const res = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        }),
      });

      if (!res.ok) {
        setError("Failed to save links");
        setLoading(false);
        return;
      }

      onNext();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const hasAnyValue = Object.values(values).some((v) => v.trim());

  return (
    <div className="relative border border-zinc-200/80 bg-white p-10 md:p-12">
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fef2e4]" />

      <h1 className="text-[1.75rem] font-bold leading-[1.1] text-[#111118] tracking-tight">
        Add your links
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-zinc-500 font-medium">
        Connect your coding profiles. All fields are optional.
      </p>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50/50 px-4 py-2.5 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <label
              htmlFor={key}
              className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500"
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </label>
            <input
              id={key}
              type="url"
              value={values[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full border border-zinc-200 bg-[#fdfdfd] px-4 py-2.5 text-[14px] text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-[#fbbf9b]"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full bg-transparent py-3 text-[14px] font-bold text-zinc-900 transition-colors disabled:opacity-50"
        >
          <span className="absolute inset-0 border border-zinc-900 bg-zinc-900 transition-colors group-hover:bg-zinc-800" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-900 bg-[#fdfdfd]" />
          <span className="relative z-10 text-white">
            {loading ? "Saving..." : hasAnyValue ? "Save & continue" : "Continue"}
          </span>
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] font-medium text-zinc-400">
        <button
          type="button"
          onClick={onNext}
          className="underline underline-offset-4 decoration-[#fbbf9b]/50 hover:decoration-[#d97706] hover:text-[#d97706] transition-colors"
        >
          Skip for now
        </button>
      </p>
    </div>
  );
}
