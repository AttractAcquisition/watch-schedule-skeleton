import type { CrewMemberRow } from "./database.types";
import type { DailyWatchAssignment } from "./dailySchedule";

export type DutyType =
  | "standard_weekday"
  | "monday"
  | "friday"
  | "saturday"
  | "sunday"
  | "public_holiday"
  | "christmas_eve"
  | "christmas_day"
  | "boxing_day"
  | "new_years_eve"
  | "new_years_day";

export interface DutyWeighting {
  standard_weekday: number;
  monday: number;
  friday: number;
  saturday: number;
  sunday: number;
  public_holiday: number;
  christmas_eve: number;
  christmas_day: number;
  boxing_day: number;
  new_years_eve: number;
  new_years_day: number;
}

export interface CrewFairnessMetric {
  crewMemberId: string;
  crewName: string;
  score: number;
  fairnessDebt: number;
  totalDuties: number;
  fridayDuties: number;
  weekendDuties: number;
  publicHolidayDuties: number;
  christmasNewYearDuties: number;
  consecutiveDutyRisk: number;
  weightedLoad: number;
}

export interface FairnessEngineResult {
  crewScores: CrewFairnessMetric[];
  scheduleFairnessScore: number;
  averageCrewFairnessScore: number;
  highestFairnessDebt: number;
  lowestFairnessScore: number;
  rotationStabilityScore: number;
  mostDueToServe: CrewFairnessMetric | null;
}

export const DEFAULT_DUTY_WEIGHTING: DutyWeighting = {
  standard_weekday: 1,
  monday: 1,
  friday: 1.25,
  saturday: 1.5,
  sunday: 1.5,
  public_holiday: 1.5,
  christmas_eve: 2,
  christmas_day: 2.5,
  boxing_day: 2,
  new_years_eve: 2.5,
  new_years_day: 2,
};

function roundScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundDebt(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

export function getDutyType(dateIso: string): DutyType {
  const [, month, day] = dateIso.split("-").map(Number);
  if (month === 12 && day === 24) return "christmas_eve";
  if (month === 12 && day === 25) return "christmas_day";
  if (month === 12 && day === 26) return "boxing_day";
  if (month === 12 && day === 31) return "new_years_eve";
  if (month === 1 && day === 1) return "new_years_day";

  // TODO(public-holidays): replace this placeholder with vessel-country holiday
  // calendars once vessel operating region is stored.
  const weekday = new Date(`${dateIso}T00:00:00`).getDay();
  if (weekday === 1) return "monday";
  if (weekday === 5) return "friday";
  if (weekday === 6) return "saturday";
  if (weekday === 0) return "sunday";
  return "standard_weekday";
}

function hasConsecutiveDuty(
  assignment: DailyWatchAssignment,
  assignmentsByCrew: Map<string, DailyWatchAssignment[]>,
) {
  const crewAssignments = assignmentsByCrew.get(assignment.crewMemberId) ?? [];
  const current = new Date(`${assignment.date}T00:00:00`);
  return crewAssignments.some((candidate) => {
    if (candidate.date === assignment.date) return false;
    const other = new Date(`${candidate.date}T00:00:00`);
    return Math.abs(current.getTime() - other.getTime()) === 86400000;
  });
}

export function calculateFairnessEngine(
  crew: CrewMemberRow[],
  assignments: DailyWatchAssignment[],
  weights: DutyWeighting = DEFAULT_DUTY_WEIGHTING,
): FairnessEngineResult {
  const eligibleCrew = crew.filter((member) => member.status === "active" && member.watch_eligible);

  if (!eligibleCrew.length) {
    return {
      crewScores: [],
      scheduleFairnessScore: 0,
      averageCrewFairnessScore: 0,
      highestFairnessDebt: 0,
      lowestFairnessScore: 0,
      rotationStabilityScore: 0,
      mostDueToServe: null,
    };
  }

  const assignmentsByCrew = new Map<string, DailyWatchAssignment[]>();
  for (const assignment of assignments) {
    const current = assignmentsByCrew.get(assignment.crewMemberId) ?? [];
    current.push(assignment);
    assignmentsByCrew.set(assignment.crewMemberId, current);
  }

  const weightedLoads = new Map(eligibleCrew.map((member) => [member.id, 0]));
  for (const assignment of assignments) {
    if (!weightedLoads.has(assignment.crewMemberId)) continue;
    const dutyType = getDutyType(assignment.date);
    weightedLoads.set(
      assignment.crewMemberId,
      weightedLoads.get(assignment.crewMemberId)! + weights[dutyType],
    );
  }

  const totalWeightedLoad = [...weightedLoads.values()].reduce((sum, load) => sum + load, 0);
  const expectedLoad = totalWeightedLoad / eligibleCrew.length;

  const crewScores = eligibleCrew.map((member, index): CrewFairnessMetric => {
    const crewAssignments = assignmentsByCrew.get(member.id) ?? [];
    const weightedLoad = weightedLoads.get(member.id) ?? 0;
    const fairnessDebt = roundDebt(weightedLoad - expectedLoad);
    const fridayDuties = crewAssignments.filter(
      (assignment) => getDutyType(assignment.date) === "friday",
    ).length;
    const weekendDuties = crewAssignments.filter((assignment) => {
      const dutyType = getDutyType(assignment.date);
      return dutyType === "saturday" || dutyType === "sunday";
    }).length;
    const publicHolidayDuties = crewAssignments.filter(
      (assignment) => getDutyType(assignment.date) === "public_holiday",
    ).length;
    const christmasNewYearDuties = crewAssignments.filter((assignment) =>
      ["christmas_eve", "christmas_day", "boxing_day", "new_years_eve", "new_years_day"].includes(
        getDutyType(assignment.date),
      ),
    ).length;
    const consecutiveDutyRisk = crewAssignments.filter((assignment) =>
      hasConsecutiveDuty(assignment, assignmentsByCrew),
    ).length;

    const score =
      assignments.length > 0
        ? roundScore(100 - fairnessDebt * 10 - consecutiveDutyRisk * 4)
        : 94 - ((member.full_name.length + index * 3) % 8);

    return {
      crewMemberId: member.id,
      crewName: member.full_name,
      score,
      fairnessDebt,
      totalDuties: crewAssignments.length,
      fridayDuties,
      weekendDuties,
      publicHolidayDuties,
      christmasNewYearDuties,
      consecutiveDutyRisk,
      weightedLoad: Math.round(weightedLoad * 100) / 100,
    };
  });

  const averageCrewFairnessScore = roundScore(
    crewScores.reduce((sum, metric) => sum + metric.score, 0) / crewScores.length,
  );
  const highestFairnessDebt = Math.max(...crewScores.map((metric) => metric.fairnessDebt), 0);
  const lowestFairnessScore = Math.min(...crewScores.map((metric) => metric.score));
  const totalConsecutiveRisk = crewScores.reduce(
    (sum, metric) => sum + metric.consecutiveDutyRisk,
    0,
  );
  const rotationStabilityScore = roundScore(100 - totalConsecutiveRisk * 8);
  const scheduleFairnessScore = roundScore(
    averageCrewFairnessScore * 0.75 + rotationStabilityScore * 0.25 - highestFairnessDebt * 2,
  );
  const mostDueToServe =
    [...crewScores].sort((a, b) => {
      if (a.fairnessDebt !== b.fairnessDebt) return a.fairnessDebt - b.fairnessDebt;
      if (a.weightedLoad !== b.weightedLoad) return a.weightedLoad - b.weightedLoad;
      return a.crewName.localeCompare(b.crewName);
    })[0] ?? null;

  return {
    crewScores,
    scheduleFairnessScore,
    averageCrewFairnessScore,
    highestFairnessDebt,
    lowestFairnessScore,
    rotationStabilityScore,
    mostDueToServe,
  };
}
