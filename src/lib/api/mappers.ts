// Watch Schedule — map snake_case Supabase rows to the camelCase UI types.

import type {
  CrewMemberRow,
  VesselRow,
  ScheduleAssignmentRow,
  CharterPauseRow,
  CrewAvailabilityRow,
} from "../database.types";
import type {
  CrewMember,
  Vessel,
  WatchRole,
  CharterPause,
  LeaveRecord,
  CrewStatus,
  PlanType,
} from "../types";

export function mapVessel(row: VesselRow): Vessel {
  return {
    id: row.id,
    name: row.name,
    lengthMeters: row.length_meters ?? 0,
    sizeRange: (row.length_range as Vessel["sizeRange"]) ?? "50-65",
    operationType: (row.operation_type as Vessel["operationType"]) ?? "private",
    captainName: "",
    timezone: row.timezone,
    plan: (row.plan_type as PlanType) ?? "solo_watch",
  };
}

export function mapCrew(row: CrewMemberRow): CrewMember {
  return {
    id: row.id,
    vesselId: row.vessel_id,
    name: row.full_name,
    position: row.position ?? "",
    department: row.department,
    watchEligible: row.watch_eligible,
    eligibleRoles: (row.eligible_roles ?? []) as WatchRole[],
    status: row.status,
    notes: row.notes ?? undefined,
    lastScheduled: row.last_scheduled_at ?? undefined,
  };
}

export function mapCharter(row: CharterPauseRow): CharterPause {
  return {
    id: row.id,
    vesselId: row.vessel_id,
    startDate: row.start_date,
    endDate: row.end_date,
    scope: row.pause_all_watches ? "all" : "selected",
    keepEngineering: row.keep_engineering_watch_active,
    keepSecurity: row.keep_security_watch_active,
    active: row.status === "active",
  };
}

export function mapLeave(row: CrewAvailabilityRow): LeaveRecord {
  return {
    id: row.id,
    crewMemberId: row.crew_member_id,
    status: (row.status ?? "unavailable") as CrewStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes ?? undefined,
  };
}

export function mapAssignmentDate(row: ScheduleAssignmentRow) {
  return {
    id: row.id,
    scheduleRunId: row.schedule_run_id,
    date: row.watch_start.slice(0, 10),
    blockLabel: `${row.watch_start.slice(11, 16)}–${row.watch_end.slice(11, 16)}`,
    role: (row.watch_role ?? "watchkeeper") as WatchRole,
    crewMemberId: row.crew_member_id,
  };
}
