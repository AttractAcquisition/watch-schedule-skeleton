// Watch Schedule — shared types
// TODO: align with Supabase generated types once backend is connected.

export type PlanType = "solo_watch" | "dual_watch" | "triple_watch";

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled" | "trialing";

export interface User {
  id: string;
  email: string;
  fullName: string;
  initials: string;
}

export type Department = "command" | "deck" | "interior" | "engineering" | "unassigned";

export type CrewStatus = "active" | "on_leave" | "sick" | "off_vessel" | "training" | "unavailable";

export type WatchMode = "solo" | "dual" | "triple";

export type WatchRole = "watchkeeper" | "oow" | "deck_watch" | "interior_watch" | "engineering_oow";

export interface Vessel {
  id: string;
  name: string;
  lengthMeters: number;
  sizeRange: "30-50" | "50-65" | "60-120";
  operationType: "private" | "charter" | "private_charter";
  captainName: string;
  timezone: string;
  plan: PlanType;
}

export interface CrewMember {
  id: string;
  vesselId: string;
  name: string;
  position: string;
  department: Department;
  watchEligible: boolean;
  eligibleRoles: WatchRole[];
  status: CrewStatus;
  leaveStart?: string;
  leaveEnd?: string;
  notes?: string;
  lastScheduled?: string;
}

export interface WatchTemplate {
  id: string;
  vesselId: string;
  mode: WatchMode;
  blocks: { label: string; start: string; end: string }[];
  weekdayRules: string[];
  weekendRules: string[];
}

export interface ScheduleAssignment {
  id: string;
  scheduleRunId: string;
  date: string; // ISO date
  blockLabel: string;
  role: WatchRole;
  crewMemberId: string;
}

export interface ScheduleRun {
  id: string;
  vesselId: string;
  createdAt: string;
  weekStart: string;
  weekEnd: string;
  mode: WatchMode;
  version: number;
  assignments: ScheduleAssignment[];
}

export interface CharterPause {
  id: string;
  vesselId: string;
  startDate: string;
  endDate: string;
  scope: "all" | "selected";
  keepEngineering: boolean;
  keepSecurity: boolean;
  active: boolean;
}

export interface LeaveRecord {
  id: string;
  crewMemberId: string;
  status: CrewStatus;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface FairnessScore {
  overall: number; // 0-100
  totalWatchBalance: number;
  weekendFairness: number;
  nightWatchBalance: number;
  consecutiveDayRisk: number;
  departmentBalance: number;
  perCrew: {
    crewMemberId: string;
    score: number;
    watches: number;
    nights: number;
    weekends: number;
  }[];
  warnings: string[];
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}
