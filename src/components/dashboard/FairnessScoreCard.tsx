import { useMemo } from "react";
import { useCrew, useLatestScheduleRun, useAssignments } from "@/hooks/data";
import { adaptDailyAssignments } from "@/lib/dailySchedule";
import { calculateFairnessEngine } from "@/lib/fairnessEngine";
import type { CrewMemberRow } from "@/lib/database.types";

const EMPTY_CREW: CrewMemberRow[] = [];

export function FairnessScoreCard() {
  const { data: crew } = useCrew();
  const latestRun = useLatestScheduleRun();
  const { data: rawAssignments } = useAssignments(latestRun.data?.id);

  const dailyAssignments = useMemo(
    () => adaptDailyAssignments(rawAssignments ?? [], crew ?? EMPTY_CREW),
    [rawAssignments, crew],
  );

  const engine = useMemo(
    () => calculateFairnessEngine(crew ?? EMPTY_CREW, dailyAssignments),
    [crew, dailyAssignments],
  );

  const overall = latestRun.data?.fairness_score ?? engine.scheduleFairnessScore;
  const watchkeepers = engine.crewScores.length;

  const totalConsecutiveRisk = engine.crewScores.reduce((sum, c) => sum + c.consecutiveDutyRisk, 0);

  const metrics: [string, number | string][] = [
    ["Avg crew fairness", engine.averageCrewFairnessScore],
    ["Rotation stability", engine.rotationStabilityScore],
    ["Lowest fairness", engine.lowestFairnessScore],
    ["Consecutive-day risk", totalConsecutiveRisk === 0 ? "Low" : "Review"],
  ];

  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Fairness Score
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-semibold tracking-tight">{overall || "—"}%</div>
        <div className="text-xs text-muted-foreground">
          across {watchkeepers} watchkeeper{watchkeepers !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {metrics.map(([label, val]) => (
          <div key={String(label)} className="flex items-center gap-3 text-xs">
            <div className="w-32 text-muted-foreground">{label}</div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-success"
                style={{ width: typeof val === "number" ? `${val}%` : "28%" }}
              />
            </div>
            <div className="w-8 text-right font-mono text-muted-foreground">{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
