"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/token";
import { WelcomeStep } from "@/app/components/onboarding/welcome-step";
import { SaveFirstLinkStep } from "@/app/components/onboarding/save-first-link-step";
import { DoneStep } from "@/app/components/onboarding/done-step";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-1.5 border transition-colors ${
              s === step
                ? "border-zinc-900 bg-zinc-900"
                : s < step
                  ? "border-zinc-400 bg-zinc-400"
                  : "border-zinc-300 bg-[#fdfdfd]"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
      {step === 2 && <SaveFirstLinkStep onNext={() => setStep(3)} />}
      {step === 3 && <DoneStep />}
    </div>
  );
}
