-- Watch Schedule — export_history: add storage metadata + schedule-exports bucket.

-- 1. Storage metadata columns for export_history.
alter table public.export_history
  add column if not exists storage_path text,
  add column if not exists file_name    text,
  add column if not exists generated_at timestamptz default now();

-- 2. Private Storage bucket for generated PDFs.
--    Inserts are done by the export-schedule Edge Function via service_role
--    (bypasses RLS). Signed URLs are issued for download — they self-authenticate
--    and do not rely on storage object RLS.
insert into storage.buckets (id, name, public)
values ('schedule-exports', 'schedule-exports', false)
on conflict (id) do nothing;

-- 3. Allow authenticated users to SELECT storage objects directly
--    (defence-in-depth; signed-URL downloads bypass this anyway).
drop policy if exists schedule_exports_authenticated_select on storage.objects;
create policy schedule_exports_authenticated_select
  on storage.objects for select
  to authenticated
  using (bucket_id = 'schedule-exports');
