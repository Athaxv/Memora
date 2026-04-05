"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { WelcomeStep } from "@/app/components/onboarding/welcome-step";
import { SaveFirstLinkStep } from "@/app/components/onboarding/save-first-link-step";
import { UploadResumeStep } from "@/app/components/onboarding/upload-resume-step";
import { AddSocialLinksStep } from "@/app/components/onboarding/add-social-links-step";
import { DoneStep } from "@/app/components/onboarding/done-step";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  useEffect(() => {
    // Verify session via /auth/me — the api() wrapper handles refresh-on-401
    // and redirects to /login itself if refresh fails.
    api("/auth/me").then((res) => {
      if (!res.ok) router.replace("/login");
    });
  }, [router]);

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
