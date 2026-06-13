// Watch Schedule — Supabase data access layer.
// Thin typed wrappers around supabase queries used by the pages/hooks.

import { supabase } from "../supabase";
import type {
  CrewMemberRow,
  ScheduleRunRow,
  ScheduleAssignmentRow,
  CharterPauseRow,
  CrewAvailabilityRow,
  ExportHistoryRow,
  WatchTemplateRow,
  ProfileRow,
  VesselRow,
  WatchSettingsRow,
  CrewFairnessScoreRow,
  ScheduleHealthScoreRow,
  ScheduleExplanationRow,
  ManualOverrideRow,
  LeaveRequestRow,
} from "../database.types";
import type { PlanType, Department, CrewStatus, WatchRole } from "../types";

export * from "./mappers";

function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  if (res.data == null) throw new Error("No data returned from Supabase.");
  return res.data as NonNullable<T>;
}

/* ------------------------------------------------------------------ profile */

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<ProfileRow, "full_name" | "role">>,
) {
  return unwrap(await supabase.from("profiles").update(patch).eq("id", userId).select().single());
}

/* ------------------------------------------------------------------ vessel */

export async function getVesselForUser(userId: string): Promise<VesselRow | null> {
  const { data, error } = await supabase
    .from("vessels")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVessel(vesselId: string, patch: Partial<VesselRow>) {
  return unwrap(await supabase.from("vessels").update(patch).eq("id", vesselId).select().single());
}

export interface OnboardingPayload {
  userId: string;
  vessel: {
    name: string;
    lengthRange?: string;
    lengthMeters?: number;
    operationType?: string;
    timezone?: string;
    watchMode: "solo" | "dual" | "triple";
    planType: PlanType;
  };
  crew: Array<{
    fullName: string;
    position?: string;
    department?: Department;
    watchEligible?: boolean;
    eligibleRoles?: WatchRole[];
    status?: CrewStatus;
  }>;
  watchBlocks?: unknown;
}

/**
 * Persists a completed onboarding in a few sequential writes:
 *  - upsert the vessel (one per owner)
 *  - ensure a captain_admin vessel_member for the owner
 *  - replace the crew list
 *  - create a default watch template
 *  - mark vessel.onboarding_completed = true
 */
export async function completeOnboarding(payload: OnboardingPayload): Promise<VesselRow> {
  const { userId, vessel, crew, watchBlocks } = payload;

  // 1. upsert vessel (reuse existing owner vessel if present)
  const existing = await getVesselForUser(userId);
  const vesselFields = {
    owner_id: userId,
    name: vessel.name,
    length_range: vessel.lengthRange ?? null,
    length_meters: vessel.lengthMeters ?? null,
    operation_type: vessel.operationType ?? null,
    timezone: vessel.timezone ?? "UTC",
    plan_type: vessel.planType,
    watch_mode: vessel.watchMode,
  };

  const vesselRow = existing
    ? unwrap(
        await supabase.from("vessels").update(vesselFields).eq("id", existing.id).select().single(),
      )
    : unwrap(await supabase.from("vessels").insert(vesselFields).select().single());

  // 2. ensure owner membership
  await supabase
    .from("vessel_members")
    .upsert(
      { vessel_id: vesselRow.id, user_id: userId, role: "captain_admin" },
      { onConflict: "vessel_id,user_id" },
    );

  // 3. replace crew list
  if (crew.length) {
    await supabase.from("crew_members").delete().eq("vessel_id", vesselRow.id);
    const rows = crew.map((c) => ({
      vessel_id: vesselRow.id,
      full_name: c.fullName,
      position: c.position ?? null,
      department: c.department ?? "unassigned",
      watch_eligible: c.watchEligible ?? true,
      eligible_roles: c.eligibleRoles ?? [],
      status: c.status ?? "active",
    }));
    unwrap(await supabase.from("crew_members").insert(rows).select());
  }

  // 4. default watch template
  await supabase.from("watch_templates").insert({
    vessel_id: vesselRow.id,
    name: "Default rota",
    watch_mode: vessel.watchMode,
    watch_blocks: (watchBlocks as object) ?? [],
  });

  // 5. mark complete
  const completed = unwrap(
    await supabase
      .from("vessels")
      .update({ onboarding_completed: true })
      .eq("id", vesselRow.id)
      .select()
      .single(),
  );

  return completed;
}

/* ------------------------------------------------------------------- crew */

export async function listCrew(vesselId: string): Promise<CrewMemberRow[]> {
  return unwrap(
    await supabase
      .from("crew_members")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("created_at", { ascending: true }),
  );
}

export async function createCrew(
  vesselId: string,
  input: Partial<CrewMemberRow> & { full_name: string },
) {
  return unwrap(
    await supabase
      .from("crew_members")
      .insert({ ...input, vessel_id: vesselId })
      .select()
      .single(),
  );
}

export async function updateCrew(id: string, patch: Partial<CrewMemberRow>) {
  return unwrap(await supabase.from("crew_members").update(patch).eq("id", id).select().single());
}

export async function archiveCrew(id: string) {
  return updateCrew(id, {
    crew_lifecycle_status: "archived",
    status: "unavailable",
    watch_eligible: false,
  });
}

/* --------------------------------------------------------------- schedules */

export async function getLatestScheduleRun(vesselId: string): Promise<ScheduleRunRow | null> {
  const { data, error } = await supabase
    .from("schedule_runs")
    .select("*")
    .eq("vessel_id", vesselId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAssignments(scheduleRunId: string): Promise<ScheduleAssignmentRow[]> {
  return unwrap(
    await supabase
      .from("schedule_assignments")
      .select("*")
      .eq("schedule_run_id", scheduleRunId)
      .order("watch_start", { ascending: true }),
  );
}

export async function confirmScheduleRun(scheduleRunId: string, userId: string) {
  return unwrap(
    await supabase
      .from("schedule_runs")
      .update({
        status: "confirmed",
        confirmed_by: userId,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", scheduleRunId)
      .select()
      .single(),
  );
}

export async function listWatchTemplates(vesselId: string): Promise<WatchTemplateRow[]> {
  return unwrap(
    await supabase
      .from("watch_templates")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("created_at", { ascending: false }),
  );
}

/* ------------------------------------------------------------ watch settings */

export async function getWatchSettings(vesselId: string): Promise<WatchSettingsRow | null> {
  const { data, error } = await supabase
    .from("watch_settings")
    .select("*")
    .eq("vessel_id", vesselId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertWatchSettings(
  vesselId: string,
  patch: Partial<WatchSettingsRow> & { vessel_id?: string },
) {
  return unwrap(
    await supabase
      .from("watch_settings")
      .upsert({ ...patch, vessel_id: vesselId }, { onConflict: "vessel_id" })
      .select()
      .single(),
  );
}

/* ------------------------------------------------------------- availability */

export async function listLeave(vesselId: string): Promise<CrewAvailabilityRow[]> {
  return unwrap(
    await supabase
      .from("crew_availability")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("start_date", { ascending: false }),
  );
}

export async function createLeave(input: {
  vesselId: string;
  crewMemberId: string;
  status: string; // crew_availability.status enum value
  startDate: string;
  endDate: string;
  notes?: string;
}) {
  return unwrap(
    await supabase
      .from("crew_availability")
      .insert({
        vessel_id: input.vesselId,
        crew_member_id: input.crewMemberId,
        status: input.status,
        start_date: input.startDate,
        end_date: input.endDate,
        notes: input.notes ?? null,
      })
      .select()
      .single(),
  );
}

/* ------------------------------------------------------------- leave requests */

export async function listLeaveRequests(vesselId: string): Promise<LeaveRequestRow[]> {
  return unwrap(
    await supabase
      .from("leave_requests")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("start_date", { ascending: false }),
  );
}

export async function createLeaveRequest(input: {
  vesselId: string;
  crewMemberId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveRequestRow["leave_type"];
  status?: LeaveRequestRow["status"];
  impact_score?: number;
  forecast_result?: Record<string, unknown>;
  notes?: string;
  requestedBy?: string;
}) {
  return unwrap(
    await supabase
      .from("leave_requests")
      .insert({
        vessel_id: input.vesselId,
        crew_member_id: input.crewMemberId,
        start_date: input.startDate,
        end_date: input.endDate,
        leave_type: input.leaveType,
        status: input.status ?? "requested",
        impact_score: input.impact_score ?? 0,
        forecast_result: input.forecast_result ?? {},
        notes: input.notes ?? null,
        requested_by: input.requestedBy ?? null,
      })
      .select()
      .single(),
  );
}

export async function updateLeaveRequest(id: string, patch: Partial<LeaveRequestRow>) {
  return unwrap(await supabase.from("leave_requests").update(patch).eq("id", id).select().single());
}

/* ----------------------------------------------------------------- charter */

export async function listCharterPauses(vesselId: string): Promise<CharterPauseRow[]> {
  return unwrap(
    await supabase
      .from("charter_pauses")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("start_date", { ascending: false }),
  );
}

/* ----------------------------------------------------------------- exports */

export async function listExports(vesselId: string): Promise<ExportHistoryRow[]> {
  return unwrap(
    await supabase
      .from("export_history")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("created_at", { ascending: false }),
  );
}

/* ---------------------------------------------------------- intelligence data */

export async function listLatestCrewFairnessScores(
  vesselId: string,
): Promise<CrewFairnessScoreRow[]> {
  return unwrap(
    await supabase
      .from("crew_fairness_scores")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("calculated_at", { ascending: false }),
  );
}

export async function getLatestScheduleHealth(
  vesselId: string,
): Promise<ScheduleHealthScoreRow | null> {
  const { data, error } = await supabase
    .from("schedule_health_scores")
    .select("*")
    .eq("vessel_id", vesselId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listScheduleExplanations(
  vesselId: string,
): Promise<ScheduleExplanationRow[]> {
  return unwrap(
    await supabase
      .from("schedule_explanations")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("created_at", { ascending: false })
      .limit(10),
  );
}

export async function listManualOverrides(vesselId: string): Promise<ManualOverrideRow[]> {
  return unwrap(
    await supabase
      .from("manual_overrides")
      .select("*")
      .eq("vessel_id", vesselId)
      .order("created_at", { ascending: false })
      .limit(10),
  );
}
