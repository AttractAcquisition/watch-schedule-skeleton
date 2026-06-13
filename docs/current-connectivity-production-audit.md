# WatchSchedule Current Connectivity And Production Audit

Audit date: 2026-06-13  
Repo path: `/Users/alex/Downloads/watch-schedule-skeleton-main`

## Executive Summary

The app is a Vite React SPA with a real Supabase browser client, real Supabase Auth, a React Query data layer, local Supabase migrations, and local Supabase Edge Function source. The frontend compiles and builds successfully.

The product is not production-ready yet. The main blockers are Stripe billing, PDF generation, OCR/import, remote Supabase deployment verification, several stale mock/presentational components, missing function config entries, and a few frontend/function response mismatches.

The current deployment target in `.env.local` is a Supabase project URL for project ref `diepraznybnjlwryibod`. The anon key is present locally; it is public browser config, but it should still never be committed. No service-role key is present in the repo.

## Verification Performed

- `npm run lint`: passed with 8 Fast Refresh warnings.
- `npx tsc --noEmit`: passed with no output.
- `npm run build`: passed. Vite reported one chunk-size warning for a 746.53 kB JS bundle.
- `npm run dev -- --host 127.0.0.1 --port 5173`: Vite started and selected `http://127.0.0.1:5174/` because `5173` was already in use.
- HTTP probe to `127.0.0.1:5174` from a separate shell failed even though `lsof` showed Node listening on that port. Treat this as an environment/probe limitation; the production build itself is valid.
- `supabase functions list --project-ref diepraznybnjlwryibod`: failed with Supabase 403 account privilege error. Remote function deployment could not be confirmed from this environment.

## Supabase Links And Configuration

Frontend Supabase wiring:

- `src/lib/supabase.ts` reads:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- `.env.local` points the frontend at Supabase project ref `diepraznybnjlwryibod`.
- `supabase/config.toml` local project id is `watch-schedule`.
- `supabase/config.toml` comments instruct linking remote project ref `diepraznybnjlwryibod`.
- Auth site URL in `supabase/config.toml` is local-only: `http://localhost:5173`.
- Redirect URLs in `supabase/config.toml` are local-only: `http://localhost:5173`.

Production config still needed:

- Set Supabase Auth Site URL to the production domain.
- Add production redirect URLs.
- Confirm email confirmation policy for production.
- Confirm remote DB migrations are applied.
- Confirm all Edge Functions are deployed.
- Rotate any key that has been exposed outside local development logs or committed history.

## Frontend To Backend Flow

The frontend boot path is:

1. `src/main.tsx` creates the React app.
2. `QueryClientProvider` provides React Query.
3. `BrowserRouter` provides routing.
4. `AuthProvider` in `src/lib/auth.tsx` loads Supabase session and app state.
5. `App.tsx` routes users based on auth/payment/onboarding gates.

Auth state loaded by `AuthProvider`:

- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange(...)`
- `profiles` row for current user.
- Latest `subscriptions` row for current user.
- First `vessels` row owned by current user.

Routing gates:

- Logged out: `/login`
- Logged in but unpaid: `/payment-required`
- Paid but onboarding incomplete: `/onboarding`
- Paid and onboarding complete: `/dashboard`

Current routed screens:

- `/login`: login form.
- `/signup`: signup form.
- `/payment-required`: paywall with dev-only activation in dev builds.
- `/payment-success`: refreshes app state after payment return.
- `/onboarding`: protected onboarding flow.
- `/dashboard`: protected main app view.
- `/settings`: protected settings/workbench view.
- `/crew`: redirects to `/settings#crew-database`.
- `/watch-builder`: redirects to `/settings#regeneration`.
- `/calendar`: redirects to `/dashboard`.
- `/fairness`: redirects to `/dashboard`.
- `/charter-mode`: redirects to `/settings#charter-mode-settings`.
- `/leave`: redirects to `/settings#crew-database`.
- `/reports`: redirects to `/dashboard`.

Important stale documentation note: `BACKEND_INTEGRATION.md` says old standalone pages such as `/crew`, `/watch-builder`, `/leave`, `/fairness`, and `/reports` are wired as direct pages. In current `App.tsx`, those routes redirect.

## Data Access Layer

Frontend DB wrappers live in `src/lib/api/index.ts`.

Tables used directly from the frontend:

- `profiles`
- `subscriptions`
- `vessels`
- `vessel_members`
- `crew_members`
- `watch_templates`
- `schedule_runs`
- `schedule_assignments`
- `watch_settings`
- `crew_availability`
- `leave_requests`
- `charter_pauses`
- `export_history`
- `crew_fairness_scores`
- `schedule_health_scores`
- `schedule_explanations`
- `manual_overrides`

