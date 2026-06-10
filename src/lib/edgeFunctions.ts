// Watch Schedule — typed wrappers around Supabase Edge Functions.
// Each call forwards the user's JWT automatically via supabase.functions.invoke.

import { supabase } from "./supabase";

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
  });
  if (error) {
    // FunctionsHttpError carries the JSON body in error.context
    let detail = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        if (parsed?.error) detail = parsed.error;
      }
    } catch {
      /* ignore parse issues */
    }
    throw new Error(detail);
  }
  return data as T;
}

export interface GenerateSchedulePayload {
  vessel_id: string;
  watch_template_id?: string;
  start_date: string;
  end_date: string;
  watch_mode?: "solo" | "dual" | "triple";
}

export interface GenerateScheduleResult {
  schedule_run_id: string;
  assignments: unknown[];
  fairness_score: number;
  fairness_summary: Record<string, unknown>;
  warnings: string[];
}

export function generateSchedule(payload: GenerateSchedulePayload) {
  return invoke<GenerateScheduleResult>("generate-schedule", payload);
}

export interface RegenerateSchedulePayload {
  schedule_run_id: string;
  mode: "affected_only" | "full";
  change_context?: Record<string, unknown>;
}

export function regenerateSchedule(payload: RegenerateSchedulePayload) {
  return invoke<GenerateScheduleResult & { affected_assignment_ids: string[] }>(
    "regenerate-schedule",
    payload,
  );
}

export interface CharterModePayload {
  vessel_id: string;
  action: "activate" | "resume" | "cancel";
  schedule_run_id?: string;
  start_date?: string;
  end_date?: string;
  pause_all_watches?: boolean;
  keep_engineering_watch_active?: boolean;
  keep_security_watch_active?: boolean;
  resume_mode?: "automatic" | "manual";
}

export interface CharterModeResult {
  charter_pause_id: string;
  status: string;
  next_crew_member_id: string | null;
  message: string;
}

export function activateCharterMode(payload: Omit<CharterModePayload, "action">) {
  return invoke<CharterModeResult>("charter-mode", { ...payload, action: "activate" });
}

export function resumeCharterMode(payload: Omit<CharterModePayload, "action">) {
  return invoke<CharterModeResult>("charter-mode", { ...payload, action: "resume" });
}

export function cancelCharterMode(payload: Omit<CharterModePayload, "action">) {
  return invoke<CharterModeResult>("charter-mode", { ...payload, action: "cancel" });
}

export interface ExportSchedulePayload {
  schedule_run_id: string;
  export_type: "bridge" | "crew_mess" | "department" | "compliance_support";
}

export interface ExportScheduleResult {
  export_id: string;
  status: string;
  file_url: string | null;
  message: string;
}

export function exportSchedule(payload: ExportSchedulePayload) {
  return invoke<ExportScheduleResult>("export-schedule", payload);
}
