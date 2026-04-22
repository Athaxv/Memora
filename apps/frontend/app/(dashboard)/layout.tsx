"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Sidebar } from "@/app/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The api() wrapper handles 401 → refresh → retry automatically.
    // If refresh fails it redirects to /login itself.
    api("/auth/me").then((res) => {
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      res.json().then((user: { onboardingCompleted: boolean }) => {
        if (!user.onboardingCompleted) {
          router.replace("/onboarding");
        } else {
          setReady(true);
        }
      });
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
          <div className="h-1.5 w-1.5 border border-zinc-400 bg-zinc-400 animate-pulse [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 border border-zinc-200 bg-zinc-200 animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto bg-white">{children}</main>
    </div>
  );
}
