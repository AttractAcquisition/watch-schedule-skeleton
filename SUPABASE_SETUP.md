# Supabase Setup — Watch Schedule

This app uses Supabase for auth, Postgres data, and Edge Functions.

> ⚠️ **Deployment status:** the database migrations and Edge Functions in this
> repo were **authored but not yet pushed** to the target project
> `diepraznybnjlwryibod` — the environment running this code had no Supabase CLI
> auth token and the MCP connection did not include that project. Run the
> commands below yourself to deploy. See `BACKEND_INTEGRATION.md` for the
> exact "remaining manual steps".

## 1. Environment variables

Copy the template and fill in values from **Project Settings → API**:

```bash
cp .env.example .env.local
```

```bash
VITE_SUPABASE_URL=https://diepraznybnjlwryibod.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

- The **anon** key is public client-side config and is safe to ship in the bundle.
- **Never** put the `service_role` key in a `VITE_*` variable — it would be
  exposed to the browser. It belongs only in Edge Function secrets.
- `.env.local` is gitignored.

## 2. Run the app locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## 3. Link the Supabase project

The CLI is not bundled. Install and link it:

```bash
npm install -g supabase           # or: brew install supabase/tap/supabase
supabase login                    # opens browser for an access token
supabase link --project-ref diepraznybnjlwryibod
```

## 4. Push the database migrations

```bash
supabase db push
```

This applies, in order:

| Migration | Contents |
|-----------|----------|
| `20260610000001_initial_schema.sql` | 12 tables (profiles, subscriptions, vessels, vessel_members, crew_members, watch_templates, schedule_runs, schedule_assignments, crew_availability, charter_pauses, audit_logs, export_history) + indexes |
| `20260610000002_functions_triggers.sql` | `set_updated_at` + triggers on 8 tables; `handle_new_user` trigger (profile + inactive subscription); `is_vessel_member` / `is_vessel_admin` RLS helpers |
| `20260610000003_rls_policies.sql` | Enables RLS on all tables and creates owner/member/admin policies |

**Alternative (no CLI):** paste the contents of each migration file, in order,
into the Supabase Dashboard → SQL Editor and run them.

## 5. Deploy the Edge Functions

```bash
supabase functions deploy generate-schedule
supabase functions deploy regenerate-schedule
supabase functions deploy charter-mode
supabase functions deploy export-schedule
```

The functions call the DB with the **caller's JWT**, so Row Level Security
enforces vessel access — no `service_role` key is required. `SUPABASE_URL` and
`SUPABASE_ANON_KEY` are injected automatically by the Edge runtime.

If you later add functionality that must bypass RLS, set a secret instead of
hardcoding it:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

## 6. Auth configuration

In **Authentication → Providers → Email**, email/password is enabled.

- For quick local testing, **disable “Confirm email”** so new signups get an
  immediate session (matches `supabase/config.toml`).
- For production, enable confirmations and set the Site URL / redirect URLs to
  your deployed domain.

## 7. Regenerate typed schema (optional)

```bash
supabase gen types typescript --project-id diepraznybnjlwryibod > src/lib/database.types.ts
```

The app currently uses hand-authored row interfaces in `src/lib/database.types.ts`.
