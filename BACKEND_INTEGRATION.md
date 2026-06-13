# Backend Integration — Watch Schedule

How the front-end is wired to Supabase, what is real, and what is still a
placeholder.

## Architecture

```
src/lib/supabase.ts        # Supabase browser client (env-driven, throws if unset)
src/lib/auth.tsx           # AuthProvider + useAuth (session, profile, subscription, vessel, gates)
src/lib/api/               # Data access layer (typed query/mutation wrappers + row→UI mappers)
src/lib/edgeFunctions.ts   # supabase.functions.invoke wrappers
src/hooks/data.ts          # react-query hooks bound to the current vessel
src/lib/database.types.ts  # Hand-authored row interfaces
supabase/migrations/       # Schema + triggers + RLS
supabase/functions/        # Deno Edge Functions
```

## Auth & routing gate

`AuthProvider` exposes: `user, session, profile, subscription, vessel,
isLoading, isAuthenticated, isPaid, hasCompletedOnboarding, signIn, signUp,
signOut, refreshAppState`.

Gate (in `ProtectedRoute` and the `/` index redirect):

| State                       | Route               |
| --------------------------- | ------------------- |
| logged out                  | `/login`            |
| logged in, not paid         | `/payment-required` |
| paid, onboarding incomplete | `/onboarding`       |
| paid, onboarding complete   | `/dashboard`        |

- `isPaid` = subscription status is `active` or `trialing`.
- `hasCompletedOnboarding` = `vessels.onboarding_completed = true`.

## What is wired to real Supabase

- **Signup / login / logout** — `supabase.auth.*`. New users get a `profiles`
  row and an `inactive` `subscriptions` row via the `handle_new_user` DB trigger.
- **Onboarding** (`/onboarding`) — writes the vessel, owner `vessel_members`
  row, crew list, a default watch template, and flips `onboarding_completed`.
- **Crew Database** (`/crew`) — full CRUD against `crew_members`, plus the
  watch-eligible toggle.
- **Dashboard** (`/dashboard`) — live vessel, plan, subscription status, crew
  count, latest schedule run, fairness score, charter status, leave conflicts.
- **Watch Builder** (`/watch-builder`) — **Generate Draft** → `generate-schedule`
  Edge Function; **Submit & Confirm** → sets `schedule_runs.status = confirmed`.
- **Leave Management** (`/leave`) — creates `crew_availability` records and calls
  `regenerate-schedule`.
- **Charter Mode** (`/charter-mode`) — Activate / Resume call the `charter-mode`
  Edge Function.
- **Fairness Engine** (`/fairness`) — reads the latest run's `fairness_score`,
  `fairness_summary`, and `warnings`; can regenerate / confirm.
- **Reports & Export** (`/reports`) — **Export PDF** calls `export-schedule`
  (records an `export_history` row); history table reads `export_history`.
- **Settings** (`/settings`) — edits profile + vessel, shows plan/subscription,
  sign out.

## Placeholders (clearly marked in code)

- **Stripe** — _not configured._ `/payment-required` shows the plans but the
  buttons do not start a real checkout. A **Development-only** panel
  (`DevSubscriptionPanel`, hidden in production builds) flips
  `subscriptions.status = 'active'` so you can test the gate. Search the code
  for `TODO(stripe)` for the Checkout / webhook / customer-portal hooks.
- **PDF generation** — `export-schedule` records an export row and returns a
  message; `file_url` is `null`. Search for `TODO(pdf)`.
- **OCR crew import** — the photo-extraction flow in `CrewImportMockup` is still
  a mock (`src/lib/supabasePlaceholder.ts`).
- **Some presentational grids** (ScheduleGrid, FairnessBreakdown per-crew table,
  CharterTimeline, LeaveTable, dashboard preview cards) still render illustrative
  data; the page-level data and all actions around them are live. These are
  flagged with inline comments.

## Edge Functions

| Function              | Purpose                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-schedule`   | Builds a draft schedule (hard + fairness rules), writes `schedule_runs` + `schedule_assignments` + audit log, returns fairness score/summary/warnings |
| `regenerate-schedule` | Re-runs generation for an existing run (`full` or `affected_only`)                                                                                    |
| `charter-mode`        | Activate / resume / cancel a charter pause; freezes & stores the next-up crew member                                                                  |
| `export-schedule`     | Records an `export_history` row (PDF is a placeholder)                                                                                                |

All functions: validate the JWT, verify vessel access (RLS), set CORS headers,
return structured JSON errors.

## Remaining manual steps (deployment)

These could **not** be run from the build environment (no Supabase CLI token /
the target project was not in the MCP connection). Run them yourself:

```bash
supabase login
supabase link --project-ref diepraznybnjlwryibod
supabase db push
supabase functions deploy generate-schedule
supabase functions deploy regenerate-schedule
supabase functions deploy charter-mode
supabase functions deploy export-schedule
```

(Or paste the migration SQL into the Dashboard SQL Editor — see
`SUPABASE_SETUP.md`.)

## Manual test checklist

Run after migrations + functions are deployed and `.env.local` is set:

- [ ] **Signup** with a new email → lands on `/payment-required`
- [ ] **Dev mark-paid** (panel on `/payment-required`) → redirected to `/onboarding`
- [ ] **Onboarding** → enter vessel name, complete → lands on `/dashboard`
- [ ] **Dashboard** shows the vessel name, plan, crew count
- [ ] **Logout** (sidebar / settings) → `/login`
- [ ] **Login** with the same account → back to `/dashboard`
- [ ] **Unpaid route**: a fresh account is blocked at `/payment-required`
- [ ] **Crew**: add a crew member, edit it, toggle eligibility, delete it
- [ ] **Leave**: add a leave record for a crew member
- [ ] **Watch Builder**: Generate Draft → fairness score + warnings appear
- [ ] **Watch Builder**: Submit & Confirm → run status becomes `confirmed`
- [ ] **Charter Mode**: Activate → charter pause created; Resume → completed
- [ ] **Reports**: Export a version → appears in Export history
- [ ] **Settings**: edit profile/vessel and save
