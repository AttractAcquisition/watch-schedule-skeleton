// Watch Schedule — charter-mode Edge Function.
// Pause / resume / cancel a vessel's watch rotation for a charter window.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    const user = await requireUser(client);
    const body = await req.json();

    const { vessel_id, action } = body ?? {};
    if (!vessel_id || !action) throw new HttpError("vessel_id and action are required.", 422);
    await assertVesselAccess(client, vessel_id);

    if (action === "activate") {
      const { start_date, end_date, schedule_run_id } = body;
      if (!start_date || !end_date) {
        throw new HttpError("start_date and end_date are required to activate.", 422);
      }

      // Freeze rotation order: remember the crew member who would be next, so we
      // can resume fairly. We pick the eligible active crew with the oldest
      // last_scheduled_at as the "next up".
      const { data: nextCrew } = await client
        .from("crew_members")
        .select("id")
        .eq("vessel_id", vessel_id)
        .eq("watch_eligible", true)
        .eq("status", "active")
        .order("last_scheduled_at", { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();

      const { data: pause, error } = await client
        .from("charter_pauses")
        .insert({
          vessel_id,
          schedule_run_id: schedule_run_id ?? null,
          start_date,
          end_date,
          pause_all_watches: body.pause_all_watches ?? true,
          keep_engineering_watch_active: body.keep_engineering_watch_active ?? false,
          keep_security_watch_active: body.keep_security_watch_active ?? false,
          resume_mode: body.resume_mode ?? "automatic",
          resume_next_crew_member_id: nextCrew?.id ?? null,
          status: "active",
        })
        .select()
        .single();
      if (error) throw new HttpError(error.message, 400);

      if (schedule_run_id) {
        await client.from("schedule_runs").update({ status: "paused" }).eq("id", schedule_run_id);
      }

      await audit(client, vessel_id, user.id, "charter_activate", pause.id, {
        start_date,
        end_date,
      });
      return jsonResponse({
        charter_pause_id: pause.id,
        status: pause.status,
        next_crew_member_id: pause.resume_next_crew_member_id,
        message: "Charter mode activated. Rotation frozen for the charter window.",
      });
    }

    if (action === "resume" || action === "cancel") {
      const { charter_pause_id } = body;
      // Resolve the target pause (explicit id, else latest active one).
      let pauseQuery = client.from("charter_pauses").select("*").eq("vessel_id", vessel_id);
      pauseQuery = charter_pause_id
        ? pauseQuery.eq("id", charter_pause_id)
        : pauseQuery.eq("status", "active").order("created_at", { ascending: false }).limit(1);
      const { data: pauseRow } = await pauseQuery.maybeSingle();
      if (!pauseRow) throw new HttpError("No matching charter pause found.", 404);

      const newStatus = action === "resume" ? "completed" : "cancelled";
      const { data: updated, error } = await client
        .from("charter_pauses")
        .update({ status: newStatus })
        .eq("id", pauseRow.id)
        .select()
        .single();
      if (error) throw new HttpError(error.message, 400);

      if (pauseRow.schedule_run_id) {
        await client
          .from("schedule_runs")
          .update({ status: action === "resume" ? "confirmed" : "draft" })
          .eq("id", pauseRow.schedule_run_id);
      }

      await audit(client, vessel_id, user.id, `charter_${action}`, pauseRow.id, {});
      return jsonResponse({
        charter_pause_id: updated.id,
        status: updated.status,
        next_crew_member_id: updated.resume_next_crew_member_id,
        message:
          action === "resume"
            ? "Charter completed. Rotation resumes from the stored next crew member."
            : "Charter pause cancelled.",
      });
    }

    throw new HttpError(`Unknown action "${action}".`, 422);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});

// deno-lint-ignore no-explicit-any
async function audit(
  client: any,
  vessel_id: string,
  user_id: string,
  action: string,
  entity_id: string,
  value: unknown,
) {
  await client.from("audit_logs").insert({
    vessel_id,
    user_id,
    action_type: action,
    entity_type: "charter_pause",
    entity_id,
    new_value: value,
  });
}
