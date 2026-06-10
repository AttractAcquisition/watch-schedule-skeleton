// Watch Schedule — core scheduling engine (Deno / TS).
// Shared by generate-schedule and regenerate-schedule.
//
// Produces watch assignments honouring hard rules (eligibility, availability,
// charter pauses, no double-booking) and soft fairness rules (balanced totals,
// nights and weekends, avoid consecutive days).

export type WatchMode = "solo" | "dual" | "triple";

export interface Crew {
  id: string;
  full_name: string;
  department: string;
  watch_eligible: boolean;
  eligible_roles: string[];
  status: string;
}

export interface Availability {
  crew_member_id: string;
  status: string | null;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd
}

export interface CharterPause {
  start_date: string;
  end_date: string;
  pause_all_watches: boolean;
  keep_engineering_watch_active: boolean;
  keep_security_watch_active: boolean;
  status: string;
}

export interface WatchBlock {
  label: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  roles: string[];
}

export interface Assignment {
  crew_member_id: string;
  department: string | null;
  watch_role: string;
  watch_start: string; // ISO
  watch_end: string; // ISO
  assignment_reason: string;
}

export interface ScheduleResult {
  assignments: Assignment[];
  fairness_score: number;
  fairness_summary: Record<string, unknown>;
  warnings: string[];
}

const BLOCK_TIMES = [
  { label: "20:00–00:00", start: "20:00", end: "00:00", night: true },
  { label: "00:00–04:00", start: "00:00", end: "04:00", night: true },
  { label: "04:00–08:00", start: "04:00", end: "08:00", night: true },
];

const ROLES_BY_MODE: Record<WatchMode, string[]> = {
  solo: ["watchkeeper"],
  dual: ["watchkeeper", "oow"],
  triple: ["deck_watch", "interior_watch", "engineering_oow"],
};

const ROLE_DEPARTMENTS: Record<string, string[]> = {
  watchkeeper: ["deck", "command", "interior", "engineering"],
  oow: ["command", "deck"],
  deck_watch: ["deck", "command"],
  interior_watch: ["interior"],
  engineering_oow: ["engineering"],
};

