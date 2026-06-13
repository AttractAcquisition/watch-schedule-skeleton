import { useMemo } from "react";
import { useCrew, useLatestScheduleRun, useAssignments } from "@/hooks/data";
import { adaptDailyAssignments } from "@/lib/dailySchedule";
import { calculateFairnessEngine } from "@/lib/fairnessEngine";
import type { CrewMemberRow } from "@/lib/database.types";

const EMPTY_CREW: CrewMemberRow[] = [];

export function FairnessBreakdown() {
  const { data: crew, isLoading: crewLoading } = useCrew();
  const latestRun = useLatestScheduleRun();
  const { data: rawAssignments, isLoading: assignmentsLoading } = useAssignments(
    latestRun.data?.id,
  );

  const dailyAssignments = useMemo(
    () => adaptDailyAssignments(rawAssignments ?? [], crew ?? EMPTY_CREW),
    [rawAssignments, crew],
  );

  const engine = useMemo(
    () => calculateFairnessEngine(crew ?? EMPTY_CREW, dailyAssignments),
    [crew, dailyAssignments],
  );

  const crewById = useMemo(() => new Map((crew ?? []).map((c) => [c.id, c])), [crew]);

  const isLoading = latestRun.isLoading || crewLoading || assignmentsLoading;

  if (isLoading) {
    return <div className="panel p-8 text-sm text-muted-foreground">Loading fairness data…</div>;
  }

  if (!engine.crewScores.length) {
    return (
      <div className="panel p-8 text-sm text-muted-foreground">
        {!crew?.length
          ? "No crew found. Add active crew in Settings."
          : "No schedule generated yet. Generate from Settings to see per-crew fairness."}
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Crew</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Total duties</th>
            <th className="px-4 py-3 font-medium">Friday duties</th>
            <th className="px-4 py-3 font-medium">Weekend duties</th>
            <th className="px-4 py-3 font-medium">Consecutive risk</th>
            <th className="px-4 py-3 font-medium">Fairness score</th>
          </tr>
        </thead>
        <tbody>
          {engine.crewScores.map((row) => {
            const member = crewById.get(row.crewMemberId);
            return (
              <tr key={row.crewMemberId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{row.crewName}</td>
                <td className="px-4 py-2 capitalize text-muted-foreground">
                  {member?.department ?? "—"}
                </td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.totalDuties}</td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.fridayDuties}</td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.weekendDuties}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {row.consecutiveDutyRisk === 0 ? "Low" : "Review"}
                </td>
                <td className="px-4 py-2 font-mono">{row.score}% balanced</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
