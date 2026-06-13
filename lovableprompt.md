# Lovable Prompt: WatchSchedule V2 Frontend Rebuild

You are working inside the existing WatchSchedule React/Vite application. Rebuild the frontend UX/UI as a V2 application without changing the product features, backend schema, Supabase project, Edge Functions, auth flow, or data contracts.

## Product Context

WatchSchedule is a premium scheduling intelligence platform for superyacht watchkeeping operations. It is not a generic HR tool or startup dashboard. It should feel like a professional bridge tool used by captains and senior crew to run daily watch rotas, fairness scoring, crew availability, charter mode, schedule generation, and operational controls.

The app should feel:

- luxury
- operational
- maritime
- calm
- high-end
- efficient
- captain/operator-focused
- readable in a bridge/office environment

The V2 frontend should improve usability and presentation only. Do not remove or change existing capabilities.

## Absolute Constraints

Do not change the backend.

Do not create new Supabase tables.

Do not change existing Supabase table names, column names, Edge Function names, payload shapes, auth logic, RLS assumptions, or environment variable names.

Do not hardcode Supabase keys.

Do not add service-role keys to frontend code.

Do not reintroduce mock data into production flows.

Do not add old nine-tab navigation.

Do not build marketing pages inside the authenticated application.

Do not change the product feature set. Improve layout, hierarchy, modals, interactions, responsiveness, and usability.

## Current Stack

The app is a Vite React application using:

- React 19
- React Router DOM
- TanStack React Query
- Supabase JS
- Tailwind CSS v4
- Radix UI primitives
- lucide-react icons
- sonner toasts

Main files and contracts to preserve:

- `src/main.tsx`
- `src/App.tsx`
- `src/lib/supabase.ts`
- `src/lib/auth.tsx`
- `src/hooks/data.ts`
- `src/lib/api/index.ts`
- `src/lib/edgeFunctions.ts`
- `src/lib/database.types.ts`
- `src/lib/dailySchedule.ts`
- `src/lib/fairnessEngine.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/PaymentRequired.tsx`

## Existing Backend / Supabase Contracts

Keep Supabase config exactly environment-based:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The browser client lives in `src/lib/supabase.ts`. Keep the same client pattern and auth settings:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`

Keep auth and app-state flow in `src/lib/auth.tsx`:

- `AuthProvider`
- `useAuth`
- `signIn`
- `signUp`
- `signOut`
- `refreshAppState`
- profile loading from `profiles`
- subscription loading from `subscriptions`
- vessel loading from `vessels`
- routing gates:
  - logged out -> `/login`
  - unpaid -> `/payment-required`
  - not onboarded -> `/onboarding`
  - paid/onboarded -> `/dashboard`

Keep current routes in `src/App.tsx`:

- `/`
- `/login`
- `/signup`
- `/payment-required`
- `/payment-success`
- `/onboarding`
- `/dashboard`
- `/settings`
- `/404`

Keep legacy redirects:

- `/crew` -> `/settings#crew-database`
- `/watch-builder` -> `/settings#regeneration`
- `/calendar` -> `/dashboard`
- `/fairness` -> `/dashboard`
- `/charter-mode` -> `/settings#charter-mode-settings`
- `/leave` -> `/settings#crew-database`
- `/reports` -> `/dashboard`

## Database Tables In Use

The frontend must continue to use the existing Supabase tables through the existing API wrappers and hooks:

- `profiles`
- `subscriptions`
- `vessels`
- `vessel_members`
- `crew_members`
- `watch_templates`
- `schedule_runs`
- `schedule_assignments`
- `crew_availability`
- `charter_pauses`
- `audit_logs`
- `export_history`
- `watch_settings`
- `crew_fairness_scores`
- `manual_overrides`
- `schedule_explanations`
- `schedule_health_scores`
- `leave_requests`

Do not rename these tables.

## Important Existing Hooks

Keep and reuse these hooks from `src/hooks/data.ts`:

- `useVesselId`
- `useCrew`
- `useLatestScheduleRun`
- `useAssignments`
- `useLeave`
- `useCharterPauses`
- `useExports`
- `useWatchTemplates`
- `useWatchSettings`
- `useLeaveRequests`
- `useCrewFairnessScores`
- `useScheduleHealth`
- `useScheduleExplanations`
- `useManualOverrides`
- `useInvalidateVesselData`

The V2 UI should compose around these hooks rather than bypassing them.

