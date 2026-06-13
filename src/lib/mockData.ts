// DEVELOPMENT ONLY legacy mock dataset.
// Do not import this module from authenticated production routes. Dashboard,
// Settings, onboarding, and Edge Functions use Supabase-backed data.

import type {
  CharterPause,
  CrewMember,
  FairnessScore,
  LeaveRecord,
  ScheduleRun,
  Vessel,
} from "./types";

export const MOCK_VESSEL: Vessel = {
  id: "vessel_meridian",
  name: "M/Y Meridian",
  lengthMeters: 65,
  sizeRange: "50-65",
  operationType: "private_charter",
  captainName: "James Carter",
  timezone: "Europe/Monaco",
  plan: "triple_watch",
};

export const MOCK_CREW: CrewMember[] = [
  {
    id: "c1",
    vesselId: "vessel_meridian",
    name: "James Carter",
    position: "Captain",
    department: "command",
    watchEligible: true,
    eligibleRoles: ["oow", "watchkeeper"],
    status: "active",
    notes: "Captain/admin user. Final schedule approver.",
    lastScheduled: "2026-06-06",
  },
  {
    id: "c2",
    vesselId: "vessel_meridian",
    name: "Sarah Mills",
    position: "Chief Officer",
    department: "command",
    watchEligible: true,
    eligibleRoles: ["oow", "deck_watch"],
    status: "active",
    notes: "Primary OOW for night bridge watches.",
    lastScheduled: "2026-06-09",
  },
  {
    id: "c3",
    vesselId: "vessel_meridian",
    name: "Daniel Reeves",
    position: "Bosun",
    department: "deck",
    watchEligible: true,
    eligibleRoles: ["deck_watch", "watchkeeper"],
    status: "active",
    notes: "Deck lead, prefers early morning coverage.",
    lastScheduled: "2026-06-08",
  },
  {
    id: "c4",
    vesselId: "vessel_meridian",
    name: "Alex Thomas",
    position: "Deckhand",
    department: "deck",
    watchEligible: true,
    eligibleRoles: ["deck_watch", "watchkeeper"],
    status: "active",
    notes: "Assigned before charter pause.",
    lastScheduled: "2026-06-07",
  },
  {
    id: "c5",
    vesselId: "vessel_meridian",
    name: "Ben Harris",
    position: "Deckhand",
    department: "deck",
    watchEligible: true,
    eligibleRoles: ["deck_watch", "watchkeeper"],
    status: "active",
    notes: "Assigned before charter pause.",
    lastScheduled: "2026-06-08",
  },
  {
    id: "c6",
    vesselId: "vessel_meridian",
    name: "Chris Morgan",
    position: "Deckhand",
    department: "deck",
    watchEligible: true,
    eligibleRoles: ["deck_watch", "watchkeeper"],
    status: "active",
    notes: "Next in deck rotation after charter resumes.",
    lastScheduled: "2026-06-05",
  },
  {
    id: "c7",
    vesselId: "vessel_meridian",
    name: "Marco Rossi",
    position: "Chief Engineer",
    department: "engineering",
    watchEligible: true,
    eligibleRoles: ["engineering_oow"],
    status: "active",
    notes: "Appears twice this week due to limited engineering availability.",
    lastScheduled: "2026-06-09",
  },
  {
    id: "c8",
    vesselId: "vessel_meridian",
    name: "Luca Bianchi",
    position: "Second Engineer",
    department: "engineering",
    watchEligible: true,
    eligibleRoles: ["engineering_oow"],
    status: "training",
    leaveStart: "2026-06-10",
    leaveEnd: "2026-06-12",
    notes: "Training course affects engineering OOW coverage.",
    lastScheduled: "2026-06-07",
  },
  {
    id: "c9",
    vesselId: "vessel_meridian",
    name: "Nathan Clarke",
    position: "ETO",
    department: "engineering",
    watchEligible: true,
    eligibleRoles: ["engineering_oow"],
    status: "active",
    notes: "Electrical systems escalation cover.",
    lastScheduled: "2026-06-08",
  },
  {
    id: "c10",
    vesselId: "vessel_meridian",
    name: "Emma Jones",
    position: "Chief Stew",
    department: "interior",
    watchEligible: true,
    eligibleRoles: ["interior_watch"],
    status: "active",
    notes: "Interior lead, approves stewardess swaps.",
    lastScheduled: "2026-06-07",
  },
  {
    id: "c11",
    vesselId: "vessel_meridian",
    name: "Lisa Green",
    position: "Second Stew",
    department: "interior",
    watchEligible: true,
    eligibleRoles: ["interior_watch"],
    status: "on_leave",
    leaveStart: "2026-06-12",
    leaveEnd: "2026-06-13",
    notes: "Two confirmed interior watches affected.",
    lastScheduled: "2026-06-09",
  },
  {
    id: "c12",
    vesselId: "vessel_meridian",
    name: "Sophie White",
    position: "Stewardess",
    department: "interior",
    watchEligible: true,
    eligibleRoles: ["interior_watch"],
    status: "active",
    notes: "Available for late interior watches.",
    lastScheduled: "2026-06-08",
  },
  {
    id: "c13",
    vesselId: "vessel_meridian",
    name: "Mia Brooks",
    position: "Stewardess",
    department: "interior",
    watchEligible: true,
    eligibleRoles: ["interior_watch"],
    status: "active",
    notes: "Available for guest-facing evening coverage.",
    lastScheduled: "2026-06-06",
  },
  {
    id: "c14",
    vesselId: "vessel_meridian",
    name: "Oliver Grant",
    position: "Chef",
    department: "interior",
    watchEligible: false,
    eligibleRoles: [],
    status: "active",
    notes: "Not normally assigned to watch rota.",
    lastScheduled: "—",
  },
];

