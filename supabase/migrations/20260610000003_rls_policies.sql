-- Watch Schedule — Row Level Security
-- No unauthenticated access to vessel/crew/schedule data. Everything is
-- gated on owner_id = auth.uid() or membership in vessel_members.

alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.vessels             enable row level security;
alter table public.vessel_members      enable row level security;
alter table public.crew_members        enable row level security;
alter table public.watch_templates     enable row level security;
alter table public.schedule_runs       enable row level security;
alter table public.schedule_assignments enable row level security;
alter table public.crew_availability   enable row level security;
alter table public.charter_pauses      enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.export_history      enable row level security;

-- profiles: users read/update only their own row. Inserts are handled by the
-- handle_new_user() SECURITY DEFINER trigger.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- subscriptions: users read their own subscription.
-- The insert/update policies support the DEVELOPMENT-ONLY "mark as paid" flow.
-- TODO(stripe): in production, restrict writes to a Stripe webhook running with
-- the service_role key and remove the client insert/update policies below.
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select using (user_id = auth.uid());
drop policy if exists subscriptions_insert_own on public.subscriptions;
create policy subscriptions_insert_own on public.subscriptions
  for insert with check (user_id = auth.uid());
drop policy if exists subscriptions_update_own on public.subscriptions;
create policy subscriptions_update_own on public.subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- vessels: owner has full control; any member can read.
drop policy if exists vessels_select_member on public.vessels;
create policy vessels_select_member on public.vessels
  for select using (public.is_vessel_member(id));
drop policy if exists vessels_insert_owner on public.vessels;
create policy vessels_insert_owner on public.vessels
  for insert with check (owner_id = auth.uid());
drop policy if exists vessels_update_owner on public.vessels;
create policy vessels_update_owner on public.vessels
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists vessels_delete_owner on public.vessels;
create policy vessels_delete_owner on public.vessels
  for delete using (owner_id = auth.uid());

-- vessel_members: members can see the crew of vessels they belong to; admins
-- (owner / captain_admin) manage membership.
drop policy if exists vessel_members_select on public.vessel_members;
create policy vessel_members_select on public.vessel_members
  for select using (public.is_vessel_member(vessel_id));
drop policy if exists vessel_members_admin_all on public.vessel_members;
create policy vessel_members_admin_all on public.vessel_members
  for all using (public.is_vessel_admin(vessel_id))
  with check (public.is_vessel_admin(vessel_id));

-- Vessel-scoped data tables: members can read, admins can manage.
-- TODO: add finer-grained crew_member / viewer policies (e.g. crew see only
-- their own assignments) when those roles are introduced.
do $$
declare
  t text;
begin
  foreach t in array array[
    'crew_members','watch_templates','schedule_runs','schedule_assignments',
    'crew_availability','charter_pauses','audit_logs','export_history'
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