## Important Existing API Functions

Keep and reuse these wrappers from `src/lib/api/index.ts`:

- `updateProfile`
- `devActivateSubscription`
- `getVesselForUser`
- `updateVessel`
- `completeOnboarding`
- `listCrew`
- `createCrew`
- `updateCrew`
- `archiveCrew`
- `getLatestScheduleRun`
- `listAssignments`
- `confirmScheduleRun`
- `listWatchTemplates`
- `getWatchSettings`
- `upsertWatchSettings`
- `listLeave`
- `createLeave`
- `listLeaveRequests`
- `createLeaveRequest`
- `updateLeaveRequest`
- `listCharterPauses`
- `listExports`
- `listLatestCrewFairnessScores`
- `getLatestScheduleHealth`
- `listScheduleExplanations`
- `listManualOverrides`

Do not create parallel duplicate data layers.

## Edge Functions In Use

Keep and reuse these functions from `src/lib/edgeFunctions.ts`:

- `generateSchedule` -> Supabase Edge Function `generate-schedule`
- `regenerateSchedule` -> Supabase Edge Function `regenerate-schedule`
- `activateCharterMode` -> Supabase Edge Function `charter-mode` with action `activate`
- `resumeCharterMode` -> Supabase Edge Function `charter-mode` with action `resume`
- `cancelCharterMode` -> Supabase Edge Function `charter-mode` with action `cancel`
- `exportSchedule` -> Supabase Edge Function `export-schedule`
- `calculateFairness` -> Supabase Edge Function `calculate-fairness`
- `calculateLeaveImpact` -> Supabase Edge Function `leave-impact`

Do not rename these Edge Functions. Do not change payload fields.

## Current Product Features To Preserve

Dashboard currently includes:

- Vessel name
- Current plan/status
- Charter Mode toggle
- Export Schedule PDF button
- Quick actions:
  - Export Schedule PDF
  - Pause for Charter
  - Edit Crew
- Schedule metrics:
  - Schedule Fairness Score
  - Average Crew Fairness Score
  - Highest Fairness Debt
  - Lowest Fairness Score
  - Rotation Stability Score
  - Schedule Health Score
- Monthly daily-watch calendar
- Weekly toggle/view
- Month navigation limited to current month plus 3 months ahead
- Daily schedule model: one watchkeeper per day
- No hourly watch blocks in Dashboard
- Calendar day cell shows date and assigned crew name only
- Weekend/Friday/Monday visual treatment, but no visible weight labels inside day cells
- Crew fairness list/table
- Alerts and explainability preview
- Link/button to Settings intelligence section
- Empty state:
  - “No schedule generated yet. Configure watch settings and regenerate from Settings.”

Settings currently includes:

- Captain profile
- Vessel settings
- Crew Database:
  - name
  - position
  - rank
  - department
  - watchkeeper eligibility
  - rotational crew
  - relief crew
  - lifecycle status
  - Crew Fairness Score
  - Fairness Debt
  - On rota / Off rota toggle
  - add crew
  - archive crew
- Watch Database / Watch Rules:
  - watch type/name
  - weekday, Monday, Friday, Saturday, Sunday weighting
  - public holiday weighting
  - Christmas Eve, Christmas Day, Boxing Day, New Year’s Eve, New Year’s Day weighting
  - daily watch enabled
  - one person per day
  - single/double/triple watch vessel support
  - weekend mode
  - Monday/Friday/Saturday/Sunday weighted toggles
  - qualification-based assignment
  - availability-aware allocation
  - leave-aware allocation
  - manual override capability
  - avoid repeated Friday/Sunday/holiday allocations
  - avoid consecutive duties
  - preserve established rotations
  - minimise unnecessary changes
  - use Fairness Debt correction
  - prioritise Most Due To Serve
- Charter Mode Settings:
  - pause normal rota
  - freeze rotation order
  - resume with next person
  - count charter days in fairness
  - require captain confirmation
  - auto-resume/manual resume
- Leave Management:
  - add leave request
  - crew member
  - start/end date
  - leave type
  - status
  - notes
  - impact score
  - approve/reject
- Publishing Workflow:
  - captain approval required
  - OOW approval required
  - schedule locking
  - version history
  - audit trail
  - manual override tracking
  - latest schedule status
  - schedule version
  - recent exports count
