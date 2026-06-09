import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { VesselSetupStep } from "@/components/onboarding/VesselSetupStep";
import { CrewImportStep } from "@/components/onboarding/CrewImportStep";
import { DepartmentReviewStep } from "@/components/onboarding/DepartmentReviewStep";
import { WatchModeStep } from "@/components/onboarding/WatchModeStep";
import { RuleBuilder } from "@/components/schedule/RuleBuilder";
import { ReviewSetupStep } from "@/components/onboarding/ReviewSetupStep";
import { completeOnboarding } from "@/lib/authPlaceholder";
import { useNavigate } from "@tanstack/react-router";
import { BRAND } from "@/lib/constants";

const STEPS = [
  "Vessel Profile",
  "Crew List Import",
  "Department Review",
  "Watch Mode Setup",
  "Rules & Availability",
  "Review & Create Dashboard",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {BRAND.name} · Vessel Setup
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
        <div className="mt-5">
          <OnboardingStepper steps={STEPS} current={step} />
        </div>

        <div className="mt-8">
          {step === 0 && <VesselSetupStep />}
          {step === 1 && <CrewImportStep />}
          {step === 2 && <DepartmentReviewStep />}
          {step === 3 && <WatchModeStep />}
          {step === 4 && <RuleBuilder />}
          {step === 5 && <ReviewSetupStep />}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button
              onClick={async () => {
                await completeOnboarding(); // TODO: persist in Supabase
                navigate({ to: "/dashboard" });
              }}
            >
              Create Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
