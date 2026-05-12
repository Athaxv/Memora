"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthMe, type AuthMeUser } from "@/lib/queries/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  Pencil,
  Check,
  X,
  Code2,
  Briefcase,
  MessageCircle,
  Globe,
  FileText,
  Upload,
  Shield,
  Download,
  Trash2,
  Lock,
  LogOut,
  Clock3,
} from "lucide-react";
import { api } from "@/lib/api";

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
}

interface Stats {
  memoriesCount: number;
  memberSince: string;
}

interface SessionInfo {
  id: string;
  familyId: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

interface ResumeDetail {
  id: string;
  type: string;
  source: string | null;
  asset?: {
    status: "available" | "unavailable";
    url?: string;
    mimeType?: string;
    size?: number;
    name?: string;
  };
}

const socialFields = [
  { key: "github" as const, label: "GitHub", icon: Code2 },
  { key: "linkedin" as const, label: "LinkedIn", icon: Briefcase },
  { key: "twitter" as const, label: "Twitter / X", icon: MessageCircle },
  { key: "portfolio" as const, label: "Portfolio", icon: Globe },
];

function CornerAccents() {
  return (
    <>
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
      <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-200 bg-white" />
    </>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isPending: userLoading } = useAuthMe();
  const { data: stats, isPending: statsPending } = useQuery({
    queryKey: queryKeys.auth.stats,
    queryFn: async () => {
      const r = await api("/auth/me/stats");
      if (!r.ok) throw new Error("Failed to load stats");
      return (await r.json()) as Stats;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
  const { data: sessionsPayload, isPending: sessionsPending } = useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: async () => {
      const r = await api("/auth/me/sessions");
      if (!r.ok) return { sessions: [] as SessionInfo[] };
      return (await r.json()) as { sessions: SessionInfo[] };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
  const sessions = sessionsPayload?.sessions ?? [];
  const loading = userLoading || (!!user && (statsPending || sessionsPending));

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Social links editing
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft] = useState<SocialLinks>({});

  // Resume upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [resumeDetail, setResumeDetail] = useState<ResumeDetail | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [privacyUseProfileContext, setPrivacyUseProfileContext] = useState(true);
  const [privacyAutoSaveAssets, setPrivacyAutoSaveAssets] = useState(true);

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

  useEffect(() => {
    if (user?.avatarUrl !== undefined) {
      setAvatarDraft(user.avatarUrl || "");
    }
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (!user?.resumeNode?.id) {
      setResumeDetail(null);
      return;
    }
    api(`/memories/${user.resumeNode.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setResumeDetail(data))
      .catch(() => setResumeDetail(null));
  }, [user?.resumeNode?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProfileContext = window.localStorage.getItem("profile:privacy:useProfileContext");
    const savedAutoSaveAssets = window.localStorage.getItem("profile:privacy:autoSaveAssets");
    if (savedProfileContext) setPrivacyUseProfileContext(savedProfileContext === "true");
    if (savedAutoSaveAssets) setPrivacyAutoSaveAssets(savedAutoSaveAssets === "true");
  }, []);

  async function saveName() {
    if (!nameDraft.trim() || !user) return;
    const res = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: nameDraft.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      queryClient.setQueryData<AuthMeUser>(queryKeys.auth.me, (prev) =>
        prev ? { ...prev, name: updated.name } : prev
      );
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
      queryClient.setQueryData<AuthMeUser>(queryKeys.auth.me, (prev) =>
        prev ? { ...prev, socialLinks: updated.socialLinks } : prev
      );
    }
    setEditingSocial(false);
  }

  async function saveAvatar() {
    if (!avatarDraft.trim()) return;
    const res = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ avatarUrl: avatarDraft.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      queryClient.setQueryData<AuthMeUser>(queryKeys.auth.me, (prev) =>
        prev ? { ...prev, avatarUrl: updated.avatarUrl } : prev
      );
      setEditingAvatar(false);
    }
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
      const profileRes = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ resumeNodeId: data.nodeId }),
      });

      if (!profileRes.ok) {
        const message = await readErrorMessage(profileRes);
        alert(message);
      }

      queryClient.setQueryData<AuthMeUser>(queryKeys.auth.me, (prev) =>
        prev
          ? {
              ...prev,
              resumeNodeId: data.nodeId,
              resumeNode: { id: data.nodeId, title: file.name.replace(/\.[^.]+$/, "") },
            }
          : prev
      );
    } else {
      const message = await readErrorMessage(res);
      alert(message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword) return;
    setChangingPassword(true);
    const res = await api("/auth/me/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setChangingPassword(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      alert("Password updated");
      return;
    }
    const message = await readErrorMessage(res);
    alert(message);
  }

  async function handleLogoutAll() {
    const res = await api("/auth/me/logout-all", { method: "POST" });
    if (res.ok) window.location.href = "/login";
  }

  async function handleExportData() {
    const res = await api("/auth/me/export");
    if (!res.ok) {
      const message = await readErrorMessage(res);
      alert(message);
      return;
    }
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memora-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    const res = await api("/auth/me", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/signup";
      return;
    }
    const message = await readErrorMessage(res);
    alert(message);
  }

  function persistPrivacy(
    key: "profile:privacy:useProfileContext" | "profile:privacy:autoSaveAssets",
    value: boolean
  ) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, String(value));
  }

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
          <div className="h-1.5 w-1.5 border border-zinc-200 bg-zinc-400 animate-pulse [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 border border-zinc-200 bg-white animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <main className="flex-1 px-4 md:px-6 py-6 md:py-8 overflow-auto">
        <div className="mx-auto max-w-[640px] space-y-6">
          <h1 className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-6">
            Profile
          </h1>

          {/* Section 1: Profile Header */}
          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />

            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl || "/char1.png"}
                  alt="Avatar"
                  className="h-20 w-20 border border-zinc-200 bg-zinc-50 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarDraft(user.avatarUrl || "");
                    setEditingAvatar((prev) => !prev);
                  }}
                  className="absolute -bottom-2 -right-2 rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold text-zinc-700 hover:border-zinc-900"
                >
                  Avatar
                </button>
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
                      className="flex-1 border border-zinc-200 bg-white px-3 py-1.5 text-[1.25rem] font-bold text-[#111118] outline-none focus:border-zinc-200"
                    />
                    <button
                      onClick={saveName}
                      className="p-1.5 text-zinc-900 hover:bg-white transition-colors"
                    >
                      <Check size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-1.5 text-zinc-400 hover:bg-white transition-colors"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-[1.25rem] md:text-[1.5rem] font-bold text-[#111118] tracking-tight truncate">
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
            {editingAvatar && (
              <div className="mt-5 flex items-center gap-2">
                <input
                  value={avatarDraft}
                  onChange={(e) => setAvatarDraft(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 outline-none"
                />
                <button
                  onClick={saveAvatar}
                  className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-50"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Social Links */}
          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900">
                Social Links
              </h3>
              {editingSocial ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={saveSocialLinks}
                    className="px-3 py-1 text-[12px] font-bold text-zinc-900 hover:bg-white transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSocial(false)}
                    className="px-3 py-1 text-[12px] font-bold text-zinc-400 hover:bg-white transition-colors"
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
                      className="flex-1 border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-200"
                      placeholder={`https://...`}
                    />
                  ) : user.socialLinks?.[key] ? (
                    <a
                      href={user.socialLinks[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-[13px] font-medium text-zinc-700 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
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
          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />

            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-5">
              Resume
            </h3>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,.docx"
              onChange={handleResumeUpload}
              className="hidden"
            />

            {user.resumeNode ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
                  <Link
                    href={`/memories/${user.resumeNode.id}`}
                    className="truncate text-[14px] font-medium text-zinc-700 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
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
                className="flex w-full items-center justify-center gap-2 border border-dashed border-zinc-200 bg-white px-4 py-6 text-zinc-900 hover:border-zinc-300 hover:text-zinc-600 transition-colors disabled:opacity-50"
              >
                <Upload size={16} strokeWidth={1.5} />
                <span className="text-[13px] font-medium">
                  {uploading ? "Uploading..." : "Upload your resume"}
                </span>
              </button>
            )}

            {resumeDetail && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-zinc-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</p>
                  <p className="mt-1 text-[12px] font-bold text-zinc-900">
                    {resumeDetail.asset?.mimeType || resumeDetail.type}
                  </p>
                </div>
                <div className="border border-zinc-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Size</p>
                  <p className="mt-1 text-[12px] font-bold text-zinc-900">
                    {resumeDetail.asset?.size
                      ? `${Math.round(resumeDetail.asset.size / 1024)} KB`
                      : "Unknown"}
                  </p>
                </div>
                <div className="border border-zinc-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Source
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-zinc-900">
                    {resumeDetail.source || "upload"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Account Stats */}
          {stats && (
            <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
              <CornerAccents />

              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-5">
                Account
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[1.5rem] md:text-[2rem] font-bold text-[#111118] leading-none">
                    {stats.memoriesCount}
                  </p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                    Memories saved
                  </p>
                </div>
                <div>
                  <p className="text-[1.5rem] md:text-[2rem] font-bold text-[#111118] leading-none">
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

          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />
            <div className="mb-5 flex items-center gap-2">
              <Shield size={16} className="text-zinc-700" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900">
                Privacy & Memory
              </h3>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-zinc-700">Use profile context in AI responses</span>
                <input
                  type="checkbox"
                  checked={privacyUseProfileContext}
                  onChange={(e) => {
                    setPrivacyUseProfileContext(e.target.checked);
                    persistPrivacy("profile:privacy:useProfileContext", e.target.checked);
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-zinc-700">Auto-save uploaded assets in memory graph</span>
                <input
                  type="checkbox"
                  checked={privacyAutoSaveAssets}
                  onChange={(e) => {
                    setPrivacyAutoSaveAssets(e.target.checked);
                    persistPrivacy("profile:privacy:autoSaveAssets", e.target.checked);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />
            <div className="mb-5 flex items-center gap-2">
              <Lock size={16} className="text-zinc-700" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900">
                Security
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="border border-zinc-900 bg-zinc-900 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-60"
              >
                {changingPassword ? "Updating..." : "Change password"}
              </button>
              <button
                onClick={handleLogoutAll}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
              >
                <LogOut size={14} />
                Logout all sessions
              </button>
            </div>
            {sessions.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Active sessions
                </p>
                {sessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="flex items-center justify-between border border-zinc-200 px-3 py-2">
                    <span className="truncate text-[12px] text-zinc-700">
                      {session.userAgent || "Unknown device"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock3 size={12} />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative border border-zinc-200/80 bg-white p-5 md:p-8">
            <CornerAccents />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-5">
              Account Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-700 hover:border-zinc-900"
              >
                <Download size={14} />
                Export data
              </button>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-100"
              >
                <Trash2 size={14} />
                Delete account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