export function defaultBlocks(mode: WatchMode): WatchBlock[] {
  const roles = ROLES_BY_MODE[mode];
  return BLOCK_TIMES.map((b) => ({ ...b, roles }));
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

function isWeekend(date: string): boolean {
  const day = new Date(date + "T00:00:00Z").getUTCDay();
  return day === 0 || day === 6;
}

function withinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function isEligible(crew: Crew, role: string): boolean {
  if (!crew.watch_eligible) return false;
  if (crew.eligible_roles?.length) return crew.eligible_roles.includes(role);
  // Fall back to department match when no explicit roles are set.
  return (ROLE_DEPARTMENTS[role] ?? []).includes(crew.department);
}

function isAvailable(crew: Crew, date: string, availability: Availability[]): boolean {
  if (crew.status !== "active") return false;
  const blocking = availability.find(
    (a) =>
      a.crew_member_id === crew.id &&
      a.status &&
      a.status !== "available" &&
      withinRange(date, a.start_date, a.end_date),
  );
  return !blocking;
}

function charterBlocksDate(date: string, pauses: CharterPause[]): CharterPause | null {
  return (
    pauses.find(
      (p) =>
        (p.status === "active" || p.status === "draft") &&
        p.pause_all_watches &&
        withinRange(date, p.start_date, p.end_date),
    ) ?? null
  );
}

export function generate(opts: {
  mode: WatchMode;
  startDate: string;
  endDate: string;
  blocks?: WatchBlock[];
  crew: Crew[];
  availability: Availability[];
  charterPauses: CharterPause[];
}): ScheduleResult {
  const blocks = opts.blocks?.length ? opts.blocks : defaultBlocks(opts.mode);
  const dates = eachDate(opts.startDate, opts.endDate);
  const warnings: string[] = [];

  // Fairness counters.
  const totals = new Map<string, number>();
  const nights = new Map<string, number>();
  const weekends = new Map<string, number>();
  const lastDay = new Map<string, string>();
  opts.crew.forEach((c) => {
    totals.set(c.id, 0);
    nights.set(c.id, 0);
    weekends.set(c.id, 0);
  });

  const assignments: Assignment[] = [];

  for (const date of dates) {
    const pause = charterBlocksDate(date, opts.charterPauses);
    const assignedToday = new Set<string>();

    for (const block of blocks) {
      for (const role of block.roles) {
        // Charter freeze: skip unless an exception keeps this watch active.
        if (pause) {
          const keepEng = pause.keep_engineering_watch_active && role === "engineering_oow";
          const keepSec = pause.keep_security_watch_active && role === "deck_watch";
          if (!keepEng && !keepSec) continue;
        }

        const candidates = opts.crew.filter(
          (c) =>
            isEligible(c, role) &&
            isAvailable(c, date, opts.availability) &&
            !assignedToday.has(c.id),
        );

        if (candidates.length === 0) {
          warnings.push(`No eligible crew available for ${role} on ${date} (${block.label}).`);
          continue;
        }

        // Soft fairness: fewest total watches, then fewest nights, then avoid
        // back-to-back days, then fewest weekends.
        candidates.sort((a, b) => {
          const ta = totals.get(a.id)!;
          const tb = totals.get(b.id)!;
          if (ta !== tb) return ta - tb;
          const na = nights.get(a.id)!;
          const nb = nights.get(b.id)!;
          if (na !== nb) return na - nb;
          const ca = lastDay.get(a.id) === prevDate(date) ? 1 : 0;
          const cb = lastDay.get(b.id) === prevDate(date) ? 1 : 0;
          if (ca !== cb) return ca - cb;
          return weekends.get(a.id)! - weekends.get(b.id)!;
        });

        const chosen = candidates[0];
        assignedToday.add(chosen.id);
        totals.set(chosen.id, totals.get(chosen.id)! + 1);
        if (isBlockNight(block)) nights.set(chosen.id, nights.get(chosen.id)! + 1);
        if (isWeekend(date)) weekends.set(chosen.id, weekends.get(chosen.id)! + 1);
        lastDay.set(chosen.id, date);

        const { startIso, endIso } = blockToIso(date, block);
        assignments.push({
          crew_member_id: chosen.id,
          department: chosen.department,
          watch_role: role,
          watch_start: startIso,
          watch_end: endIso,
          assignment_reason: pause ? "charter-exception" : "auto-fairness",
        });
      }
    }
  }

  const { score, summary } = computeFairness(opts.crew, totals, nights, weekends);
  if (assignments.length === 0) {
    warnings.push("No assignments were generated — check crew eligibility and availability.");
  }

  return { assignments, fairness_score: score, fairness_summary: summary, warnings };
}

function prevDate(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isBlockNight(block: WatchBlock): boolean {
  const h = parseInt(block.start.slice(0, 2), 10);
  return h >= 20 || h < 6;
}

function blockToIso(date: string, block: WatchBlock): { startIso: string; endIso: string } {
  const startIso = new Date(`${date}T${block.start}:00Z`).toISOString();
  // End may roll over midnight (e.g. 20:00–00:00).
  const endHour = parseInt(block.end.slice(0, 2), 10);
  const startHour = parseInt(block.start.slice(0, 2), 10);
  const endDateObj = new Date(`${date}T${block.end === "00:00" ? "00:00" : block.end}:00Z`);
  if (endHour <= startHour) endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
  return { startIso, endIso: endDateObj.toISOString() };
}

function computeFairness(
  crew: Crew[],
  totals: Map<string, number>,
  nights: Map<string, number>,
  weekends: Map<string, number>,
): { score: number; summary: Record<string, unknown> } {
  const eligible = crew.filter((c) => c.watch_eligible);
  const counts = eligible.map((c) => totals.get(c.id) ?? 0);
  const balance = balanceScore(counts);
  const nightBalance = balanceScore(eligible.map((c) => nights.get(c.id) ?? 0));
  const weekendBalance = balanceScore(eligible.map((c) => weekends.get(c.id) ?? 0));
  const overall = Math.round(balance * 0.5 + nightBalance * 0.25 + weekendBalance * 0.25);

  return {
    score: overall,
    summary: {
      overall,
      totalWatchBalance: balance,
      nightWatchBalance: nightBalance,
      weekendFairness: weekendBalance,
      perCrew: eligible.map((c) => ({
        crewMemberId: c.id,
        name: c.full_name,
        watches: totals.get(c.id) ?? 0,
        nights: nights.get(c.id) ?? 0,
        weekends: weekends.get(c.id) ?? 0,
      })),
    },
  };
}

// 100 = perfectly even distribution; lower as spread grows.
function balanceScore(values: number[]): number {
  if (values.length === 0) return 100;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 100;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  return Math.max(0, Math.round(100 - cv * 100));
}
