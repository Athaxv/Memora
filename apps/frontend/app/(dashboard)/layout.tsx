"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/token";
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
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

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
      <div className="flex min-h-screen items-center justify-center bg-[#fdfdfd]">
        <div className="h-1.5 w-1.5 border border-zinc-900 bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
      />
      <div className="flex h-screen" style={{ fontFamily: "'Satoshi', sans-serif" }}>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </>
  );
}
