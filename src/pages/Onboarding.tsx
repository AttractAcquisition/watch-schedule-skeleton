import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { VesselSetupStep } from "@/components/onboarding/VesselSetupStep";
import { CrewImportStep } from "@/components/onboarding/CrewImportStep";
import { DepartmentReviewStep } from "@/components/onboarding/DepartmentReviewStep";
import { WatchModeStep } from "@/components/onboarding/WatchModeStep";
import { RuleBuilder } from "@/components/schedule/RuleBuilder";
import { ReviewSetupStep } from "@/components/onboarding/ReviewSetupStep";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BRAND } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { completeOnboarding, type OnboardingPayload } from "@/lib/api";
import { MOCK_CREW } from "@/lib/mockData";
import type { PlanType, WatchMode } from "@/lib/types";

const STEPS = [
  "Set up your vessel",
  "Import your crew list",
  "Confirm departments and watch eligibility",
  "Choose the watch structure your vessel runs",
  "Set your rotation rules",
  "Review vessel setup",
];

const PLAN_TO_MODE: Record<PlanType, WatchMode> = {
  solo_watch: "solo",
  dual_watch: "dual",
  triple_watch: "triple",
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [vesselName, setVesselName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, subscription, refreshAppState } = useAuth();

  const plan = (subscription?.plan_type ?? "solo_watch") as PlanType;
  const watchMode = PLAN_TO_MODE[plan];

  async function handleComplete() {
    if (!user) return;
    if (!vesselName.trim()) {
      toast.error("Enter a vessel name to finish setup.");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      // The confirmed crew list currently mirrors the imported roster shown in
      // the wizard (MOCK_CREW). These rows are persisted and can then be edited
      // in the Crew Database. TODO: collect edits made in the wizard steps.
      const crew: OnboardingPayload["crew"] = MOCK_CREW.map((c) => ({
        fullName: c.name,
        position: c.position,
        department: c.department,
        watchEligible: c.watchEligible,
        eligibleRoles: c.eligibleRoles,
        status: c.status,
      }));

      await completeOnboarding({
        userId: user.id,
        vessel: {
          name: vesselName.trim(),
          timezone,
          watchMode,
          planType: plan,
        },
        crew,
      });
      await refreshAppState();
      toast.success("Vessel created.");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create vessel.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {BRAND.name} · Vessel Setup
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Premium setup wizard for vessel profile, crew confirmation, watch structure, and rota
          rules. Completing setup writes your vessel, crew and a default watch template to Supabase.
        </p>
        <div className="mt-5">
          <OnboardingStepper steps={STEPS} current={step} />
        </div>

        <div className="mt-8">
          {step === 0 && (
            <div className="space-y-6">
              <div className="panel grid max-w-xl gap-3 p-5">
                <div className="space-y-2">
                  <Label htmlFor="vesselName">Vessel name</Label>
                  <Input
                    id="vesselName"
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                    placeholder="M/Y Meridian"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Europe/Monaco"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Watch mode <span className="font-medium">{watchMode}</span> is set from your plan.
                </p>
              </div>
              <VesselSetupStep />
            </div>
          )}
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
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? "Creating…" : "Create Vessel Dashboard"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
