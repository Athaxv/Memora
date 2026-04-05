"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Pencil,
  Check,
  X,
  Github,
  Linkedin,
  Twitter,
  Globe,
  FileText,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
}

interface ResumeNode {
  id: string;
  title: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  socialLinks: SocialLinks | null;
  resumeNodeId: string | null;
  resumeNode: ResumeNode | null;
}

interface Stats {
  memoriesCount: number;
  memberSince: string;
}

const socialFields = [
  { key: "github" as const, label: "GitHub", icon: Github },
  { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin },
  { key: "twitter" as const, label: "Twitter / X", icon: Twitter },
  { key: "portfolio" as const, label: "Portfolio", icon: Globe },
];

function CornerAccents() {
  return (
    <>
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-[#fdfdfd]" />
    </>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Social links editing
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft] = useState<SocialLinks>({});

  // Resume upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api("/auth/me").then((r) => r.json()),
      api("/auth/me/stats").then((r) => r.json()),
    ]).then(([userData, statsData]) => {
      setUser(userData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  async function saveName() {
    if (!nameDraft.trim() || !user) return;
    const res = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: nameDraft.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => (prev ? { ...prev, name: updated.name } : prev));
    }
    setEditingName(false);
  }

  async function saveSocialLinks() {
    if (!user) return;
    const cleaned: SocialLinks = {};
    for (const { key } of socialFields) {
      const val = socialDraft[key]?.trim();
      if (val) cleaned[key] = val;
    }
    const res = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ socialLinks: cleaned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => (prev ? { ...prev, socialLinks: updated.socialLinks } : prev));
    }
    setEditingSocial(false);
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await api("/ingest/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ resumeNodeId: data.nodeId }),
      });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              resumeNodeId: data.nodeId,
              resumeNode: { id: data.nodeId, title: file.name.replace(/\.[^.]+$/, "") },
            }
          : prev
      );
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fdfdfd]">
        <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#fdfdfd]">
      <main className="flex-1 px-6 py-8 overflow-auto">
        <div className="mx-auto max-w-[640px] space-y-6">
          <h1 className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-6">
            Profile
          </h1>

          {/* Section 1: Profile Header */}
          <div className="relative border border-zinc-200/80 bg-white p-8">
            <CornerAccents />

            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl || "/char1.png"}
                  alt="Avatar"
                  className="h-20 w-20 border border-zinc-200 bg-zinc-50 object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      className="flex-1 border border-zinc-200 bg-[#fdfdfd] px-3 py-1.5 text-[1.25rem] font-bold text-[#111118] outline-none focus:border-zinc-400"
                    />
                    <button
                      onClick={saveName}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Check size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-1.5 text-zinc-400 hover:bg-zinc-50 transition-colors"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-[1.5rem] font-bold text-[#111118] tracking-tight truncate">
                      {user.name || "Unnamed"}
                    </h2>
                    <button
                      onClick={() => {
                        setNameDraft(user.name || "");
                        setEditingName(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[14px] text-zinc-500 font-medium truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Social Links */}
          <div className="relative border border-zinc-200/80 bg-white p-8">
            <CornerAccents />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Social Links
              </h3>
              {editingSocial ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={saveSocialLinks}
                    className="px-3 py-1 text-[12px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSocial(false)}
                    className="px-3 py-1 text-[12px] font-bold text-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSocialDraft(user.socialLinks || {});
                    setEditingSocial(true);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {socialFields.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={16} strokeWidth={1.5} className="shrink-0 text-zinc-400" />
                  <span className="w-20 shrink-0 text-[12px] font-bold uppercase tracking-widest text-zinc-400">
                    {label}
                  </span>
                  {editingSocial ? (
                    <input
                      type="url"
                      value={socialDraft[key] || ""}
                      onChange={(e) =>
                        setSocialDraft((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="flex-1 border border-zinc-200 bg-[#fdfdfd] px-3 py-1.5 text-[13px] text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400"
                      placeholder={`https://...`}
                    />
                  ) : user.socialLinks?.[key] ? (
                    <a
                      href={user.socialLinks[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-[13px] font-medium text-zinc-700 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500 transition-colors"
                    >
                      {user.socialLinks[key]}
                    </a>
                  ) : (
                    <span className="flex-1 text-[13px] text-zinc-400">Not set</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Resume */}
          <div className="relative border border-zinc-200/80 bg-white p-8">
            <CornerAccents />

            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
              Resume
            </h3>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              onChange={handleResumeUpload}
              className="hidden"
            />

            {user.resumeNode ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
                  <Link
                    href={`/memories/${user.resumeNode.id}`}
                    className="truncate text-[14px] font-medium text-zinc-700 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500 transition-colors"
                  >
                    {user.resumeNode.title || "Resume"}
                  </Link>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Replace"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 border border-dashed border-zinc-300 bg-[#fdfdfd] px-4 py-6 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
              >
                <Upload size={16} strokeWidth={1.5} />
                <span className="text-[13px] font-medium">
                  {uploading ? "Uploading..." : "Upload your resume"}
                </span>
              </button>
            )}
          </div>

          {/* Section 4: Account Stats */}
          {stats && (
            <div className="relative border border-zinc-200/80 bg-white p-8">
              <CornerAccents />

              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-5">
                Account
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[2rem] font-bold text-[#111118] leading-none">
                    {stats.memoriesCount}
                  </p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                    Memories saved
                  </p>
                </div>
                <div>
                  <p className="text-[2rem] font-bold text-[#111118] leading-none">
                    {new Date(stats.memberSince).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                    Member since
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
