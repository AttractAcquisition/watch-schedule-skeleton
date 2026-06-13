-- Watch Schedule — Stripe billing: harden subscription RLS.
-- Removes the client-side insert/update policies on subscriptions.
-- The stripe-webhook Edge Function (service_role) is now the only writer for
-- subscription status/plan. Browsers can still read their own row.

-- Ensure only one active subscription row per user (clean up any dev-created
-- duplicates before adding the unique constraint).
delete from public.subscriptions a
using (
  select user_id, min(created_at) as keep_from
  from public.subscriptions
  group by user_id
  having count(*) > 1
) b
where a.user_id = b.user_id and a.created_at > b.keep_from;

alter table public.subscriptions
  add constraint subscriptions_user_id_unique unique (user_id);

-- Drop the dev-only client write policies.
drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;

-- Read-only access for the authenticated user; all writes go through the
-- stripe-webhook service_role client which bypasses RLS entirely.
-- subscriptions_select_own already exists from the initial RLS migration;
-- re-create it idempotently to be explicit.
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select using (user_id = auth.uid());
