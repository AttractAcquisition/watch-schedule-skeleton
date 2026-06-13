# WatchSchedule Product Roadmap

WatchSchedule is moving toward a Fairness Operating System for superyacht watchkeeping operations.

## Implemented Frontend Foundation

- Daily watch schedule UI on the Dashboard.
- Two-route captain workflow: Dashboard and Settings.
- Crew rota inclusion/exclusion controls.
- Configurable daily watch weighting controls.
- Frontend Fairness Engine utility with:
  - Crew Fairness Score
  - Schedule Fairness Score
  - Fairness Debt
  - Consecutive Duty Risk
  - Rotation Stability Score
  - Most Due To Serve

## Current Technical Constraint

The database and edge functions still store timestamp-based `schedule_assignments`. The frontend collapses those records into daily assignments for display and fairness scoring.

TODO: add true daily assignment persistence, historical fairness snapshots, manual override records, public holiday calendars, and vessel-specific weighting configuration.

## Development Phases

1. MVP scheduling workflow: crew, leave, schedule generation, calendar, publishing.
2. Fairness Engine: crew score, schedule score, fairness debt, most due to serve.
3. Fairness Correction Loop: historical learning and future optimisation.
4. Explainability: schedule explanations, manual override impact, schedule health.
5. AI layer: natural-language schedule queries, what-if scenarios, recommendations.
6. Predictive intelligence: fairness alerts, leave forecasting, coverage forecasting.
7. Analytics: fairness timeline, reports, management dashboards.
8. Fleet intelligence: benchmarking, analytics, cross-vessel intelligence.