React Query hooks live in `src/hooks/data.ts` and bind those wrappers to the current vessel id.

Edge Function wrappers live in `src/lib/edgeFunctions.ts`:

- `generateSchedule(...)` invokes `generate-schedule`.
- `regenerateSchedule(...)` invokes `regenerate-schedule`.
- `activateCharterMode(...)`, `resumeCharterMode(...)`, `cancelCharterMode(...)` invoke `charter-mode`.
- `exportSchedule(...)` invokes `export-schedule`.
- `calculateFairness(...)` invokes `calculate-fairness`.
- `calculateLeaveImpact(...)` invokes `leave-impact`.

## Supabase Tables In Local Migrations

Initial schema:

- `profiles`: user profile row keyed to `auth.users`.
- `subscriptions`: plan/status plus Stripe customer/subscription ids.
- `vessels`: vessel owner, plan, watch mode, onboarding status.
- `vessel_members`: vessel user roles.
- `crew_members`: vessel crew, eligibility, status, roles.
- `watch_templates`: watch mode and JSON rule/template blocks.
- `schedule_runs`: generated schedule window, status, fairness summary, warnings.
- `schedule_assignments`: crew assignments for schedule runs.
- `crew_availability`: leave/unavailability style records.
- `charter_pauses`: charter pause windows and resume metadata.
- `audit_logs`: vessel-scoped audit trail.
- `export_history`: export request/history records.

Fairness OS additive schema:

- Adds rank/lifecycle/rotational fields to `crew_members`.
- Adds version/publish/lock/approval fields to `schedule_runs`.
- Adds assignment date/duty weighting fields to `schedule_assignments`.
- `watch_settings`: duty weights and rules JSON.
- `crew_fairness_scores`: per-crew calculated fairness history.
- `manual_overrides`: schedule override audit/fairness impact.
- `schedule_explanations`: generated assignment explanations.
- `schedule_health_scores`: coverage, resource, override, and health scores.
- `leave_requests`: requested/approved/rejected leave workflow with impact score.

No Supabase Storage buckets are defined in local migrations.

## Auth And RLS

Auth:

- Email/password auth is used through Supabase Auth.
- `signUp` sends metadata:
  - `full_name`
  - `intended_plan`
- `handle_new_user()` trigger creates:
  - `profiles` row
  - inactive `subscriptions` row

Local auth config:

- Signup enabled.
- Email confirmations disabled for local/dev.
- JWT expiry is `3600`.

RLS:

- RLS is enabled on all application tables in migrations.
- `profiles`: users can select/update own row.
- `subscriptions`: users can select own subscription. Insert/update own subscription is currently allowed for dev payment testing.
- `vessels`: members can read; owners can insert/update/delete.
- `vessel_members`: members can read; admins can manage.
- Vessel-scoped data tables: members can read; admins can manage.
- Helper functions:
  - `is_vessel_member(p_vessel_id)`
  - `is_vessel_admin(p_vessel_id)`

Production RLS hardening needed:

- Remove client-side subscription insert/update policies once Stripe webhooks own billing status.
- Add finer-grained policies for `officer`, `department_head`, `crew_member`, and `viewer`.
- Decide whether crew users can see only their assignments and leave records.
- Add service-role-only paths for trusted billing/webhook/admin operations.

## Edge Functions Audit

Shared behavior:

