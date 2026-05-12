"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export type AuthMeUser = {
  id: string;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
  avatarUrl?: string | null;
  socialLinks?: Record<string, string | undefined> | null;
  resumeNodeId?: string | null;
  resumeNode?: { id: string; title: string | null } | null;
};

export function useAuthMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async (): Promise<AuthMeUser> => {
      const res = await api("/auth/me");
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        throw new Error("Invalid response");
      }
      if (!res.ok) {
        const err =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : "Unauthorized";
        throw new Error(err);
      }
      return body as AuthMeUser;
    },
    staleTime: 5 * 60_000,
    retry: false,
    enabled: options?.enabled ?? true,
  });
}
