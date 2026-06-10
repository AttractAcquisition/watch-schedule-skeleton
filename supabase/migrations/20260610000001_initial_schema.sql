-- Watch Schedule — initial schema
-- Superyacht watch rota app. All app data is vessel-scoped.

create extension if not exists "pgcrypto";

-- A. profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'captain',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- B. subscriptions ------------------------------------------------------------
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade,
  plan_type              text check (plan_type in ('solo_watch','dual_watch','triple_watch')),
  status                 text not null default 'inactive'
                            check (status in ('inactive','trialing','active','past_due','cancelled')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- C. vessels ------------------------------------------------------------------
create table if not exists public.vessels (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid references auth.users(id) on delete cascade,
  name                 text not null,
  length_range         text,
  length_meters        numeric,
  operation_type       text,
  timezone             text not null default 'UTC',
  plan_type            text,
  watch_mode           text not null default 'solo' check (watch_mode in ('solo','dual','triple')),
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists vessels_owner_id_idx on public.vessels(owner_id);

-- D. vessel_members -----------------------------------------------------------
create table if not exists public.vessel_members (
  id         uuid primary key default gen_random_uuid(),
  vessel_id  uuid references public.vessels(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  role       text not null default 'captain_admin'
                check (role in ('captain_admin','officer','department_head','crew_member','viewer')),
  created_at timestamptz not null default now(),
  unique (vessel_id, user_id)
);
create index if not exists vessel_members_vessel_id_idx on public.vessel_members(vessel_id);
create index if not exists vessel_members_user_id_idx on public.vessel_members(user_id);

-- E. crew_members -------------------------------------------------------------
create table if not exists public.crew_members (
  id                uuid primary key default gen_random_uuid(),
  vessel_id         uuid references public.vessels(id) on delete cascade,
  full_name         text not null,
  position          text,
  department        text not null default 'unassigned'
                       check (department in ('command','deck','interior','engineering','unassigned')),
  seniority         text,
  watch_eligible    boolean not null default true,
  eligible_roles    text[] not null default '{}',
  status            text not null default 'active'
                       check (status in ('active','on_leave','sick','off_vessel','training','unavailable')),
  notes             text,
  last_scheduled_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists crew_members_vessel_id_idx on public.crew_members(vessel_id);

-- F. watch_templates ----------------------------------------------------------
create table if not exists public.watch_templates (
  id             uuid primary key default gen_random_uuid(),
  vessel_id      uuid references public.vessels(id) on delete cascade,
  name           text,
  watch_mode     text check (watch_mode in ('solo','dual','triple')),
  watch_blocks   jsonb not null default '[]',
  coverage_rules jsonb not null default '{}',
  rotation_rules jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists watch_templates_vessel_id_idx on public.watch_templates(vessel_id);

-- G. schedule_runs ------------------------------------------------------------
create table if not exists public.schedule_runs (
  id                uuid primary key default gen_random_uuid(),
  vessel_id         uuid references public.vessels(id) on delete cascade,
  watch_template_id uuid references public.watch_templates(id) on delete set null,
  start_date        date not null,
  end_date          date not null,
  status            text not null default 'draft'
                       check (status in ('draft','confirmed','paused','archived')),
  fairness_score    numeric,
  fairness_summary  jsonb not null default '{}',
  warnings          jsonb not null default '[]',
  generated_by      uuid references auth.users(id),
  confirmed_by      uuid references auth.users(id),
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists schedule_runs_vessel_id_idx on public.schedule_runs(vessel_id);

-- H. schedule_assignments -----------------------------------------------------
create table if not exists public.schedule_assignments (
  id                 uuid primary key default gen_random_uuid(),
  schedule_run_id    uuid references public.schedule_runs(id) on delete cascade,
  vessel_id          uuid references public.vessels(id) on delete cascade,
  crew_member_id     uuid references public.crew_members(id) on delete cascade,
  department         text,
  watch_role         text,
  watch_start        timestamptz not null,
  watch_end          timestamptz not null,
  assignment_reason  text,
  is_manual_override boolean not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists schedule_assignments_run_idx on public.schedule_assignments(schedule_run_id);
create index if not exists schedule_assignments_vessel_idx on public.schedule_assignments(vessel_id);

-- I. crew_availability --------------------------------------------------------
create table if not exists public.crew_availability (
  id             uuid primary key default gen_random_uuid(),
  vessel_id      uuid references public.vessels(id) on delete cascade,
  crew_member_id uuid references public.crew_members(id) on delete cascade,
  status         text check (status in ('available','on_leave','sick','off_vessel','training','unavailable')),
  start_date     date not null,
  end_date       date not null,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists crew_availability_vessel_idx on public.crew_availability(vessel_id);

-- J. charter_pauses -----------------------------------------------------------
create table if not exists public.charter_pauses (
  id                            uuid primary key default gen_random_uuid(),
  vessel_id                     uuid references public.vessels(id) on delete cascade,
  schedule_run_id               uuid references public.schedule_runs(id) on delete set null,
  start_date                    date not null,
  end_date                      date not null,
  pause_all_watches             boolean not null default true,
  keep_engineering_watch_active boolean not null default false,
  keep_security_watch_active    boolean not null default false,
  resume_mode                   text not null default 'automatic' check (resume_mode in ('automatic','manual')),
  resume_next_crew_member_id    uuid references public.crew_members(id),
  status                        text not null default 'draft'
                                   check (status in ('draft','active','completed','cancelled')),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create index if not exists charter_pauses_vessel_idx on public.charter_pauses(vessel_id);

-- K. audit_logs ---------------------------------------------------------------
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  vessel_id    uuid references public.vessels(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  action_type  text not null,
  entity_type  text,
  entity_id    uuid,
  old_value    jsonb,
  new_value    jsonb,
  reason       text,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_vessel_idx on public.audit_logs(vessel_id);

-- L. export_history -----------------------------------------------------------
create table if not exists public.export_history (
  id              uuid primary key default gen_random_uuid(),
  vessel_id       uuid references public.vessels(id) on delete cascade,
  schedule_run_id uuid references public.schedule_runs(id) on delete cascade,
  export_type     text check (export_type in ('bridge','crew_mess','department','compliance_support')),
  version         int not null default 1,
  generated_by    uuid references auth.users(id),
  status          text not null default 'ready',
  file_url        text,
  created_at      timestamptz not null default now()
);
create index if not exists export_history_vessel_idx on public.export_history(vessel_id);