- `supabase/functions/_shared/client.ts` creates a Supabase client using `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the caller `Authorization` header.
- Functions rely on the caller JWT and RLS.
- `requireUser(...)` requires a valid user session.
- `assertVesselAccess(...)` checks the caller can read the vessel.

Configured in `supabase/config.toml`:

- `generate-schedule`
- `regenerate-schedule`
- `charter-mode`
- `export-schedule`

Present in source but missing from `supabase/config.toml`:

- `calculate-fairness`
- `leave-impact`

Functions:

- `generate-schedule`: loads crew, availability, leave requests, charter pauses, watch settings, historical fairness; generates daily assignments; writes `schedule_runs`, `schedule_assignments`, `crew_fairness_scores`, `schedule_health_scores`, `schedule_explanations`, and `audit_logs`.
- `regenerate-schedule`: loads an existing run and replaces assignments/fairness/health/explanations. `affected_only` currently regenerates the full run and reports previous assignment ids.
- `charter-mode`: activates, resumes, or cancels charter pauses; updates related schedule status; writes audit logs.
- `export-schedule`: records an `export_history` row. PDF generation is a placeholder and `file_url` remains `null`.
- `calculate-fairness`: calculates current fairness from existing assignments and returns a summary. It does not persist results.
- `leave-impact`: forecasts leave impact from affected assignments and available crew. It does not persist a `leave_requests` row by itself.

Function/client mismatches:

- `src/lib/edgeFunctions.ts` declares `CalculateFairnessResult` with fields like `average_crew_fairness_score`, `lowest_fairness_score`, `rotation_stability_score`, and `schedule_health_score`, but `calculate-fairness/index.ts` actually returns `per_crew`, `schedule_fairness_score`, `highest_fairness_debt`, `most_due_to_serve`, and `alerts`.
- `src/lib/edgeFunctions.ts` declares `LeaveImpactResult` with `warnings` and `forecast_result`, but `leave-impact/index.ts` returns `duties_requiring_reassignment`, `staffing_gaps`, `fairness_impact`, and `resource_constraint_warnings`.
- These mismatches can cause UI assumptions to drift even though TypeScript passes, because `functions.invoke` is cast to the declared type.

## Scheduling Engine

The backend scheduling engine is in `supabase/functions/_shared/scheduler.ts`.

Current behavior:

- Product model is one watchkeeper per full day.
- Legacy `watch_start` and `watch_end` timestamp columns are still populated.
- `assignment_date`, `duty_type`, and `duty_weight` are used for daily schedule/fairness.
- Eligibility filters:
  - `watch_eligible = true`
  - `status = active`
  - not archived/leaver
  - not blocked by availability/leave
  - not blocked by active/draft full charter pause
- Fairness weighting includes weekday, Friday, weekend, Christmas/New Year dates.

Production gaps:

- Public holiday calculation is placeholder-level; vessel country/region holiday calendars are not implemented.
- The `watch_mode` input does not materially change scheduling depth; current generator still produces one daily watch assignment.
- Department/role coverage rules are not yet enforced as true constraints.
- Conflict resolution and partial regeneration are still simple full-run replacement.

## Current Placeholders, Stubs, Mocks, And TODOs

Functional placeholders and blockers:

| Area | File(s) | Current state | Production requirement |
| --- | --- | --- | --- |
| Stripe checkout | `src/pages/PaymentRequired.tsx`, `src/components/DevSubscriptionPanel.tsx`, `src/lib/api/index.ts`, RLS migration comments | No real checkout/customer portal/webhook. Dev panel flips subscription active in dev. | Add Stripe Checkout, customer portal, webhook Edge Function, signed event verification, subscription reconciliation, remove client subscription writes. |
| PDF generation | `supabase/functions/export-schedule/index.ts`, `src/components/reports/ExportCard.tsx`, `src/pages/ReportsExport.tsx` | Export row is recorded, `file_url` is `null`, preview is mock. | Generate PDF, store in Supabase Storage, return signed/public URL, support versioning and templates. |
| OCR crew import | `src/components/crew/CrewImportMockup.tsx`, `src/lib/supabasePlaceholder.ts`, `src/components/onboarding/CrewImportStep.tsx` | Upload/extract functions are development-only placeholders and return no real extracted crew. | Add upload storage bucket, OCR/parser Edge Function, review UI, validation, crew upsert. |
| Legacy mock dataset | `src/lib/mockData.ts` and imports listed below | Some presentational components still render mock data. | Replace all mock imports with React Query/live props or remove unused pages/components. |
| Public holidays | `src/lib/fairnessEngine.ts`, backend scheduler | Fixed Christmas/New Year handling; public holiday calendar not implemented. | Store vessel operating region/country and compute public holidays. |
| Daily schedule compatibility | `src/lib/dailySchedule.ts` | Collapses legacy hourly rows to one daily assignment if needed. | Complete migration to true daily assignments everywhere; remove fallback. |
| Partial regeneration | `supabase/functions/regenerate-schedule/index.ts` | `affected_only` currently performs a full regenerate. | Implement scoped diff/regeneration and preserve stable assignments where possible. |
| Edge function deployment config | `supabase/config.toml` | Missing `calculate-fairness` and `leave-impact` function config entries. | Add config entries and deploy/verify all functions. |
| Generated DB types | `src/lib/database.types.ts` | Hand-authored types. | Regenerate from remote Supabase after migrations are applied. |
| Role permissions | RLS migration TODOs | Broad member-read/admin-write policies. | Add role-specific policy matrix. |

Files importing `src/lib/mockData.ts`:

- `src/components/reports/PdfPreviewMock.tsx`
- `src/components/fairness/FairnessBreakdown.tsx`
- `src/components/leave/LeaveTable.tsx`
- `src/components/schedule/ScheduleGrid.tsx`
- `src/components/dashboard/CharterStatusCard.tsx`
- `src/components/dashboard/FairnessScoreCard.tsx`
- `src/components/dashboard/SchedulePreview.tsx`
- `src/components/charter/CharterTimeline.tsx`
- `src/components/fairness/FairnessExplanation.tsx`

Development-only placeholder module:

- `src/lib/supabasePlaceholder.ts`
  - `mockSaveCrewDatabase`
  - `mockUploadCrewList`
  - `mockExtractCrewFromPhoto`
  - exported as `saveCrewMembers`, `uploadCrewListPhoto`, `extractCrewFromPhoto`

Standalone page files that exist but are not directly routed as pages:

- `src/pages/CrewDatabase.tsx`
- `src/pages/WatchBuilder.tsx`
- `src/pages/ScheduleCalendar.tsx`
- `src/pages/FairnessEngine.tsx`
- `src/pages/LeaveManagement.tsx`
- `src/pages/CharterMode.tsx`
- `src/pages/ReportsExport.tsx`

User-facing form placeholder text exists throughout the UI, for example input placeholders in onboarding, settings, crew, auth, and leave forms. These are normal UI placeholders, not backend stubs.

## Secrets And API Keys Required

Currently present/used:

- `VITE_SUPABASE_URL`: required by browser app.
- `VITE_SUPABASE_ANON_KEY`: required by browser app. Public anon key, but still should not be casually shared or committed.
- Supabase Edge runtime automatically provides:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

Required for production:

- Supabase project access token for CLI/deploy workflow.
- Supabase database password or linked project for migrations.
- Supabase service role key only inside trusted server/Edge Function secrets when needed for:
  - Stripe webhook subscription writes.
  - privileged maintenance tasks.
  - server-side storage signing if RLS cannot handle the flow.
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - price ids for `solo_watch`, `dual_watch`, `triple_watch`
  - optional customer portal configuration id
- PDF rendering:
  - No external key if using a Deno-compatible PDF library.
  - API key if using an external renderer/browser service.
- OCR/import:
  - OCR provider key if using Google Vision, AWS Textract, Azure Document Intelligence, OpenAI, or another external parser.
  - Storage bucket config for crew import files.
- Email/domain:
  - Supabase Auth email provider/SMTP settings for production deliverability.
  - Production app domain for Auth redirect allowlist.
- Observability:
  - Error tracking DSN/API key if using Sentry or similar.
  - Analytics key if used.

Never expose these in `VITE_*` variables:

- Supabase service role key.
- Stripe secret key.
- Stripe webhook secret.
- OCR provider keys.
- PDF provider keys.

## Production Readiness Plan

Phase 1: Lock down and verify Supabase

- Link the Supabase CLI to project `diepraznybnjlwryibod`.
- Run `supabase db push`.
- Add `calculate-fairness` and `leave-impact` to `supabase/config.toml`.
- Deploy all functions:
  - `generate-schedule`
  - `regenerate-schedule`
  - `charter-mode`
  - `export-schedule`
  - `calculate-fairness`
  - `leave-impact`
- Regenerate `src/lib/database.types.ts` from the remote schema.
- Verify auth redirect URLs and email confirmation settings.
- Run smoke tests with a real test user.

Phase 2: Remove payment stub

- Implement Stripe Checkout session creation in a server/Edge Function.
- Implement Stripe webhook with signature verification.
- Store Stripe customer/subscription ids and authoritative status in `subscriptions`.
- Remove or disable `DevSubscriptionPanel` for non-local builds.
- Remove client insert/update RLS policies on `subscriptions`.
- Add customer portal flow.

Phase 3: Replace mock UI and stale routes

- Decide whether standalone pages should be restored or deleted.
- Replace every `mockData` import with live data props/hooks.
- Remove `supabasePlaceholder.ts` from production flows.
- Update `BACKEND_INTEGRATION.md` to match current routing.
- Add empty/loading/error states for all live data areas.

Phase 4: Complete operational features

- Implement real PDF generation and Supabase Storage export files.
- Implement crew import upload, OCR, review, validation, and bulk insert/upsert.
- Implement region-aware public holidays.
- Make `watch_mode`, departments, eligible roles, and coverage rules real scheduling constraints.
- Implement real `affected_only` regeneration.
- Persist manual override actions into `manual_overrides`.
- Connect schedule explanation rows to actual assignments where possible.

Phase 5: Production hardening

- Define a role-permission matrix and update RLS.
- Add function-level validation schemas.
- Add integration tests for auth, onboarding, crew CRUD, schedule generation, leave, charter, export, and billing.
- Add monitoring/logging for Edge Functions.
- Add backup and migration rollback strategy.
- Add code splitting to reduce the JS bundle warning.
- Add CI checks for lint, typecheck, build, and tests.

## Immediate Next Actions

1. Get Supabase project owner/admin access for `diepraznybnjlwryibod`; current CLI account cannot list functions.
2. Deploy and verify migrations/functions.
3. Fix `calculate-fairness` and `leave-impact` response types.
4. Remove mock imports from routed dashboard/settings flows.
5. Implement Stripe webhook-backed billing before any real production launch.
