// WatchSchedule daily scheduling engine.
//
// The current product model is one watchkeeper per full day. Legacy timestamp
// columns are still populated for schema compatibility, but the dashboard and
// fairness logic use assignment_date and duty_weight.

export type WatchMode = "solo" | "dual" | "triple";

export interface Crew {
  id: string;
  full_name: string;
  department: string;
  watch_eligible: boolean;
  eligible_roles: string[];
  status: string;
  crew_lifecycle_status?: string | null;
}

export interface Availability {
  crew_member_id: string;
  status: string | null;
  start_date: string;
  end_date: string;
}

export interface CharterPause {
  start_date: string;
  end_date: string;
  pause_all_watches: boolean;
  status: string;
}

export interface WatchBlock {
  label: string;
  start: string;
  end: string;
  roles: string[];
}

export interface DutyWeights {
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

export interface Assignment {
  crew_member_id: string;
  department: string | null;
  watch_role: string;
  watch_start: string;
  watch_end: string;
  assignment_date: string;
  duty_type: string;
  duty_weight: number;
  assignment_reason: string;
}

export interface CrewFairnessResult {
  crew_member_id: string;
  crew_fairness_score: number;
  fairness_debt: number;
  historical_fairness_score: number;
  total_duties: number;
  friday_duties: number;
  weekend_duties: number;
  public_holiday_duties: number;
  christmas_new_year_duties: number;
  consecutive_duty_risk: number;
  leave_impact: number;
  most_due_rank: Record<string, unknown>;
}

export interface ScheduleHealthResult {
  coverage_gaps: number;
  resource_shortages: number;
  excessive_overrides: number;
  consecutive_duty_risk: number;
  rotation_stability_score: number;
  schedule_health_score: number;
}

export interface ScheduleResult {
  assignments: Assignment[];
  fairness_score: number;
  fairness_summary: Record<string, unknown>;
  crew_fairness_scores: CrewFairnessResult[];
  schedule_health: ScheduleHealthResult;
  explanations: Array<{
    crew_member_id: string | null;
    assignment_date?: string;
    explanation_type: string;
    explanation_text: string;
    input_snapshot: Record<string, unknown>;
  }>;
  warnings: string[];
}

const DEFAULT_WEIGHTS: DutyWeights = {
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

export function defaultBlocks(_mode: WatchMode): WatchBlock[] {
  return [{ label: "Daily watch", start: "00:00", end: "00:00", roles: ["daily_watch"] }];
}

function eachDate(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const d = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function prevDate(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function withinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function isAvailable(crew: Crew, date: string, availability: Availability[]): boolean {
  if (crew.status !== "active") return false;
  if (crew.crew_lifecycle_status === "archived" || crew.crew_lifecycle_status === "leaver") {
    return false;
  }
  const blocking = availability.find(
    (a) =>
      a.crew_member_id === crew.id &&
      a.status &&
      a.status !== "available" &&
      withinRange(date, a.start_date, a.end_date),
  );
  return !blocking;
}

function charterBlocksDate(date: string, pauses: CharterPause[]): boolean {
  return pauses.some(
    (p) =>
      (p.status === "active" || p.status === "draft") &&
      p.pause_all_watches &&
      withinRange(date, p.start_date, p.end_date),
  );
}

function getDutyType(date: string): keyof DutyWeights {
  const [, month, day] = date.split("-").map(Number);
  if (month === 12 && day === 24) return "christmas_eve";
  if (month === 12 && day === 25) return "christmas_day";
  if (month === 12 && day === 26) return "boxing_day";
  if (month === 12 && day === 31) return "new_years_eve";
  if (month === 1 && day === 1) return "new_years_day";
  const weekday = new Date(date + "T00:00:00Z").getUTCDay();
  if (weekday === 1) return "monday";
  if (weekday === 5) return "friday";
  if (weekday === 6) return "saturday";
  if (weekday === 0) return "sunday";
  return "standard_weekday";
}

function isWeekendDuty(type: keyof DutyWeights): boolean {
  return type === "saturday" || type === "sunday";
}

function isChristmasNewYearDuty(type: keyof DutyWeights): boolean {
  return [
    "christmas_eve",
    "christmas_day",
    "boxing_day",
    "new_years_eve",
    "new_years_day",
  ].includes(type);
}

function balanceScore(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 100;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.max(0, Math.round(100 - (Math.sqrt(variance) / mean) * 100));
}

export function generate(opts: {
  mode: WatchMode;
  startDate: string;
  endDate: string;
  crew: Crew[];
  availability: Availability[];
  charterPauses: CharterPause[];
  dutyWeights?: Partial<DutyWeights>;
  historicalFairness?: Array<{ crew_member_id: string; fairness_debt: number }>;
}): ScheduleResult {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.dutyWeights ?? {}) };
  const dates = eachDate(opts.startDate, opts.endDate);
  const warnings: string[] = [];
  const historicalDebt = new Map(
    (opts.historicalFairness ?? []).map((row) => [row.crew_member_id, row.fairness_debt ?? 0]),
  );
  const eligibleCrew = opts.crew.filter((crew) => crew.watch_eligible);
  const weightedLoads = new Map(
    eligibleCrew.map((crew) => [crew.id, historicalDebt.get(crew.id) ?? 0]),
  );
  const totals = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const fridayDuties = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const weekendDuties = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const holidayDuties = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const christmasDuties = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const consecutiveRisk = new Map(eligibleCrew.map((crew) => [crew.id, 0]));
  const lastDay = new Map<string, string>();
  const assignments: Assignment[] = [];
  const explanations: ScheduleResult["explanations"] = [];
  let coverageGaps = 0;
  let resourceShortages = 0;

  for (const date of dates) {
    if (charterBlocksDate(date, opts.charterPauses)) {
      warnings.push(`Normal rota paused for charter on ${date}.`);
      continue;
    }

    const candidates = eligibleCrew.filter((crew) => isAvailable(crew, date, opts.availability));
    if (!candidates.length) {
      coverageGaps += 1;
      resourceShortages += 1;
      warnings.push(`No eligible crew available for daily watch on ${date}.`);
      continue;
    }

    candidates.sort((a, b) => {
      const aConsecutive = lastDay.get(a.id) === prevDate(date) ? 1 : 0;
      const bConsecutive = lastDay.get(b.id) === prevDate(date) ? 1 : 0;
      if (aConsecutive !== bConsecutive && candidates.length > 1)
        return aConsecutive - bConsecutive;
      const aLoad = weightedLoads.get(a.id) ?? 0;
      const bLoad = weightedLoads.get(b.id) ?? 0;
      if (aLoad !== bLoad) return aLoad - bLoad;
      return a.full_name.localeCompare(b.full_name);
    });

    const chosen = candidates[0];
    const dutyType = getDutyType(date);
    const dutyWeight = weights[dutyType];
    const consecutive = lastDay.get(chosen.id) === prevDate(date);
    if (consecutive) consecutiveRisk.set(chosen.id, (consecutiveRisk.get(chosen.id) ?? 0) + 1);

    weightedLoads.set(chosen.id, (weightedLoads.get(chosen.id) ?? 0) + dutyWeight);
    totals.set(chosen.id, (totals.get(chosen.id) ?? 0) + 1);
    if (dutyType === "friday") fridayDuties.set(chosen.id, (fridayDuties.get(chosen.id) ?? 0) + 1);
    if (isWeekendDuty(dutyType))
      weekendDuties.set(chosen.id, (weekendDuties.get(chosen.id) ?? 0) + 1);
    if (dutyType === "public_holiday")
      holidayDuties.set(chosen.id, (holidayDuties.get(chosen.id) ?? 0) + 1);
    if (isChristmasNewYearDuty(dutyType)) {
      christmasDuties.set(chosen.id, (christmasDuties.get(chosen.id) ?? 0) + 1);
    }
    lastDay.set(chosen.id, date);

    const endDate = new Date(`${date}T00:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    assignments.push({
      crew_member_id: chosen.id,
      department: chosen.department,
      watch_role: "daily_watch",
      watch_start: new Date(`${date}T00:00:00Z`).toISOString(),
      watch_end: endDate.toISOString(),
      assignment_date: date,
      duty_type: dutyType,
      duty_weight: dutyWeight,
      assignment_reason: consecutive ? "fairness-balanced-consecutive-risk" : "fairness-balanced",
    });
    explanations.push({
      crew_member_id: chosen.id,
      assignment_date: date,
      explanation_type: "assignment",
      explanation_text: `${chosen.full_name} was selected for ${date} based on lowest weighted fairness load and availability.`,
      input_snapshot: { duty_type: dutyType, duty_weight: dutyWeight },
    });
  }

  const activeCrew = eligibleCrew.filter((crew) => crew.status === "active");
  const generatedLoads = activeCrew.map((crew) => weightedLoads.get(crew.id) ?? 0);
  const expectedLoad =
    generatedLoads.reduce((sum, load) => sum + load, 0) / (activeCrew.length || 1);
  const crewScores = activeCrew.map((crew, index) => {
    const load = weightedLoads.get(crew.id) ?? 0;
    const fairnessDebt = Math.max(0, Math.round((load - expectedLoad) * 100) / 100);
    const risk = consecutiveRisk.get(crew.id) ?? 0;
    const score = Math.max(0, Math.min(100, Math.round(100 - fairnessDebt * 8 - risk * 6)));
    return {
      crew_member_id: crew.id,
      crew_fairness_score: score,
      fairness_debt: fairnessDebt,
      historical_fairness_score: score,
      total_duties: totals.get(crew.id) ?? 0,
      friday_duties: fridayDuties.get(crew.id) ?? 0,
      weekend_duties: weekendDuties.get(crew.id) ?? 0,
      public_holiday_duties: holidayDuties.get(crew.id) ?? 0,
      christmas_new_year_duties: christmasDuties.get(crew.id) ?? 0,
      consecutive_duty_risk: risk,
      leave_impact: 0,
      most_due_rank: { overall: index + 1, weighted_load: load },
    };
  });
  crewScores.sort((a, b) => a.fairness_debt - b.fairness_debt);
  crewScores.forEach((score, index) => {
    score.most_due_rank = {
      overall: index + 1,
      weighted_load: weightedLoads.get(score.crew_member_id) ?? 0,
    };
  });

  const averageCrewScore = crewScores.length
    ? Math.round(
        crewScores.reduce((sum, score) => sum + score.crew_fairness_score, 0) / crewScores.length,
      )
    : 0;
  const totalConsecutiveRisk = crewScores.reduce(
    (sum, score) => sum + score.consecutive_duty_risk,
    0,
  );
  const rotationStabilityScore = Math.max(0, Math.round(100 - totalConsecutiveRisk * 8));
  const scheduleFairnessScore = Math.round(
    averageCrewScore * 0.75 + balanceScore(generatedLoads) * 0.25,
  );
  const healthScore = Math.max(
    0,
    Math.min(100, Math.round(scheduleFairnessScore - coverageGaps * 6 - resourceShortages * 4)),
  );

  if (!assignments.length)
    warnings.push("No assignments were generated. Add eligible on-rota crew.");
  if (coverageGaps > 0) {
    explanations.push({
      crew_member_id: null,
      explanation_type: "alert",
      explanation_text: `${coverageGaps} dates could not be covered by eligible crew.`,
      input_snapshot: { coverage_gaps: coverageGaps },
    });
  }
  if (totalConsecutiveRisk > 0) {
    explanations.push({
      crew_member_id: null,
      explanation_type: "alert",
      explanation_text: `${totalConsecutiveRisk} consecutive duty risks were detected.`,
      input_snapshot: { consecutive_duty_risk: totalConsecutiveRisk },
    });
  }

  return {
    assignments,
    fairness_score: scheduleFairnessScore,
    fairness_summary: {
      scheduleFairnessScore,
      averageCrewFairnessScore: averageCrewScore,
      highestFairnessDebt: Math.max(...crewScores.map((score) => score.fairness_debt), 0),
      lowestFairnessScore: crewScores.length
        ? Math.min(...crewScores.map((score) => score.crew_fairness_score))
        : 0,
      rotationStabilityScore,
      generatedAssignments: assignments.length,
      dutyWeights: weights,
    },
    crew_fairness_scores: crewScores,
    schedule_health: {
      coverage_gaps: coverageGaps,
      resource_shortages: resourceShortages,
      excessive_overrides: 0,
      consecutive_duty_risk: totalConsecutiveRisk,
      rotation_stability_score: rotationStabilityScore,
      schedule_health_score: healthScore,
    },
    explanations,
    warnings,
  };
}
