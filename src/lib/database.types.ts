// Watch Schedule — database type definitions.
// Hand-authored to match supabase/migrations. Regenerate with:
//   supabase gen types typescript --project-id diepraznybnjlwryibod > src/lib/database.types.ts
// once the CLI is linked (see SUPABASE_SETUP.md).

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: "solo_watch" | "dual_watch" | "triple_watch" | null;
  status: "inactive" | "trialing" | "active" | "past_due" | "cancelled";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface VesselRow {
  id: string;
  owner_id: string;
  name: string;
  length_range: string | null;
  length_meters: number | null;
  operation_type: string | null;
  timezone: string;
  plan_type: string | null;
  watch_mode: "solo" | "dual" | "triple";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface VesselMemberRow {
  id: string;
  vessel_id: string;
  user_id: string;
  role: "captain_admin" | "officer" | "department_head" | "crew_member" | "viewer";
  created_at: string;
}

export interface CrewMemberRow {
  id: string;
  vessel_id: string;
  full_name: string;
  position: string | null;
  department: "command" | "deck" | "interior" | "engineering" | "unassigned";
  seniority: string | null;
  watch_eligible: boolean;
  eligible_roles: string[];
  status: "active" | "on_leave" | "sick" | "off_vessel" | "training" | "unavailable";
  notes: string | null;
  last_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchTemplateRow {
  id: string;
  vessel_id: string;
  name: string | null;
  watch_mode: "solo" | "dual" | "triple" | null;
  watch_blocks: Json;
  coverage_rules: Json;
  rotation_rules: Json;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRunRow {
  id: string;
  vessel_id: string;
  watch_template_id: string | null;
  start_date: string;
  end_date: string;
  status: "draft" | "confirmed" | "paused" | "archived";
  fairness_score: number | null;
  fairness_summary: Json;
  warnings: Json;
  generated_by: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleAssignmentRow {
  id: string;
  schedule_run_id: string;
  vessel_id: string;
  crew_member_id: string;
  department: string | null;
  watch_role: string | null;
  watch_start: string;
  watch_end: string;
  assignment_reason: string | null;
  is_manual_override: boolean;
  created_at: string;
}

export interface CrewAvailabilityRow {
  id: string;
  vessel_id: string;
  crew_member_id: string;
  status: "available" | "on_leave" | "sick" | "off_vessel" | "training" | "unavailable" | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
}

export interface CharterPauseRow {
  id: string;
  vessel_id: string;
  schedule_run_id: string | null;
  start_date: string;
  end_date: string;
  pause_all_watches: boolean;
  keep_engineering_watch_active: boolean;
  keep_security_watch_active: boolean;
  resume_mode: "automatic" | "manual";
  resume_next_crew_member_id: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  vessel_id: string;
  user_id: string | null;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Json;
  new_value: Json;
  reason: string | null;
  created_at: string;
}

export interface ExportHistoryRow {
  id: string;
  vessel_id: string;
  schedule_run_id: string;
  export_type: "bridge" | "crew_mess" | "department" | "compliance_support";
  version: number;
  generated_by: string | null;
  status: string;
  file_url: string | null;
  created_at: string;
}

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      subscriptions: TableShape<SubscriptionRow>;
      vessels: TableShape<VesselRow>;
      vessel_members: TableShape<VesselMemberRow>;
      crew_members: TableShape<CrewMemberRow>;
      watch_templates: TableShape<WatchTemplateRow>;
      schedule_runs: TableShape<ScheduleRunRow>;
      schedule_assignments: TableShape<ScheduleAssignmentRow>;
      crew_availability: TableShape<CrewAvailabilityRow>;
      charter_pauses: TableShape<CharterPauseRow>;
      audit_logs: TableShape<AuditLogRow>;
      export_history: TableShape<ExportHistoryRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