const today = new Date();
function isoOffset(days: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const MOCK_SCHEDULE: ScheduleRun = {
  id: "run_1",
  vesselId: "vessel_meridian",
  createdAt: new Date().toISOString(),
  weekStart: isoOffset(0),
  weekEnd: isoOffset(6),
  mode: "triple",
  version: 4,
  assignments: (() => {
    const blocks = [
      { label: "00:00–04:00", role: "oow" as const, deckRole: "deck_watch" as const },
      { label: "04:00–08:00", role: "oow" as const, deckRole: "deck_watch" as const },
      { label: "20:00–00:00", role: "oow" as const, deckRole: "deck_watch" as const },
    ];
    const oowCrew = ["c2", "c1", "c2"];
    const deckCrew = ["c4", "c5", "c6", "c3"];
    const intCrew = ["c11", "c12", "c13", "c10"];
    const engCrew = ["c7", "c9", "c7"];
    const out: ScheduleRun["assignments"] = [];
    for (let d = 0; d < 7; d++) {
      blocks.forEach((b, i) => {
        out.push({
          id: `a-${d}-oow-${i}`,
          scheduleRunId: "run_1",
          date: isoOffset(d),
          blockLabel: b.label,
          role: "oow",
          crewMemberId: oowCrew[(d + i) % oowCrew.length],
        });
        out.push({
          id: `a-${d}-deck-${i}`,
          scheduleRunId: "run_1",
          date: isoOffset(d),
          blockLabel: b.label,
          role: "deck_watch",
          crewMemberId: deckCrew[(d + i) % deckCrew.length],
        });
        out.push({
          id: `a-${d}-int-${i}`,
          scheduleRunId: "run_1",
          date: isoOffset(d),
          blockLabel: b.label,
          role: "interior_watch",
          crewMemberId: intCrew[(d + i) % intCrew.length],
        });
        out.push({
          id: `a-${d}-eng-${i}`,
          scheduleRunId: "run_1",
          date: isoOffset(d),
          blockLabel: b.label,
          role: "engineering_oow",
          crewMemberId: engCrew[(d + i) % engCrew.length],
        });
      });
    }
    return out;
  })(),
};

export const MOCK_FAIRNESS: FairnessScore = {
  overall: 92,
  totalWatchBalance: 94,
  weekendFairness: 88,
  nightWatchBalance: 91,
  consecutiveDayRisk: 86,
  departmentBalance: 95,
  perCrew: MOCK_CREW.filter((c) => c.watchEligible).map((c, i) => ({
    crewMemberId: c.id,
    score: 90 + ((i * 7) % 9),
    watches: 5 + (i % 3),
    nights: 1 + (i % 2),
    weekends: 1 + (i % 2),
  })),
  warnings: [
    "Potential repeated night watch for Marco Rossi on " +
      isoOffset(2) +
      " - captain approval required.",
    "Lisa Green is on leave during two confirmed interior watches - regenerate affected watches.",
  ],
};

export const MOCK_CHARTER: CharterPause = {
  id: "charter_1",
  vesselId: "vessel_meridian",
  startDate: isoOffset(4),
  endDate: isoOffset(7),
  scope: "selected",
  keepEngineering: true,
  keepSecurity: true,
  active: true,
};

export const MOCK_LEAVE: LeaveRecord[] = [
  {
    id: "l1",
    crewMemberId: "c11",
    status: "on_leave",
    startDate: "2026-06-12",
    endDate: "2026-06-13",
    notes: "Pre-booked leave.",
  },
  {
    id: "l2",
    crewMemberId: "c8",
    status: "training",
    startDate: isoOffset(1),
    endDate: isoOffset(3),
    notes: "Engineering course.",
  },
];

export const MOCK_EXPORTS = [
  { id: "e1", at: "2026-06-07T14:22:00Z", variant: "Bridge", version: 4 },
  { id: "e2", at: "2026-06-01T09:10:00Z", variant: "Crew mess", version: 3 },
  { id: "e3", at: "2026-05-25T17:45:00Z", variant: "Department", version: 2 },
];
