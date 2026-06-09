// Watch Schedule — mock dataset for a 65m yacht (M/Y Meridian).
// TODO: replace with database-driven data.

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
  sizeRange: "50-65",
  operationType: "private_charter",
  captainName: "Capt. James Whitcombe",
  timezone: "Europe/Monaco",
  plan: "triple_watch",
};

export const MOCK_CREW: CrewMember[] = [
  { id: "c1", vesselId: "vessel_meridian", name: "James Whitcombe", position: "Captain", department: "command", watchEligible: true, eligibleRoles: ["oow", "watchkeeper"], status: "active" },
  { id: "c2", vesselId: "vessel_meridian", name: "Oliver Hastings", position: "Chief Officer", department: "deck", watchEligible: true, eligibleRoles: ["oow", "deck_watch"], status: "active" },
  { id: "c3", vesselId: "vessel_meridian", name: "Marco Bellini", position: "Second Officer", department: "deck", watchEligible: true, eligibleRoles: ["oow", "deck_watch"], status: "active" },
  { id: "c4", vesselId: "vessel_meridian", name: "Henrik Larsen", position: "Bosun", department: "deck", watchEligible: true, eligibleRoles: ["deck_watch"], status: "active" },
  { id: "c5", vesselId: "vessel_meridian", name: "Tom Reeves", position: "Lead Deckhand", department: "deck", watchEligible: true, eligibleRoles: ["deck_watch"], status: "active" },
  { id: "c6", vesselId: "vessel_meridian", name: "Sam O'Connor", position: "Deckhand", department: "deck", watchEligible: true, eligibleRoles: ["deck_watch"], status: "on_leave", leaveStart: "2026-06-08", leaveEnd: "2026-06-14" },
  { id: "c7", vesselId: "vessel_meridian", name: "Dario Conti", position: "Chief Engineer", department: "engineering", watchEligible: true, eligibleRoles: ["engineering_oow"], status: "active" },
  { id: "c8", vesselId: "vessel_meridian", name: "Anika Patel", position: "Second Engineer", department: "engineering", watchEligible: true, eligibleRoles: ["engineering_oow"], status: "active" },
  { id: "c9", vesselId: "vessel_meridian", name: "Lukas Weiss", position: "Third Engineer", department: "engineering", watchEligible: true, eligibleRoles: ["engineering_oow"], status: "training" },
  { id: "c10", vesselId: "vessel_meridian", name: "Sophie Laurent", position: "Chief Stewardess", department: "interior", watchEligible: true, eligibleRoles: ["interior_watch"], status: "active" },
  { id: "c11", vesselId: "vessel_meridian", name: "Elena Moretti", position: "Second Stewardess", department: "interior", watchEligible: true, eligibleRoles: ["interior_watch"], status: "active" },
  { id: "c12", vesselId: "vessel_meridian", name: "Hana Suzuki", position: "Stewardess", department: "interior", watchEligible: true, eligibleRoles: ["interior_watch"], status: "active" },
  { id: "c13", vesselId: "vessel_meridian", name: "Pierre Dubois", position: "Head Chef", department: "interior", watchEligible: false, eligibleRoles: [], status: "active" },
  { id: "c14", vesselId: "vessel_meridian", name: "Mateus Silva", position: "Deckhand", department: "deck", watchEligible: true, eligibleRoles: ["deck_watch"], status: "sick" },
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
    const oowCrew = ["c2", "c3", "c1"];
    const deckCrew = ["c4", "c5", "c14"];
    const intCrew = ["c10", "c11", "c12"];
    const engCrew = ["c7", "c8", "c9"];
    const out: ScheduleRun["assignments"] = [];
    for (let d = 0; d < 7; d++) {
      blocks.forEach((b, i) => {
        out.push({ id: `a-${d}-oow-${i}`, scheduleRunId: "run_1", date: isoOffset(d), blockLabel: b.label, role: "oow", crewMemberId: oowCrew[(d + i) % oowCrew.length] });
        out.push({ id: `a-${d}-deck-${i}`, scheduleRunId: "run_1", date: isoOffset(d), blockLabel: b.label, role: "deck_watch", crewMemberId: deckCrew[(d + i) % deckCrew.length] });
        out.push({ id: `a-${d}-int-${i}`, scheduleRunId: "run_1", date: isoOffset(d), blockLabel: b.label, role: "interior_watch", crewMemberId: intCrew[(d + i) % intCrew.length] });
        out.push({ id: `a-${d}-eng-${i}`, scheduleRunId: "run_1", date: isoOffset(d), blockLabel: b.label, role: "engineering_oow", crewMemberId: engCrew[(d + i) % engCrew.length] });
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
    "Potential rest-hour conflict for Marco Bellini on " + isoOffset(2) + " — captain approval required.",
    "Sam O'Connor on leave during scheduled deck watch — regenerate to reallocate.",
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
  active: false,
};

export const MOCK_LEAVE: LeaveRecord[] = [
  { id: "l1", crewMemberId: "c6", status: "on_leave", startDate: "2026-06-08", endDate: "2026-06-14", notes: "Pre-booked leave." },
  { id: "l2", crewMemberId: "c14", status: "sick", startDate: isoOffset(0), endDate: isoOffset(2), notes: "Doctor's note submitted." },
  { id: "l3", crewMemberId: "c9", status: "training", startDate: isoOffset(1), endDate: isoOffset(3), notes: "AEC course." },
];

export const MOCK_EXPORTS = [
  { id: "e1", at: "2026-06-07T14:22:00Z", variant: "Bridge", version: 4 },
  { id: "e2", at: "2026-06-01T09:10:00Z", variant: "Crew mess", version: 3 },
  { id: "e3", at: "2026-05-25T17:45:00Z", variant: "Department", version: 2 },
];
