// WatchSchedule — leave-impact Edge Function.
// Forecasts the operational impact of a leave/unavailability period.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    await requireUser(client);
    const body = await req.json();
    const { vessel_id, crew_member_id, start_date, end_date } = body ?? {};
    if (!vessel_id || !crew_member_id || !start_date || !end_date) {
      throw new HttpError("vessel_id, crew_member_id, start_date and end_date are required.", 422);
    }
    await assertVesselAccess(client, vessel_id);

    const [{ data: crew }, { data: affectedAssignments }] = await Promise.all([
      client
        .from("crew_members")
        .select("id,status,watch_eligible")
        .eq("vessel_id", vessel_id)
        .eq("status", "active")
        .eq("watch_eligible", true),
      client
        .from("schedule_assignments")
        .select("id,assignment_date,watch_start,duty_weight")
        .eq("vessel_id", vessel_id)
        .eq("crew_member_id", crew_member_id)
        .gte("watch_start", `${start_date}T00:00:00Z`)
        .lte("watch_start", `${end_date}T23:59:59Z`),
    ]);

    const eligibleRemaining = Math.max(((crew ?? []).length || 0) - 1, 0);
    const dutiesAffected = affectedAssignments?.length ?? 0;
    const weightedBurden = (affectedAssignments ?? []).reduce(
      (sum, assignment) => sum + Number(assignment.duty_weight ?? 1),
      0,
    );
    const staffingGaps = eligibleRemaining === 0 && dutiesAffected > 0 ? dutiesAffected : 0;
    const impactScore = Math.min(
      100,
      Math.round(weightedBurden * 12 + Math.max(0, 3 - eligibleRemaining) * 10),
    );

    return jsonResponse({
      impact_score: impactScore,
      duties_requiring_reassignment: dutiesAffected,
      affected_assignment_ids: (affectedAssignments ?? []).map((assignment) => assignment.id),
      staffing_gaps: staffingGaps,
      fairness_impact: weightedBurden,
      resource_constraint_warnings:
        staffingGaps > 0
          ? ["No eligible remaining watchkeepers for affected dates."]
          : eligibleRemaining < 2
            ? ["Limited eligible cover during this leave period."]
            : [],
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});