- Fairness Engine Settings:
  - Crew Fairness Score threshold
  - Schedule Fairness Score target
  - Fairness Debt correction strength
  - consecutive duty penalty
  - repeated Friday penalty
  - repeated Sunday penalty
  - repeated holiday penalty
  - minimum Schedule Health Score
  - rotation stability score
  - schedule health score
  - manual overrides count
- Explainability & Intelligence:
  - generate schedule explanations
  - track override fairness impact
  - store AI recommendations
  - Ask the Schedule enabled
  - what-if scenario tracking
  - fairness alerts
  - stored explanations count
  - future AI features must remain clearly disabled/future-facing if not backed by real AI
- Save controls:
  - Save Settings Only
  - Save All & Regenerate Schedule

Onboarding currently includes:

- Protected onboarding route
- Vessel name
- timezone
- plan-derived watch mode
- setup steps
- `completeOnboarding` writes vessel, membership, optional crew, default watch template, and marks onboarding complete

Payment currently includes:

- Plan selection UI
- Stripe placeholder messaging
- development-only subscription activation panel

Keep these flows intact.

## V2 UX Direction

The current sidebar layout is not ideal because the app only has two primary tabs: Dashboard and Settings. Replace the sidebar-first shell with a cleaner V2 application shell.

Do not use a persistent left sidebar for the main two-tab navigation.

Preferred V2 navigation:

- Top command bar / bridge header
- Vessel name and plan visible in header
- Two primary tabs as a segmented control:
  - Dashboard
  - Settings
- User/account menu in top right
- Charter Mode status/toggle visible on Dashboard only, not as a global complex panel
- Export Schedule PDF action visible on Dashboard
- On mobile, use a bottom tab bar or compact top segmented control, not a slide-out sidebar

The shell should make the app feel lighter and more focused.

Suggested layout:

- Header row:
  - WatchSchedule wordmark
  - vessel name
  - plan badge
  - Dashboard/Settings segmented nav
  - account menu
- Main content:
  - max-width content on large screens
  - dashboard calendar should feel central and large
  - settings should use grouped workspaces and modal/drawer editing instead of one endless technical table

## Dashboard V2 Requirements

Dashboard should become a more polished captain operating view.

Keep all existing data and actions, but improve hierarchy:

1. Top operating strip
   - Vessel name
   - plan/status
   - normal rotation / charter mode status
   - charter toggle
   - export schedule button

2. Primary calendar area
   - Calendar should be the main visual focus
   - Monthly view is default
   - Weekly view remains available as a segmented toggle
   - Previous/next controls remain limited to current month through 3 months ahead
   - Each day shows:
     - date number
     - one crew member name only
   - Do not show position, watch role, or hourly time blocks
   - Weekend days should be subtly different
   - Monday and Friday should be subtly transition-weighted visually
   - Do not display labels like “Monday weight”, “Friday weight”, or “Weekend weight” inside day cells

3. Quick actions
   - Keep:
     - Export Schedule PDF
     - Pause for Charter
     - Edit Crew
   - Make them compact and operational, not large marketing cards
   - Edit Crew should open Settings focused on Crew Database, or open a V2 crew-management modal/drawer that uses the same `createCrew`, `updateCrew`, `archiveCrew` backend paths

4. Metrics
   - Keep all six metrics
   - Display as compact bridge-style instruments or status tiles
   - Avoid clutter; use visual grouping and progressive disclosure

5. Fairness and alerts
   - Keep crew fairness rows and alerts/explainability preview
   - Consider putting details into a right-side drawer, popover, or expandable panel
   - Dashboard should remain readable and not become a dense settings screen

6. Empty states
   - Preserve clear empty states for no crew, no schedule, no fairness history, no alerts

## Settings V2 Requirements

Settings is currently a long, dense vertical page. Improve usability without removing features.

Recommended V2 approach:

- Settings page uses internal sections or tabs:
  - Vessel
  - Crew
  - Leave
  - Watch Rules
  - Charter
  - Fairness
  - Publishing
  - Intelligence
- Use cards, accordions, modal dialogs, or drawers for editing details.
- Avoid making one enormous table with all crew fields visible at once on smaller screens.
- Keep quick scanning: each section should show a summary first, then edit controls.

Specific Settings UX improvements:

