// Watch Schedule — react-query data hooks bound to the current vessel.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  listCrew,
  getLatestScheduleRun,
  listAssignments,
  listLeave,
  listCharterPauses,
  listExports,
  listWatchTemplates,
} from "@/lib/api";

export function useVesselId(): string | null {
  return useAuth().vessel?.id ?? null;
}

export function useCrew() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["crew", vesselId],
    enabled: !!vesselId,
    queryFn: () => listCrew(vesselId!),
  });
}

export function useLatestScheduleRun() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["schedule-run", vesselId],
    enabled: !!vesselId,
    queryFn: () => getLatestScheduleRun(vesselId!),
  });
}

export function useAssignments(scheduleRunId: string | null | undefined) {
  return useQuery({
    queryKey: ["assignments", scheduleRunId],
    enabled: !!scheduleRunId,
    queryFn: () => listAssignments(scheduleRunId!),
  });
}

export function useLeave() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["leave", vesselId],
    enabled: !!vesselId,
    queryFn: () => listLeave(vesselId!),
  });
}

export function useCharterPauses() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["charter", vesselId],
    enabled: !!vesselId,
    queryFn: () => listCharterPauses(vesselId!),
  });
}

export function useExports() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["exports", vesselId],
    enabled: !!vesselId,
    queryFn: () => listExports(vesselId!),
  });
}

export function useWatchTemplates() {
  const vesselId = useVesselId();
  return useQuery({
    queryKey: ["templates", vesselId],
    enabled: !!vesselId,
    queryFn: () => listWatchTemplates(vesselId!),
  });
}

export function useInvalidateVesselData() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["crew"] });
    qc.invalidateQueries({ queryKey: ["schedule-run"] });
    qc.invalidateQueries({ queryKey: ["assignments"] });
    qc.invalidateQueries({ queryKey: ["leave"] });
    qc.invalidateQueries({ queryKey: ["charter"] });
    qc.invalidateQueries({ queryKey: ["exports"] });
    qc.invalidateQueries({ queryKey: ["templates"] });
  };
}
