-- Watch Schedule — functions & triggers

-- updated_at maintenance ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','subscriptions','vessels','crew_members',
    'watch_templates','schedule_runs','crew_availability','charter_pauses'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- New auth user -> profile + inactive subscription ----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan_type, status)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'intended_plan', '')::text,
    'inactive'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership helpers (SECURITY DEFINER so RLS policies can call them without
-- recursing into the same table's policies) -----------------------------------
create or replace function public.is_vessel_member(p_vessel_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.vessels v
    where v.id = p_vessel_id and v.owner_id = auth.uid()
  ) or exists (
    select 1 from public.vessel_members m
    where m.vessel_id = p_vessel_id and m.user_id = auth.uid()
  );
$$;

-- Owner or captain_admin -> can manage vessel data.
-- TODO: extend with finer-grained officer / department_head permissions for
-- schedules vs. crew vs. settings.
create or replace function public.is_vessel_admin(p_vessel_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.vessels v
    where v.id = p_vessel_id and v.owner_id = auth.uid()
  ) or exists (
    select 1 from public.vessel_members m
    where m.vessel_id = p_vessel_id
      and m.user_id = auth.uid()
      and m.role = 'captain_admin'
  );
$$;