1. Crew Database
   - Show a readable crew list/table with key columns:
     - name
     - department
     - rank/position
     - on/off rota
     - fairness score
     - fairness debt
   - Put advanced fields inside an edit drawer/modal:
     - position
     - rank
     - department
     - watch eligibility
     - rotational
     - relief
     - lifecycle status
     - notes if available
   - Add crew should open a modal/drawer, not insert a confusing placeholder row unless the user confirms.
   - Archive should require a light confirmation dialog.

2. Leave Management
   - Add leave should be a modal/drawer.
   - Existing leave requests should be easy to scan.
   - Preserve approve/reject actions.
   - Preserve leave impact calculation via `calculateLeaveImpact`.

3. Watch Rules
   - Group daily watch basics, duty weights, weekend mode, and rotation protections.
   - Use numeric inputs with clear labels.
   - Use compact toggles and segmented controls.
   - Preserve all fields saved into `watch_settings`.

4. Charter Mode Settings
   - Show as a simple rules group.
   - Preserve all toggles.
   - Keep dashboard charter toggle separate from settings rules.

5. Publishing Workflow
   - Keep current toggles and status summaries.
   - Present latest schedule/version/export count clearly.

6. Fairness Engine
   - Keep threshold and penalty controls.
   - Make values feel like controls on a professional system, not generic form fields.

7. Explainability & Intelligence
   - Keep all toggles.
   - Clearly mark future AI capabilities as disabled/future-facing unless backed by real backend.

8. Save/regenerate
   - Keep sticky save bar at bottom or floating command bar:
     - Save Settings Only
     - Save All & Regenerate Schedule
   - Show loading and success/error states with toasts.
   - Do not move regeneration to Dashboard.

## Brand Palette: Locked

Do not change the brand palette.

Use these exact colors as the core palette:

- Navy: `#0B1420`
- Steel: `#1A2433`
- Gold: `#C8A46B`
- Off White: `#F7F5F1`
- Slate: `#8A94A6`
- Sea Green: `#4E8D74`

Current CSS tokens in `src/styles.css` already define:

- `--brand-navy`
- `--brand-steel`
- `--brand-gold`
- `--brand-off-white`
- `--brand-slate`
- `--brand-sea-green`
- `--background`
- `--foreground`
- `--surface`
- `--primary`
- `--success`
- `--warning`

Preserve these tokens and refine usage around them.

Do not introduce bright SaaS colors.

Do not use purple, blue-purple gradients, bright green, neon, orange-heavy, beige-heavy, or generic startup palettes.

Gold should be the premium accent for:

- primary buttons
- selected tab state
- key active states
- important metrics
- subtle focus states

Sea green should be used only for:

- healthy fairness
- approved/active status
- rotation intact

Slate should be used for secondary text and metadata.

Steel should be used for surfaces.

Navy should remain the main background.

## Typography

Keep typography premium and utilitarian:

- Headings: Inter Tight or Manrope
- Body: Inter
- Avoid Montserrat, Poppins, Roboto
- No negative letter spacing
- No viewport-scaled font sizes
- Avoid oversized marketing hero typography inside the authenticated app

## Component/UI Direction

Use existing Radix/shadcn-style primitives where possible.

Use lucide-react icons for tool buttons.

Build:

- segmented controls for Dashboard/Settings and Month/Week
- dialogs/drawers for edit flows
- compact status badges
- high-quality toggles
- professional hover states
- keyboard-accessible controls
- sticky/floating save actions in Settings
- responsive tables/cards that do not overflow on mobile

Do not use:

- cartoon icons
- generic HR dashboard patterns
- oversized decorative cards
- nested cards inside cards
- decorative gradient blobs/orbs
- marketing hero layouts inside the app

## Responsive Behavior

Desktop:

- Dashboard calendar should dominate.
- Metrics and fairness/alerts can sit in side panels or below the calendar depending on width.
- No persistent sidebar.
- Header/segmented nav should be compact and stable.

Tablet:

- Calendar appears before fairness details.
- Settings sections should become stacked but not overwhelming.
- Use accordions/drawers.

Mobile:

- Use a bottom tab bar or compact top segmented nav for Dashboard/Settings.
- Calendar remains readable.
- Avoid horizontal scroll where possible.
- Crew and leave editing should use full-screen drawer/dialog patterns.
- Sticky save bar in Settings should remain accessible.

## Data Rules

All production UI data must come from existing Supabase hooks/API wrappers.

Do not import from `src/lib/mockData.ts` in live routes.

Do not display fake crew/vessel/schedule data.

Use empty states instead.

Production routes that must stay live-data only:

