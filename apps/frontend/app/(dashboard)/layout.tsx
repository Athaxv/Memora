"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/dashboard/sidebar";
import { useAuthMe } from "@/lib/queries/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isPending, isError, isSuccess } = useAuthMe();

  useEffect(() => {
    if (isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  useEffect(() => {
    if (isSuccess && data && !data.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [isSuccess, data, router]);

  const ready = Boolean(isSuccess && data?.onboardingCompleted);

  if (isPending || !ready) {
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

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-center text-[13px] font-medium text-zinc-500">
          Redirecting to sign in…
        </p>
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
