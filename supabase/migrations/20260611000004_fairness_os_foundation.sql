-- WatchSchedule — Fairness OS foundation
-- Additive schema for daily watch settings, historical fairness, override
-- tracking, explanations, health scores, and leave workflow.

alter table public.crew_members
  add column if not exists rank text,
  add column if not exists is_rotational boolean not null default true,
  add column if not exists is_relief boolean not null default false,
  add column if not exists crew_lifecycle_status text not null default 'active'
    check (crew_lifecycle_status in ('active','joiner','leaver','archived'));

alter table public.schedule_runs
  add column if not exists version int not null default 1,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references auth.users(id),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by uuid references auth.users(id),
  add column if not exists approval_status text not null default 'draft'
    check (approval_status in ('draft','captain_approved','oow_approved','published','locked'));

alter table public.schedule_assignments
  add column if not exists assignment_date date,
  add column if not exists duty_weight numeric not null default 1,
  add column if not exists duty_type text not null default 'standard_weekday';

update public.schedule_assignments
set assignment_date = watch_start::date
where assignment_date is null;

create index if not exists schedule_assignments_date_idx
  on public.schedule_assignments(vessel_id, assignment_date);

create table if not exists public.watch_settings (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  schedule_type text not null default 'daily_watch'
    check (schedule_type in ('daily_watch')),
  weekend_mode text not null default 'standard'
    check (weekend_mode in ('standard','heavy','friday_sunday','saturday_sunday','custom')),
  duty_weights jsonb not null default '{
    "standard_weekday": 1.0,
    "monday": 1.0,
    "friday": 1.25,
    "saturday": 1.5,
    "sunday": 1.5,
    "public_holiday": 1.5,
    "christmas_eve": 2.0,
    "christmas_day": 2.5,
    "boxing_day": 2.0,
    "new_years_eve": 2.5,
    "new_years_day": 2.0
  }'::jsonb,
  rotation_rules jsonb not null default '{}',
  charter_rules jsonb not null default '{}',
  fairness_rules jsonb not null default '{}',
  publishing_rules jsonb not null default '{}',
  intelligence_rules jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vessel_id)
);
create index if not exists watch_settings_vessel_idx on public.watch_settings(vessel_id);

create table if not exists public.crew_fairness_scores (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  schedule_run_id uuid references public.schedule_runs(id) on delete cascade,
  crew_fairness_score numeric not null default 0,
  fairness_debt numeric not null default 0,
  historical_fairness_score numeric,
  total_duties int not null default 0,
  friday_duties int not null default 0,
  weekend_duties int not null default 0,
  public_holiday_duties int not null default 0,
  christmas_new_year_duties int not null default 0,
  consecutive_duty_risk int not null default 0,
  leave_impact numeric not null default 0,
  most_due_rank jsonb not null default '{}',
  calculated_at timestamptz not null default now()
);
create index if not exists crew_fairness_scores_vessel_idx
  on public.crew_fairness_scores(vessel_id, calculated_at desc);
create index if not exists crew_fairness_scores_crew_idx
  on public.crew_fairness_scores(crew_member_id, calculated_at desc);

create table if not exists public.manual_overrides (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  schedule_run_id uuid references public.schedule_runs(id) on delete cascade,
  assignment_id uuid references public.schedule_assignments(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  old_crew_member_id uuid references public.crew_members(id) on delete set null,
  new_crew_member_id uuid references public.crew_members(id) on delete set null,
  reason text,
  fairness_impact_before jsonb,
  fairness_impact_after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists manual_overrides_vessel_idx
  on public.manual_overrides(vessel_id, created_at desc);

create table if not exists public.schedule_explanations (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  schedule_run_id uuid references public.schedule_runs(id) on delete cascade,
  crew_member_id uuid references public.crew_members(id) on delete set null,
  assignment_id uuid references public.schedule_assignments(id) on delete set null,
  explanation_type text not null default 'schedule',
  explanation_text text not null,
  input_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists schedule_explanations_vessel_idx
  on public.schedule_explanations(vessel_id, created_at desc);

create table if not exists public.schedule_health_scores (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  schedule_run_id uuid references public.schedule_runs(id) on delete cascade,
  coverage_gaps int not null default 0,
  resource_shortages int not null default 0,
  excessive_overrides int not null default 0,
  consecutive_duty_risk int not null default 0,
  rotation_stability_score numeric not null default 0,
  schedule_health_score numeric not null default 0,
  calculated_at timestamptz not null default now()
);
create index if not exists schedule_health_scores_vessel_idx
  on public.schedule_health_scores(vessel_id, calculated_at desc);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'leave'
    check (leave_type in ('leave','sick','training','off_vessel','unavailable')),
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','cancelled')),
  impact_score numeric not null default 0,
  forecast_result jsonb not null default '{}',
  notes text,
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leave_requests_vessel_idx
  on public.leave_requests(vessel_id, start_date desc);
create index if not exists leave_requests_crew_idx
  on public.leave_requests(crew_member_id, start_date desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'watch_settings','leave_requests'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

alter table public.watch_settings          enable row level security;
alter table public.crew_fairness_scores    enable row level security;
alter table public.manual_overrides        enable row level security;
alter table public.schedule_explanations   enable row level security;
alter table public.schedule_health_scores  enable row level security;
alter table public.leave_requests          enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'watch_settings','crew_fairness_scores','manual_overrides',
    'schedule_explanations','schedule_health_scores','leave_requests'
  ]
  loop
    execute format('drop policy if exists %I_select_member on public.%I', t, t);
    execute format(
      'create policy %I_select_member on public.%I
         for select using (public.is_vessel_member(vessel_id))', t, t);

    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format(
      'create policy %I_admin_all on public.%I
         for all using (public.is_vessel_admin(vessel_id))
         with check (public.is_vessel_admin(vessel_id))', t, t);
  end loop;
end;
$$;
