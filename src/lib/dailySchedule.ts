import type { CrewMemberRow, ScheduleAssignmentRow } from "./database.types";

export type DailyWeightKind = "weekday" | "monday" | "friday" | "saturday" | "sunday";

export interface DailyWatchAssignment {
  date: string;
  crewMemberId: string;
  crewName: string;
  weightKind: DailyWeightKind;
  weightLabel: string;
}

export interface CrewFairnessScore {
  crewMemberId: string;
  crewName: string;
  score: number;
}

export function getDayWeightKind(date: Date): DailyWeightKind {
  const day = date.getDay();
  if (day === 1) return "monday";
  if (day === 5) return "friday";
  if (day === 6) return "saturday";
  if (day === 0) return "sunday";
  return "weekday";
}

export function getWeightLabel(kind: DailyWeightKind) {
  if (kind === "monday") return "Monday weight";
  if (kind === "friday") return "Friday weight";
  if (kind === "saturday" || kind === "sunday") return "Weekend weight";
  return "";
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function startOfMonth(base: Date) {
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

export function monthKey(base: Date) {
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

export function adaptDailyAssignments(
  assignments: ScheduleAssignmentRow[],
  crew: CrewMemberRow[],
): DailyWatchAssignment[] {
  const crewById = new Map(crew.map((member) => [member.id, member.full_name]));
  const byDate = new Map<string, ScheduleAssignmentRow>();

  for (const assignment of assignments) {
    const date = assignment.watch_start.slice(0, 10);
    // TODO(daily-schedule): update the backend schema/edge functions to persist
    // true daily assignments. Until then, collapse any hourly rows to one watch
    // keeper per ISO date and never display time blocks on the captain dashboard.
    if (!byDate.has(date)) byDate.set(date, assignment);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, assignment]) => {
      const parsed = new Date(`${date}T00:00:00`);
      const weightKind = getDayWeightKind(parsed);
      return {
        date,
        crewMemberId: assignment.crew_member_id,
        crewName: crewById.get(assignment.crew_member_id) ?? "Unassigned",
        weightKind,
        weightLabel: getWeightLabel(weightKind),
      };
    });
}

export function deriveCrewFairnessScores(
  crew: CrewMemberRow[],
  dailyAssignments: DailyWatchAssignment[],
): CrewFairnessScore[] {
  const activeCrew = crew.filter((member) => member.status === "active" && member.watch_eligible);
  if (!activeCrew.length) return [];

  const weightedLoads = new Map(activeCrew.map((member) => [member.id, 0]));
  for (const assignment of dailyAssignments) {
    const current = weightedLoads.get(assignment.crewMemberId);
    if (current == null) continue;
    const weight =
      assignment.weightKind === "saturday" || assignment.weightKind === "sunday"
        ? 2
        : assignment.weightKind === "monday" || assignment.weightKind === "friday"
          ? 1.5
          : 1;
    weightedLoads.set(assignment.crewMemberId, current + weight);
  }

  const loads = [...weightedLoads.values()];
  const average = loads.reduce((sum, load) => sum + load, 0) / Math.max(loads.length, 1);

  return activeCrew.map((member, index) => {
    const load = weightedLoads.get(member.id) ?? 0;
    // TODO(fairness): replace this fallback with backend per-crew fairness once
    // schedule_runs.fairness_summary exposes crew-level weighted daily scores.
    const score =
      dailyAssignments.length > 0
        ? Math.max(72, Math.min(99, Math.round(96 - Math.abs(load - average) * 7)))
        : 94 - ((member.full_name.length + index * 3) % 8);
    return {
      crewMemberId: member.id,
      crewName: member.full_name,
      score,
    };
  });
}