- `/dashboard`
- `/settings`
- `/onboarding`
- `/payment-required`
- `/login`
- `/signup`

## Calendar Rules

The watch schedule is daily.

One person is assigned to one full day.

Do not show:

- hourly watch blocks
- time ranges
- watch position/role inside calendar cells
- crew position inside calendar cells

Calendar cells should show:

- date number
- assigned crew member name

If no assignment exists:

- show “Unassigned”
- if no schedule exists, show:
  - “No schedule generated yet. Configure watch settings and regenerate from Settings.”

Month navigation must be limited to current month plus maximum 3 months ahead.

## Preserve Existing Helper Logic

Reuse or improve without breaking:

- `adaptDailyAssignments`
- `getDayWeightKind`
- `toISODate`
- `addMonths`
- `startOfMonth`
- `monthKey`
- `calculateFairnessEngine`
- `DEFAULT_DUTY_WEIGHTING`

If you refactor these helpers, preserve their exported names or update imports consistently.

## Save / Mutation Rules

Settings save must continue to:

- update profile with `updateProfile`
- update vessel with `updateVessel`
- update crew with `updateCrew`
- persist settings with `upsertWatchSettings`
- create crew with `createCrew`
- archive crew with `archiveCrew`
- create leave with `createLeaveRequest`
- update leave status with `updateLeaveRequest`
- call `calculateLeaveImpact` when adding leave if possible
- invalidate React Query caches with `useInvalidateVesselData`

Regenerate must continue to:

- call `saveSettingsOnly`
- use current month range by default
- call `regenerateSchedule` when a latest run exists
- call `generateSchedule` when there is no run
- call `confirmScheduleRun` after first generation
- navigate back to Dashboard after success

Dashboard export must continue to:

- call `exportSchedule({ schedule_run_id, export_type: "bridge" })`

Dashboard charter toggle must continue to:

- call `activateCharterMode`
- call `resumeCharterMode`
- use current vessel id and latest schedule run id when available

## Payment / Stripe State

Do not pretend Stripe is live.

Keep the current placeholder language that Stripe Checkout is not configured yet.

Keep `DevSubscriptionPanel` clearly development-only.

Do not move development subscription controls into production-looking UI.

## Suggested File-Level Changes

You may modify:

- `src/components/layout/AppShell.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/Sidebar.tsx` (prefer retiring it from AppShell rather than deleting if imports may remain)
- `src/pages/Dashboard.tsx`
- `src/pages/Settings.tsx`
- `src/styles.css`
- shared UI primitives if needed for brand polish
- new presentational components under `src/components/dashboard-v2/`, `src/components/settings-v2/`, or similar

Be careful with:

- `src/lib/supabase.ts`
- `src/lib/auth.tsx`
- `src/hooks/data.ts`
- `src/lib/api/index.ts`
- `src/lib/edgeFunctions.ts`
- `src/lib/database.types.ts`

Only change those data files if required to support a UI refactor, and preserve their public exports.

Do not change:

- Supabase migrations
- Supabase Edge Function names/payloads
- RLS assumptions
- environment variables
- auth gates

## Implementation Quality Bar

After rebuilding the V2 frontend:

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Fix TypeScript, lint, and build errors.

Manual checks:

- logged out user goes to login
- signup works
- payment gate still appears when unpaid
- onboarding still creates vessel and routes to dashboard
- paid/onboarded user lands on dashboard
- only Dashboard and Settings are primary navigation
- no sidebar is used as the main desktop navigation
- Dashboard shows calendar, quick actions, metrics, fairness, alerts, charter toggle, export
- Dashboard calendar shows one name per day, no positions, no hourly blocks
- Settings exposes all existing configuration areas
- Save Settings Only persists to Supabase
- Save All & Regenerate Schedule calls the existing Edge Function wrapper
- Export Schedule PDF calls existing export wrapper
- Charter toggle calls existing charter wrapper
- no mock data appears in production routes

## Final Desired Outcome

Deliver a V2 frontend that keeps WatchSchedule’s existing backend and feature set but feels significantly more premium, simpler, and more usable.

The biggest UX change should be:

- remove the sidebar-first app feeling
- use a two-tab top-level navigation appropriate for Dashboard and Settings only
- use modals/drawers/section navigation to reduce Settings density
- make Dashboard feel like the captain’s daily operating view
- keep the locked navy/bronze/gold maritime brand

The backend must continue to work exactly as it does now.
