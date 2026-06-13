// Watch Schedule — generate-schedule Edge Function.
// Builds a draft watch schedule for a vessel between start_date and end_date.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";
import { generate, type WatchMode } from "../_shared/scheduler.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    const user = await requireUser(client);
    const body = await req.json();

    const { vessel_id, watch_template_id, start_date, end_date } = body ?? {};
    if (!vessel_id || !start_date || !end_date) {
      throw new HttpError("vessel_id, start_date and end_date are required.", 422);
    }

    const vessel = await assertVesselAccess(client, vessel_id);
    const mode: WatchMode = (body.watch_mode ?? vessel.watch_mode ?? "solo") as WatchMode;

    const [
      { data: crew },
      { data: availability },
      { data: leaveRequests },
      { data: charterPauses },
      { data: watchSettings },
      { data: historicalFairness },
    ] = await Promise.all([
      client.from("crew_members").select("*").eq("vessel_id", vessel_id),
      client.from("crew_availability").select("*").eq("vessel_id", vessel_id),
      client
        .from("leave_requests")
        .select("crew_member_id,status,start_date,end_date")
        .eq("vessel_id", vessel_id)
        .in("status", ["requested", "approved"]),
      client
        .from("charter_pauses")
        .select("*")
        .eq("vessel_id", vessel_id)
        .in("status", ["active", "draft"]),
      client.from("watch_settings").select("*").eq("vessel_id", vessel_id).maybeSingle(),
      client
        .from("crew_fairness_scores")
        .select("crew_member_id,fairness_debt")
        .eq("vessel_id", vessel_id),
    ]);

    const result = generate({
      mode,
      startDate: start_date,
      endDate: end_date,
      crew: crew ?? [],
      availability: [...(availability ?? []), ...(leaveRequests ?? [])],
      charterPauses: charterPauses ?? [],
      dutyWeights: (watchSettings?.duty_weights ?? body.duty_weights ?? {}) as Record<
        string,
        number
      >,
      historicalFairness: historicalFairness ?? [],
    });

    // Persist the draft run.
    const { data: run, error: runErr } = await client
      .from("schedule_runs")
      .insert({
        vessel_id,
        watch_template_id: watch_template_id ?? null,
        start_date,
        end_date,
        status: "draft",
        fairness_score: result.fairness_score,
        fairness_summary: result.fairness_summary,
        warnings: result.warnings,
        generated_by: user.id,
      })
      .select()
      .single();
    if (runErr) throw new HttpError(runErr.message, 400);

    if (result.assignments.length) {
      const rows = result.assignments.map((a) => ({ ...a, schedule_run_id: run.id, vessel_id }));
      const { error: aErr } = await client.from("schedule_assignments").insert(rows);
      if (aErr) throw new HttpError(aErr.message, 400);
    }

    if (result.crew_fairness_scores.length) {
      await client.from("crew_fairness_scores").insert(
        result.crew_fairness_scores.map((score) => ({
          ...score,
          vessel_id,
          schedule_run_id: run.id,
        })),
      );
    }

    await client.from("schedule_health_scores").insert({
      ...result.schedule_health,
      vessel_id,
      schedule_run_id: run.id,
    });

    if (result.explanations.length) {
      await client.from("schedule_explanations").insert(
        result.explanations.map((explanation) => ({
          vessel_id,
          schedule_run_id: run.id,
          crew_member_id: explanation.crew_member_id,
          assignment_id: null,
          explanation_type: explanation.explanation_type,
          explanation_text: explanation.explanation_text,
          input_snapshot: explanation.input_snapshot,
        })),
      );
    }

    // Audit log (best effort).
    await client.from("audit_logs").insert({
      vessel_id,
      user_id: user.id,
      action_type: "generate_schedule",
      entity_type: "schedule_run",
      entity_id: run.id,
      new_value: { start_date, end_date, mode, count: result.assignments.length },
      reason: "Draft schedule generated",
    });

    return jsonResponse({
      schedule_run_id: run.id,
      assignments: result.assignments,
      fairness_score: result.fairness_score,
      fairness_summary: result.fairness_summary,
      warnings: result.warnings,
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});
