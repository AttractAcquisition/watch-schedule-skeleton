import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { WatchModeSelector } from "@/components/schedule/WatchModeSelector";
import { RuleBuilder } from "@/components/schedule/RuleBuilder";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ConfirmScheduleModal } from "@/components/schedule/ConfirmScheduleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WatchMode } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCrew, useVesselId, useWatchTemplates, useInvalidateVesselData } from "@/hooks/data";
import { mapCrew, confirmScheduleRun } from "@/lib/api";
import { generateSchedule, type GenerateScheduleResult } from "@/lib/edgeFunctions";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function WatchBuilder() {
  const { user, vessel } = useAuth();
  const vesselId = useVesselId();
  const crewQuery = useCrew();
  const templates = useWatchTemplates();
  const invalidate = useInvalidateVesselData();

  const [mode, setMode] = useState<WatchMode>((vessel?.watch_mode as WatchMode) ?? "triple");
  const [startDate, setStartDate] = useState(addDays(new Date(), 0));
  const [endDate, setEndDate] = useState(addDays(new Date(), 6));
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState<GenerateScheduleResult | null>(null);

  const eligible = (crewQuery.data ?? []).map(mapCrew).filter((c) => c.watchEligible);
  const allCrew = crewQuery.data ?? [];

  async function handleGenerate() {
    if (!vesselId) {
      toast.error("No vessel — complete onboarding first.");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateSchedule({
        vessel_id: vesselId,
        watch_template_id: templates.data?.[0]?.id,
        start_date: startDate,
        end_date: endDate,
        watch_mode: mode,
      });
      setDraft(result);
      invalidate();
      if (result.warnings.length) {
        toast.warning(`Draft generated with ${result.warnings.length} warning(s).`);
      } else {
        toast.success("Draft schedule generated.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!draft || !user) return;
    setConfirming(true);
    try {
      await confirmScheduleRun(draft.schedule_run_id, user.id);
      invalidate();
      setOpen(false);
      toast.success("Schedule confirmed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Watch Builder"
        title="Watch Builder"
        description="Choose the watch mode, set rota rules, and generate a draft schedule for captain approval."
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Watch mode
          </h2>
          <WatchModeSelector value={mode} onChange={setMode} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Rotation Rules
            </h2>
            <RuleBuilder />
          </div>
          <div>
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Crew eligibility
            </h2>
            <div className="panel p-5 text-sm">
              <div className="text-3xl font-semibold tracking-tight">{eligible.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                eligible across {allCrew.length} crew
              </div>
              <div className="mt-4 space-y-1 text-xs">
                {["command", "deck", "interior", "engineering"].map((d) => (
                  <div key={d} className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{d}</span>
                    <span className="font-mono">
                      {eligible.filter((c) => c.department === d).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Schedule start</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Schedule end</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Draft schedule preview
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={generating} onClick={handleGenerate}>
                {generating ? "Generating…" : "Generate Draft"}
              </Button>
              <Button size="sm" disabled={!draft} onClick={() => setOpen(true)}>
                Submit &amp; Confirm
              </Button>
            </div>
          </div>
          {draft && (
            <div className="panel mb-3 grid gap-3 p-4 text-sm md:grid-cols-3">
              <div>
                <span className="text-muted-foreground">Fairness score:</span>{" "}
                {Math.round(draft.fairness_score)}%
              </div>
              <div>
                <span className="text-muted-foreground">Warnings:</span> {draft.warnings.length}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {draft.schedule_run_id}
              </div>
              {draft.warnings.length > 0 && (
                <ul className="md:col-span-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {draft.warnings.slice(0, 6).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* Illustrative grid; live assignment rendering reads from the
              schedule_assignments persisted by the edge function. */}
          <ScheduleGrid />
        </section>
      </div>

      <ConfirmScheduleModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        confirming={confirming}
      />
    </AppShell>
  );
}
