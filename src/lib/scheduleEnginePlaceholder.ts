// Watch Schedule — schedule engine placeholders.
// TODO: call schedule generation Edge Function.

import { MOCK_SCHEDULE, MOCK_FAIRNESS } from "./mockData";

export async function generateWatchSchedule(_payload: unknown) {
  // TODO: invoke Edge Function generate-watch-schedule
  return { schedule: MOCK_SCHEDULE, fairness: MOCK_FAIRNESS };
}

export async function regenerateAffectedWatches(_payload: unknown) {
  // TODO: invoke Edge Function regenerate-affected-watches
  return { schedule: MOCK_SCHEDULE, fairness: MOCK_FAIRNESS };
}

export async function pauseScheduleForCharter(_payload: unknown) {
  // TODO: update charter_pauses + recompute affected assignments
  return { ok: true };
}

export async function resumeScheduleAfterCharter(_payload: unknown) {
  // TODO: end charter_pause + recompute
  return { ok: true };
}
