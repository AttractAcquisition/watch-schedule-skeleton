// Watch Schedule — generate-schedule Edge Function.
// Builds a draft watch schedule for a vessel between start_date and end_date.

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

    const { vessel_id, watch_template_id, start_date, end_date } = body ?? {};
    if (!vessel_id || !start_date || !end_date) {
      throw new HttpError("vessel_id, start_date and end_date are required.", 422);
    }

    const vessel = await assertVesselAccess(client, vessel_id);
    const mode: WatchMode = (body.watch_mode ?? vessel.watch_mode ?? "solo") as WatchMode;

    // Load template blocks if a template is referenced.
    let blocks: WatchBlock[] | undefined;
    if (watch_template_id) {
      const { data: tmpl } = await client
        .from("watch_templates")
        .select("watch_blocks")
        .eq("id", watch_template_id)
        .maybeSingle();
      const wb = tmpl?.watch_blocks;
      if (Array.isArray(wb) && wb.length) blocks = wb as WatchBlock[];
    }

    // Load crew, availability and active charter pauses (RLS-scoped).
    const [{ data: crew }, { data: availability }, { data: charterPauses }] = await Promise.all([
      client.from("crew_members").select("*").eq("vessel_id", vessel_id),
      client.from("crew_availability").select("*").eq("vessel_id", vessel_id),
      client
        .from("charter_pauses")
        .select("*")
        .eq("vessel_id", vessel_id)
        .in("status", ["active", "draft"]),
    ]);

    const result = generate({
      mode,
      startDate: start_date,
      endDate: end_date,
      blocks,
      crew: crew ?? [],
      availability: availability ?? [],
      charterPauses: charterPauses ?? [],
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
