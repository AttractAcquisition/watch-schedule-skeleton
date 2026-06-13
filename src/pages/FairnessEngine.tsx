import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { FairnessMetricCard } from "@/components/fairness/FairnessMetricCard";
import { FairnessBreakdown } from "@/components/fairness/FairnessBreakdown";
import { FairnessExplanation } from "@/components/fairness/FairnessExplanation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLatestScheduleRun, useInvalidateVesselData } from "@/hooks/data";
import { confirmScheduleRun } from "@/lib/api";
import { regenerateSchedule } from "@/lib/edgeFunctions";

interface FairnessSummary {
  overall?: number;
  totalWatchBalance?: number;
  weekendFairness?: number;
  nightWatchBalance?: number;
}

export default function FairnessEngine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const latestRun = useLatestScheduleRun();
  const invalidate = useInvalidateVesselData();

  const run = latestRun.data;
  const summary = (run?.fairness_summary ?? {}) as FairnessSummary;
  const warnings = Array.isArray(run?.warnings) ? (run!.warnings as string[]) : [];
  const overall = run?.fairness_score != null ? Math.round(run.fairness_score) : null;

  async function regenerate() {
    if (!run) return toast.error("No schedule yet — generate one first.");
    try {
      await regenerateSchedule({ schedule_run_id: run.id, mode: "affected_only" });
      invalidate();
      toast.success("Affected watches regenerated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regeneration failed.");
    }
  }

  async function confirm() {
    if (!run || !user) return toast.error("No schedule to confirm.");
    try {
      await confirmScheduleRun(run.id, user.id);
      invalidate();
      toast.success("Rota confirmed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Fairness Engine"
        title="Fairness Engine"
        description="Review how the rota balances watch load, weekends, nights, and repeated assignments."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={regenerate}>
              Regenerate affected watches
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/calendar")}>
              View schedule
            </Button>
            <Button size="sm" onClick={confirm}>
              Confirm rota
            </Button>
          </>
        }
      />
      <div className="mb-4 panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Main score
        </div>
        <div className="mt-2 text-4xl font-semibold tracking-tight">
          Overall Fairness Score: {overall != null ? `${overall}%` : "—"}
        </div>
        {!run && (
          <p className="mt-2 text-xs text-muted-foreground">
            No schedule generated yet. Create one in the Watch Builder to see real fairness metrics.
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FairnessMetricCard label="Total watch balance" value={summary.totalWatchBalance ?? 0} />
        <FairnessMetricCard label="Weekend fairness" value={summary.weekendFairness ?? 0} />
        <FairnessMetricCard label="Night watch balance" value={summary.nightWatchBalance ?? 0} />
        <FairnessMetricCard label="Overall" value={overall ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Per-crew breakdown is illustrative until wired to fairness_summary.perCrew. */}
          <FairnessBreakdown />
        </div>
        <div className="space-y-4">
          <FairnessExplanation />
          <div className="panel p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Warnings
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {warnings.length === 0 ? (
                <div>No warnings on the latest schedule.</div>
              ) : (
                warnings.map((w, i) => <div key={i}>{w}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
