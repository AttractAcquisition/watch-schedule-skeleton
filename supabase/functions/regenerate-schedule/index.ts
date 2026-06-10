// Watch Schedule — regenerate-schedule Edge Function.
// Rebuilds a draft schedule after a change (leave, crew status, rules, charter).
//
// mode = "full"          -> regenerate the entire date range
// mode = "affected_only" -> currently performs a full regenerate but only
//                           reports the assignment ids that changed. A finer
//                           per-watch diff can be layered on later.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";
import { generate, type WatchMode, type WatchBlock } from "../_shared/scheduler.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    const user = await requireUser(client);
    const body = await req.json();

    const { schedule_run_id, mode = "full", change_context } = body ?? {};
    if (!schedule_run_id) throw new HttpError("schedule_run_id is required.", 422);

    const { data: run, error: runErr } = await client
      .from("schedule_runs")
      .select("*")
      .eq("id", schedule_run_id)
      .maybeSingle();
    if (runErr) throw new HttpError(runErr.message, 400);
    if (!run) throw new HttpError("Schedule run not found.", 404);

    const vessel = await assertVesselAccess(client, run.vessel_id);
    const watchMode: WatchMode = (vessel.watch_mode ?? "solo") as WatchMode;

    let blocks: WatchBlock[] | undefined;
    if (run.watch_template_id) {
      const { data: tmpl } = await client
        .from("watch_templates")
        .select("watch_blocks")
        .eq("id", run.watch_template_id)
        .maybeSingle();
      const wb = tmpl?.watch_blocks;
      if (Array.isArray(wb) && wb.length) blocks = wb as WatchBlock[];
    }

    const [{ data: crew }, { data: availability }, { data: charterPauses }, { data: previous }] =
      await Promise.all([
        client.from("crew_members").select("*").eq("vessel_id", run.vessel_id),
        client.from("crew_availability").select("*").eq("vessel_id", run.vessel_id),
        client
          .from("charter_pauses")
          .select("*")
          .eq("vessel_id", run.vessel_id)
          .in("status", ["active", "draft"]),
        client.from("schedule_assignments").select("id").eq("schedule_run_id", schedule_run_id),
      ]);

    const result = generate({
      mode: watchMode,
      startDate: run.start_date,
      endDate: run.end_date,
      blocks,
      crew: crew ?? [],
      availability: availability ?? [],
      charterPauses: charterPauses ?? [],
    });

    const affected_assignment_ids = (previous ?? []).map((p: { id: string }) => p.id);

    // Replace assignments for this run.
    await client.from("schedule_assignments").delete().eq("schedule_run_id", schedule_run_id);
    if (result.assignments.length) {
      const rows = result.assignments.map((a) => ({
        ...a,
        schedule_run_id,
        vessel_id: run.vessel_id,
      }));
      const { error: aErr } = await client.from("schedule_assignments").insert(rows);
      if (aErr) throw new HttpError(aErr.message, 400);
    }

    await client
      .from("schedule_runs")
      .update({
        status: "draft",
        fairness_score: result.fairness_score,
        fairness_summary: result.fairness_summary,
        warnings: result.warnings,
      })
      .eq("id", schedule_run_id);

    await client.from("audit_logs").insert({
      vessel_id: run.vessel_id,
      user_id: user.id,
      action_type: "regenerate_schedule",
      entity_type: "schedule_run",
      entity_id: schedule_run_id,
      new_value: { mode, change_context: change_context ?? null, count: result.assignments.length },
      reason: "Schedule regenerated",
    });

    return jsonResponse({
      schedule_run_id,
      affected_assignment_ids,
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
