"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setToken } from "@/lib/token";
import { api } from "@/lib/api";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      window.location.href = "/login?error=no_token";
      return;
    }

    setToken(token);

    api("/auth/me").then((res) => {
      if (!res.ok) {
        window.location.href = "/login?error=invalid_token";
        return;
      }
      res.json().then((user: { onboardingCompleted: boolean }) => {
        window.location.href = user.onboardingCompleted ? "/vault" : "/onboarding";
      });
    });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdfdfd]">
      <div className="text-[13px] font-medium text-zinc-400">Signing you in...</div>
    </div>
  );
}
