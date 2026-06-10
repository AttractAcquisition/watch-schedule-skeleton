// Watch Schedule — export-schedule Edge Function.
// Creates an export_history record and returns placeholder data.
//
// TODO(pdf): generate a real PDF (e.g. with a Deno PDF lib or an external
// rendering service), upload it to Supabase Storage, and set file_url to the
// signed/public URL. For now we only record the export request.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";

const VALID_TYPES = ["bridge", "crew_mess", "department", "compliance_support"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    const user = await requireUser(client);
    const body = await req.json();

    const { schedule_run_id, export_type } = body ?? {};
    if (!schedule_run_id || !export_type) {
      throw new HttpError("schedule_run_id and export_type are required.", 422);
    }
    if (!VALID_TYPES.includes(export_type)) {
      throw new HttpError(`export_type must be one of ${VALID_TYPES.join(", ")}.`, 422);
    }

    const { data: run, error: runErr } = await client
      .from("schedule_runs")
      .select("id, vessel_id")
      .eq("id", schedule_run_id)
      .maybeSingle();
    if (runErr) throw new HttpError(runErr.message, 400);
    if (!run) throw new HttpError("Schedule run not found.", 404);

    await assertVesselAccess(client, run.vessel_id);

    // Next version number for this run + type.
    const { count } = await client
      .from("export_history")
      .select("id", { count: "exact", head: true })
      .eq("schedule_run_id", schedule_run_id)
      .eq("export_type", export_type);

    const { data: record, error } = await client
      .from("export_history")
      .insert({
        vessel_id: run.vessel_id,
        schedule_run_id,
        export_type,
        version: (count ?? 0) + 1,
        generated_by: user.id,
        status: "ready",
        // Placeholder until real PDF rendering is wired up.
        file_url: null,
      })
      .select()
      .single();
    if (error) throw new HttpError(error.message, 400);

    return jsonResponse({
      export_id: record.id,
      status: record.status,
      file_url: record.file_url,
      message:
        "Export recorded. PDF generation is a placeholder — file_url will be populated once PDF rendering is implemented.",
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});
