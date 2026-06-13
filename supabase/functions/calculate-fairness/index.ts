// WatchSchedule — calculate-fairness Edge Function.
// Recalculates fairness from live daily assignments without generating a new run.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, assertVesselAccess, HttpError } from "../_shared/client.ts";

function dutyType(date: string) {
  const [, month, day] = date.split("-").map(Number);
  if (month === 12 && [24, 25, 26, 31].includes(day)) return "holiday";
  if (month === 1 && day === 1) return "holiday";
  const weekday = new Date(date + "T00:00:00Z").getUTCDay();
  if (weekday === 5) return "friday";
  if (weekday === 6 || weekday === 0) return "weekend";
  return "weekday";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = getUserClient(req);
    await requireUser(client);
    const body = await req.json();
    const { vessel_id, schedule_run_id } = body ?? {};
    if (!vessel_id) throw new HttpError("vessel_id is required.", 422);
    await assertVesselAccess(client, vessel_id);

    const [{ data: crew }, { data: assignments }] = await Promise.all([
      client
        .from("crew_members")
        .select("id,full_name,status,watch_eligible")
        .eq("vessel_id", vessel_id),
      client
        .from("schedule_assignments")
        .select("crew_member_id,assignment_date,watch_start,duty_weight")
        .eq("vessel_id", vessel_id)
        .eq(schedule_run_id ? "schedule_run_id" : "vessel_id", schedule_run_id ?? vessel_id),
    ]);

    const activeCrew = (crew ?? []).filter(
      (member) => member.status === "active" && member.watch_eligible,
    );
    const loads = new Map(activeCrew.map((member) => [member.id, 0]));
    const counts = new Map(
      activeCrew.map((member) => [member.id, { total: 0, friday: 0, weekend: 0, holiday: 0 }]),
    );

    for (const assignment of assignments ?? []) {
      if (!loads.has(assignment.crew_member_id)) continue;
      const date = assignment.assignment_date ?? String(assignment.watch_start).slice(0, 10);
      const type = dutyType(date);
      loads.set(
        assignment.crew_member_id,
        (loads.get(assignment.crew_member_id) ?? 0) + Number(assignment.duty_weight ?? 1),
      );
      const row = counts.get(assignment.crew_member_id)!;
      row.total += 1;
      if (type === "friday") row.friday += 1;
      if (type === "weekend") row.weekend += 1;
      if (type === "holiday") row.holiday += 1;
    }

    const totalLoad = [...loads.values()].reduce((sum, load) => sum + load, 0);
    const expected = totalLoad / (activeCrew.length || 1);
    const perCrew = activeCrew.map((member) => {
      const load = loads.get(member.id) ?? 0;
      const fairnessDebt = Math.max(0, Math.round((load - expected) * 100) / 100);
      const score = Math.max(0, Math.min(100, Math.round(100 - fairnessDebt * 8)));
      const row = counts.get(member.id)!;
      return {
        crew_member_id: member.id,
        crew_name: member.full_name,
        crew_fairness_score: score,
        fairness_debt: fairnessDebt,
        total_duties: row.total,
        friday_duties: row.friday,
        weekend_duties: row.weekend,
        public_holiday_duties: row.holiday,
      };
    });

    const scheduleFairness = perCrew.length
      ? Math.round(perCrew.reduce((sum, row) => sum + row.crew_fairness_score, 0) / perCrew.length)
      : 0;
    const alerts = perCrew
      .filter((row) => row.crew_fairness_score < 85 || row.fairness_debt > 1)
      .map((row) => `${row.crew_name} has elevated fairness debt.`);

    return jsonResponse({
      per_crew: perCrew,
      schedule_fairness_score: scheduleFairness,
      highest_fairness_debt: Math.max(...perCrew.map((row) => row.fairness_debt), 0),
      most_due_to_serve: [...perCrew].sort((a, b) => a.fairness_debt - b.fairness_debt)[0] ?? null,
      alerts,
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error", status);
  }
});
