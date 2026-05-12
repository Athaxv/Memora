"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeStep } from "@/app/components/onboarding/welcome-step";
import { SaveFirstLinkStep } from "@/app/components/onboarding/save-first-link-step";
import { UploadResumeStep } from "@/app/components/onboarding/upload-resume-step";
import { AddSocialLinksStep } from "@/app/components/onboarding/add-social-links-step";
import { DoneStep } from "@/app/components/onboarding/done-step";
import { useAuthMe } from "@/lib/queries/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const { isPending, isError, isSuccess } = useAuthMe();

  useEffect(() => {
    if (isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex gap-1.5">
          <div className="h-1.5 w-1.5 border border-[#d97706] bg-[#d97706] animate-pulse" />
          <div className="h-1.5 w-1.5 border border-[#fbbf9b] bg-[#fbbf9b] animate-pulse [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 border border-[#fbbf9b]/40 bg-[#fef2e4] animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-[13px] font-medium text-zinc-500">
        Redirecting to sign in…
      </p>
    );
  }

  if (!isSuccess) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-1.5 border transition-colors ${
              s === step
                ? "border-[#d97706] bg-[#d97706]"
                : s < step
                  ? "border-[#fbbf9b] bg-[#fbbf9b]"
                  : "border-[#fbbf9b]/40 bg-[#fef2e4]"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
      {step === 2 && <SaveFirstLinkStep onNext={() => setStep(3)} />}
      {step === 3 && <UploadResumeStep onNext={() => setStep(4)} />}
      {step === 4 && <AddSocialLinksStep onNext={() => setStep(5)} />}
      {step === 5 && <DoneStep />}
    </div>
  );
}
