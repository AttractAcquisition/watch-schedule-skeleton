import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pencil, Plus, RefreshCcw, Save, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { DevSubscriptionPanel } from "@/components/DevSubscriptionPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCrew,
  useCrewFairnessScores,
  useExports,
  useInvalidateVesselData,
  useLeaveRequests,
  useLatestScheduleRun,
  useManualOverrides,
  useScheduleExplanations,
  useScheduleHealth,
  useWatchTemplates,
  useWatchSettings,
} from "@/hooks/data";
import { useAuth } from "@/lib/auth";
import {
  archiveCrew,
  confirmScheduleRun,
  createCrew,
  createLeaveRequest,
  updateCrew,
  updateLeaveRequest,
  updateProfile,
  updateVessel,
  upsertWatchSettings,
} from "@/lib/api";
import { calculateLeaveImpact, generateSchedule, regenerateSchedule } from "@/lib/edgeFunctions";
import { PLAN_LABEL } from "@/lib/constants";
import { addMonths, toISODate, type DailyWatchAssignment } from "@/lib/dailySchedule";
import { calculateFairnessEngine, DEFAULT_DUTY_WEIGHTING } from "@/lib/fairnessEngine";
import type { CrewMemberRow, LeaveRequestRow } from "@/lib/database.types";
import type { Department } from "@/lib/types";
import type { PlanType } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type WeekendMode = "standard" | "heavy" | "friday_sunday" | "saturday_sunday" | "custom";

type SettingsSection =
  | "vessel"
  | "crew-database"
  | "leave-management"
  | "watch-database"
  | "charter-mode-settings"
  | "fairness-engine-settings"
  | "publishing-workflow"
  | "intelligence-settings";

interface CrewDraft {
  fullName: string;
  position: string;
  rank: string;
  department: string;
  watchEligible: boolean;
  isRotational: boolean;
  isRelief: boolean;
  lifecycleStatus: string;
  onRota: boolean;
}

interface LeaveDraft {
  crewMemberId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_TABS: Array<{ id: SettingsSection; label: string }> = [
  { id: "vessel", label: "Vessel" },
  { id: "crew-database", label: "Crew" },
  { id: "leave-management", label: "Leave" },
  { id: "watch-database", label: "Watch Rules" },
  { id: "charter-mode-settings", label: "Charter" },
  { id: "fairness-engine-settings", label: "Fairness" },
  { id: "publishing-workflow", label: "Publishing" },
  { id: "intelligence-settings", label: "Intelligence" },
];

const HASH_TO_SECTION: Record<string, SettingsSection> = {
  "crew-database": "crew-database",
  "leave-management": "leave-management",
  "watch-database": "watch-database",
  "charter-mode-settings": "charter-mode-settings",
  "fairness-engine-settings": "fairness-engine-settings",
  "publishing-workflow": "publishing-workflow",
  "intelligence-settings": "intelligence-settings",
  regeneration: "watch-database",
};

const DEFAULT_CREW_DRAFT: CrewDraft = {
  fullName: "",
  position: "",
  rank: "",
  department: "unassigned",
  watchEligible: true,
  isRotational: true,
  isRelief: false,
  lifecycleStatus: "active",
  onRota: true,
};

const EMPTY_CREW: CrewMemberRow[] = [];
const EMPTY_DAILY_ASSIGNMENTS: DailyWatchAssignment[] = [];

function monthRange() {
  const start = new Date();
  start.setDate(1);
  const end = addMonths(start, 1);
  end.setDate(0);
  return { start: toISODate(start), end: toISODate(end) };
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function SettingSwitch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0">
        <span className="text-sm">{label}</span>
        {description && <div className="text-[11px] text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function NumberSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/35 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </div>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70 border-b border-border pb-2 mb-3">
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, subscription, vessel, refreshAppState } = useAuth();

  const crewQuery = useCrew();
  const templates = useWatchTemplates();
  const latestRun = useLatestScheduleRun();
  const watchSettings = useWatchSettings();
  const leaveRequests = useLeaveRequests();
  const persistedFairness = useCrewFairnessScores();
  const scheduleHealth = useScheduleHealth();
  const explanations = useScheduleExplanations();
  const manualOverrides = useManualOverrides();
  const exportsQuery = useExports();
  const invalidate = useInvalidateVesselData();

  // ── Profile / vessel state
  const [fullName, setFullName] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [timezone, setTimezone] = useState("");

  // ── Crew drafts
  const [crewDrafts, setCrewDrafts] = useState<Record<string, CrewDraft>>({});

  // ── Watch rules state
  const [watchName, setWatchName] = useState("Daily watch");
  const [weekendMode, setWeekendMode] = useState<WeekendMode>("standard");
  const [dailyWatchEnabled, setDailyWatchEnabled] = useState(true);
  const [onePersonPerDay, setOnePersonPerDay] = useState(true);
  const [mondayWeighted, setMondayWeighted] = useState(true);
  const [fridayWeighted, setFridayWeighted] = useState(true);
  const [saturdayWeighted, setSaturdayWeighted] = useState(true);
  const [sundayWeighted, setSundayWeighted] = useState(true);
  const [weekdayWeight, setWeekdayWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.standard_weekday),
  );
  const [fridayWeight, setFridayWeight] = useState(String(DEFAULT_DUTY_WEIGHTING.friday));
  const [mondayWeight, setMondayWeight] = useState(String(DEFAULT_DUTY_WEIGHTING.monday));
  const [saturdayWeight, setSaturdayWeight] = useState(String(DEFAULT_DUTY_WEIGHTING.saturday));
  const [sundayWeight, setSundayWeight] = useState(String(DEFAULT_DUTY_WEIGHTING.sunday));
  const [publicHolidayWeight, setPublicHolidayWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.public_holiday),
  );
  const [christmasEveWeight, setChristmasEveWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.christmas_eve),
  );
  const [christmasDayWeight, setChristmasDayWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.christmas_day),
  );
  const [boxingDayWeight, setBoxingDayWeight] = useState(String(DEFAULT_DUTY_WEIGHTING.boxing_day));
  const [newYearsEveWeight, setNewYearsEveWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.new_years_eve),
  );
  const [newYearsDayWeight, setNewYearsDayWeight] = useState(
    String(DEFAULT_DUTY_WEIGHTING.new_years_day),
  );
  const [watchMode, setWatchMode] = useState("solo");
  const [qualificationBased, setQualificationBased] = useState(true);
  const [availabilityAware, setAvailabilityAware] = useState(true);
  const [leaveAware, setLeaveAware] = useState(true);
  const [manualOverrideEnabled, setManualOverrideEnabled] = useState(true);
  const [avoidRepeatedFriday, setAvoidRepeatedFriday] = useState(true);
  const [avoidRepeatedSunday, setAvoidRepeatedSunday] = useState(true);
  const [avoidRepeatedHoliday, setAvoidRepeatedHoliday] = useState(true);
  const [avoidConsecutiveDuties, setAvoidConsecutiveDuties] = useState(true);
  const [preserveRotation, setPreserveRotation] = useState(true);
  const [minimiseChanges, setMinimiseChanges] = useState(true);
  const [useFairnessDebtCorrection, setUseFairnessDebtCorrection] = useState(true);
  const [prioritiseMostDue, setPrioritiseMostDue] = useState(true);

  // ── Charter rules state
  const [pauseNormalRota, setPauseNormalRota] = useState(true);
  const [freezeRotationOrder, setFreezeRotationOrder] = useState(true);
  const [resumeWithNextPerson, setResumeWithNextPerson] = useState(true);
  const [countCharterDays, setCountCharterDays] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [autoResume, setAutoResume] = useState(false);

  // ── Publishing workflow state
  const [captainApprovalRequired, setCaptainApprovalRequired] = useState(true);
  const [oowApprovalRequired, setOowApprovalRequired] = useState(false);
  const [scheduleLocking, setScheduleLocking] = useState(true);
  const [versionHistory, setVersionHistory] = useState(true);
  const [auditTrail, setAuditTrail] = useState(true);

  // ── Fairness engine state
  const [crewFairnessThreshold, setCrewFairnessThreshold] = useState("85");
  const [scheduleFairnessTarget, setScheduleFairnessTarget] = useState("90");
  const [debtCorrectionStrength, setDebtCorrectionStrength] = useState("0.75");
  const [consecutiveDutyPenalty, setConsecutiveDutyPenalty] = useState("8");
  const [repeatedFridayPenalty, setRepeatedFridayPenalty] = useState("6");
  const [repeatedSundayPenalty, setRepeatedSundayPenalty] = useState("6");
  const [repeatedHolidayPenalty, setRepeatedHolidayPenalty] = useState("10");
  const [minimumHealthScore, setMinimumHealthScore] = useState("85");

  // ── Intelligence state
  const [generateExplanations, setGenerateExplanations] = useState(true);
  const [trackOverrideImpact, setTrackOverrideImpact] = useState(true);
  const [storeAiRecommendations, setStoreAiRecommendations] = useState(false);
  const [askScheduleEnabled, setAskScheduleEnabled] = useState(false);
  const [whatIfTrackingEnabled, setWhatIfTrackingEnabled] = useState(false);
  const [fairnessAlertsEnabled, setFairnessAlertsEnabled] = useState(true);

  // ── Leave draft
  const [leaveDraft, setLeaveDraft] = useState<LeaveDraft>({
    crewMemberId: "",
    startDate: toISODate(new Date()),
    endDate: toISODate(new Date()),
    leaveType: "leave",
    status: "requested",
    notes: "",
  });

  // ── UI / dialog state
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [addCrewOpen, setAddCrewOpen] = useState(false);
  const [addCrewDraft, setAddCrewDraft] = useState<CrewDraft>(DEFAULT_CREW_DRAFT);
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);

  // ── Derived state
  const crew = crewQuery.data ?? EMPTY_CREW;
  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;
  const fairnessEngine = useMemo(
    () => calculateFairnessEngine(crew, EMPTY_DAILY_ASSIGNMENTS),
    [crew],
  );
  const persistedFairnessByCrew = new Map(
    (persistedFairness.data ?? []).map((s) => [s.crew_member_id, s]),
  );
  const fairnessByCrew = new Map(fairnessEngine.crewScores.map((s) => [s.crewMemberId, s.score]));

  const rawHash = location.hash.slice(1);
  const activeSection: SettingsSection = HASH_TO_SECTION[rawHash] ?? "vessel";

  // ── Effects: load from server data
  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setVesselName(vessel?.name ?? "");
    setTimezone(vessel?.timezone ?? "UTC");
  }, [profile, vessel]);

  useEffect(() => {
    const nextDrafts: Record<string, CrewDraft> = {};
    for (const member of crew) {
      nextDrafts[member.id] = {
        fullName: member.full_name,
        position: member.position ?? "",
        rank: member.rank ?? "",
        department: member.department ?? "unassigned",
        watchEligible: member.watch_eligible,
        isRotational: member.is_rotational,
        isRelief: member.is_relief,
        lifecycleStatus: member.crew_lifecycle_status ?? "active",
        onRota: member.status === "active",
      };
    }
    setCrewDrafts(nextDrafts);
  }, [crew]);

  useEffect(() => {
    const settings = watchSettings.data;
    if (!settings) return;

    setWeekendMode((settings.weekend_mode as WeekendMode | null) ?? "standard");
    const dw = (settings.duty_weights ?? {}) as Partial<
      Record<keyof typeof DEFAULT_DUTY_WEIGHTING, number>
    >;
    setWeekdayWeight(String(dw.standard_weekday ?? DEFAULT_DUTY_WEIGHTING.standard_weekday));
    setMondayWeight(String(dw.monday ?? DEFAULT_DUTY_WEIGHTING.monday));
    setFridayWeight(String(dw.friday ?? DEFAULT_DUTY_WEIGHTING.friday));
    setSaturdayWeight(String(dw.saturday ?? DEFAULT_DUTY_WEIGHTING.saturday));
    setSundayWeight(String(dw.sunday ?? DEFAULT_DUTY_WEIGHTING.sunday));
    setPublicHolidayWeight(String(dw.public_holiday ?? DEFAULT_DUTY_WEIGHTING.public_holiday));
    setChristmasEveWeight(String(dw.christmas_eve ?? DEFAULT_DUTY_WEIGHTING.christmas_eve));
    setChristmasDayWeight(String(dw.christmas_day ?? DEFAULT_DUTY_WEIGHTING.christmas_day));
    setBoxingDayWeight(String(dw.boxing_day ?? DEFAULT_DUTY_WEIGHTING.boxing_day));
    setNewYearsEveWeight(String(dw.new_years_eve ?? DEFAULT_DUTY_WEIGHTING.new_years_eve));
    setNewYearsDayWeight(String(dw.new_years_day ?? DEFAULT_DUTY_WEIGHTING.new_years_day));

    const rr = (settings.rotation_rules ?? {}) as Record<string, boolean | string>;
    setDailyWatchEnabled(Boolean(rr.daily_watch_enabled ?? true));
    setOnePersonPerDay(Boolean(rr.one_person_per_day ?? true));
    setWatchMode(String(rr.watch_mode ?? "solo"));
    setQualificationBased(Boolean(rr.qualification_based_assignment ?? true));
    setAvailabilityAware(Boolean(rr.availability_aware_allocation ?? true));
    setLeaveAware(Boolean(rr.leave_aware_allocation ?? true));
    setManualOverrideEnabled(Boolean(rr.manual_override_enabled ?? true));
    setMondayWeighted(Boolean(rr.monday_weighted ?? true));
    setFridayWeighted(Boolean(rr.friday_weighted ?? true));
    setSaturdayWeighted(Boolean(rr.saturday_weighted ?? true));
    setSundayWeighted(Boolean(rr.sunday_weighted ?? true));
    setAvoidRepeatedFriday(Boolean(rr.avoid_repeated_friday ?? true));
    setAvoidRepeatedSunday(Boolean(rr.avoid_repeated_sunday ?? true));
    setAvoidRepeatedHoliday(Boolean(rr.avoid_repeated_holiday ?? true));
    setAvoidConsecutiveDuties(Boolean(rr.avoid_consecutive_duties ?? true));
    setPreserveRotation(Boolean(rr.preserve_established_rotations ?? true));
    setMinimiseChanges(Boolean(rr.minimise_unnecessary_changes ?? true));
    setUseFairnessDebtCorrection(Boolean(rr.use_fairness_debt_correction ?? true));
    setPrioritiseMostDue(Boolean(rr.prioritise_most_due_to_serve ?? true));

    const cr = (settings.charter_rules ?? {}) as Record<string, boolean>;
    setPauseNormalRota(Boolean(cr.pause_normal_rota ?? true));
    setFreezeRotationOrder(Boolean(cr.freeze_rotation_order ?? true));
    setResumeWithNextPerson(Boolean(cr.resume_with_next_person ?? true));
    setCountCharterDays(Boolean(cr.count_charter_days_in_fairness ?? false));
    setRequireConfirmation(Boolean(cr.require_captain_confirmation ?? true));
    setAutoResume(Boolean(cr.auto_resume ?? false));

    const pr = (settings.publishing_rules ?? {}) as Record<string, boolean>;
    setCaptainApprovalRequired(Boolean(pr.captain_approval_required ?? true));
    setOowApprovalRequired(Boolean(pr.oow_approval_required ?? false));
    setScheduleLocking(Boolean(pr.schedule_locking ?? true));
    setVersionHistory(Boolean(pr.version_history ?? true));
    setAuditTrail(Boolean(pr.audit_trail ?? true));

    const fr = (settings.fairness_rules ?? {}) as Record<string, number | string>;
    setCrewFairnessThreshold(String(fr.crew_fairness_threshold ?? 85));
    setScheduleFairnessTarget(String(fr.schedule_fairness_target ?? 90));
    setDebtCorrectionStrength(String(fr.debt_correction_strength ?? 0.75));
    setConsecutiveDutyPenalty(String(fr.consecutive_duty_penalty ?? 8));
    setRepeatedFridayPenalty(String(fr.repeated_friday_penalty ?? 6));
    setRepeatedSundayPenalty(String(fr.repeated_sunday_penalty ?? 6));
    setRepeatedHolidayPenalty(String(fr.repeated_holiday_penalty ?? 10));
    setMinimumHealthScore(String(fr.minimum_health_score ?? 85));

    const ir = (settings.intelligence_rules ?? {}) as Record<string, boolean>;
    setGenerateExplanations(Boolean(ir.generate_schedule_explanations ?? true));
    setTrackOverrideImpact(Boolean(ir.track_manual_override_fairness_impact ?? true));
    setStoreAiRecommendations(Boolean(ir.store_ai_recommendations ?? false));
    setAskScheduleEnabled(Boolean(ir.ask_the_schedule_enabled ?? false));
    setWhatIfTrackingEnabled(Boolean(ir.what_if_tracking_enabled ?? false));
    setFairnessAlertsEnabled(Boolean(ir.fairness_alerts_enabled ?? true));
  }, [watchSettings.data]);

  // ── Handlers
  function updateCrewDraft(id: string, patch: Partial<CrewDraft>) {
    setCrewDrafts((drafts) => ({ ...drafts, [id]: { ...drafts[id], ...patch } }));
  }

  async function submitAddCrew() {
    if (!vessel || !addCrewDraft.fullName.trim()) {
      toast.error("Please enter a crew member name.");
      return;
    }
    try {
      await createCrew(vessel.id, {
        full_name: addCrewDraft.fullName.trim(),
        position: addCrewDraft.position || null,
        rank: addCrewDraft.rank || null,
        department: addCrewDraft.department as Department,
        watch_eligible: addCrewDraft.watchEligible && addCrewDraft.onRota,
        is_rotational: addCrewDraft.isRotational,
        is_relief: addCrewDraft.isRelief,
        crew_lifecycle_status:
          addCrewDraft.lifecycleStatus as CrewMemberRow["crew_lifecycle_status"],
        eligible_roles: [],
        status: addCrewDraft.onRota ? "active" : "on_leave",
      });
      invalidate();
      setAddCrewOpen(false);
      setAddCrewDraft(DEFAULT_CREW_DRAFT);
      toast.success("Crew member added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add crew member.");
    }
  }

  async function archiveCrewMember(id: string) {
    try {
      await archiveCrew(id);
      invalidate();
      setArchiveConfirmId(null);
      toast.success("Crew member archived.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive crew member.");
    }
  }

  async function addLeaveRequest() {
    if (!vessel || !leaveDraft.crewMemberId) {
      toast.error("Choose a crew member before adding leave.");
      return;
    }
    try {
      let impactScore = 0;
      let forecastResult: Record<string, unknown> = {};
      try {
        const impact = await calculateLeaveImpact({
          vessel_id: vessel.id,
          crew_member_id: leaveDraft.crewMemberId,
          start_date: leaveDraft.startDate,
          end_date: leaveDraft.endDate,
          leave_type: leaveDraft.leaveType,
        });
        impactScore = Number(impact.impact_score ?? 0);
        forecastResult = impact as unknown as Record<string, unknown>;
      } catch {
        // Leave can still be recorded if the forecasting function is not deployed yet.
      }
      await createLeaveRequest({
        vesselId: vessel.id,
        crewMemberId: leaveDraft.crewMemberId,
        startDate: leaveDraft.startDate,
        endDate: leaveDraft.endDate,
        leaveType: leaveDraft.leaveType as LeaveRequestRow["leave_type"],
        status: leaveDraft.status as LeaveRequestRow["status"],
        impact_score: impactScore,
        forecast_result: forecastResult,
        notes: leaveDraft.notes || undefined,
        requestedBy: user?.id,
      });
      invalidate();
      setAddLeaveOpen(false);
      toast.success("Leave request added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add leave request.");
    }
  }

  async function setLeaveStatus(id: string, status: LeaveRequestRow["status"]) {
    try {
      await updateLeaveRequest(id, {
        status,
        approved_by: status === "approved" ? (user?.id ?? null) : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      });
      invalidate();
      toast.success(`Leave ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update leave request.");
    }
  }

  async function saveSettingsOnly() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: fullName });

      if (vessel) {
        await updateVessel(vessel.id, { name: vesselName, timezone: timezone || "UTC" });
      }

      await Promise.all(
        crew.map((member) => {
          const draft = crewDrafts[member.id];
          if (!draft) return Promise.resolve(member);
          const patch: Partial<CrewMemberRow> = {
            full_name: draft.fullName,
            position: draft.position || null,
            rank: draft.rank || null,
            department: draft.department as Department,
            watch_eligible: draft.watchEligible && draft.onRota,
            is_rotational: draft.isRotational,
            is_relief: draft.isRelief,
            crew_lifecycle_status: draft.lifecycleStatus as CrewMemberRow["crew_lifecycle_status"],
            status: draft.onRota ? "active" : "on_leave",
          };
          return updateCrew(member.id, patch);
        }),
      );

      if (vessel) {
        await upsertWatchSettings(vessel.id, {
          schedule_type: "daily_watch",
          weekend_mode: weekendMode,
          duty_weights: {
            standard_weekday: Number(weekdayWeight),
            monday: Number(mondayWeight),
            friday: Number(fridayWeight),
            saturday: Number(saturdayWeight),
            sunday: Number(sundayWeight),
            public_holiday: Number(publicHolidayWeight),
            christmas_eve: Number(christmasEveWeight),
            christmas_day: Number(christmasDayWeight),
            boxing_day: Number(boxingDayWeight),
            new_years_eve: Number(newYearsEveWeight),
            new_years_day: Number(newYearsDayWeight),
          },
          rotation_rules: {
            watch_name: watchName,
            daily_watch_enabled: dailyWatchEnabled,
            one_person_per_day: onePersonPerDay,
            watch_mode: watchMode,
            qualification_based_assignment: qualificationBased,
            availability_aware_allocation: availabilityAware,
            leave_aware_allocation: leaveAware,
            manual_override_enabled: manualOverrideEnabled,
            monday_weighted: mondayWeighted,
            friday_weighted: fridayWeighted,
            saturday_weighted: saturdayWeighted,
            sunday_weighted: sundayWeighted,
            avoid_repeated_friday: avoidRepeatedFriday,
            avoid_repeated_sunday: avoidRepeatedSunday,
            avoid_repeated_holiday: avoidRepeatedHoliday,
            avoid_consecutive_duties: avoidConsecutiveDuties,
            preserve_established_rotations: preserveRotation,
            minimise_unnecessary_changes: minimiseChanges,
            use_fairness_debt_correction: useFairnessDebtCorrection,
            prioritise_most_due_to_serve: prioritiseMostDue,
          },
          charter_rules: {
            pause_normal_rota: pauseNormalRota,
            freeze_rotation_order: freezeRotationOrder,
            resume_with_next_person: resumeWithNextPerson,
            count_charter_days_in_fairness: countCharterDays,
            require_captain_confirmation: requireConfirmation,
            auto_resume: autoResume,
            manual_resume_required: !autoResume,
          },
          publishing_rules: {
            captain_approval_required: captainApprovalRequired,
            oow_approval_required: oowApprovalRequired,
            schedule_locking: scheduleLocking,
            version_history: versionHistory,
            audit_trail: auditTrail,
          },
          fairness_rules: {
            crew_fairness_threshold: Number(crewFairnessThreshold),
            schedule_fairness_target: Number(scheduleFairnessTarget),
            debt_correction_strength: Number(debtCorrectionStrength),
            consecutive_duty_penalty: Number(consecutiveDutyPenalty),
            repeated_friday_penalty: Number(repeatedFridayPenalty),
            repeated_sunday_penalty: Number(repeatedSundayPenalty),
            repeated_holiday_penalty: Number(repeatedHolidayPenalty),
            minimum_health_score: Number(minimumHealthScore),
          },
          intelligence_rules: {
            generate_schedule_explanations: generateExplanations,
            track_manual_override_fairness_impact: trackOverrideImpact,
            store_ai_recommendations: storeAiRecommendations,
            ask_the_schedule_enabled: askScheduleEnabled,
            what_if_tracking_enabled: whatIfTrackingEnabled,
            fairness_alerts_enabled: fairnessAlertsEnabled,
          },
        });
      }

      await refreshAppState();
      invalidate();
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings.");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndRegenerate() {
    if (!vessel || !user) {
      toast.error("Complete onboarding before generating a schedule.");
      return;
    }
    setRegenerating(true);
    try {
      await saveSettingsOnly();
      const range = monthRange();

      if (latestRun.data?.id) {
        await regenerateSchedule({
          schedule_run_id: latestRun.data.id,
          mode: "full",
          change_context: {
            daily_watch_enabled: dailyWatchEnabled,
            one_person_per_day: onePersonPerDay,
            weekday_weight: Number(weekdayWeight),
            monday_weight: Number(mondayWeight),
            friday_weight: Number(fridayWeight),
            saturday_weight: Number(saturdayWeight),
            sunday_weight: Number(sundayWeight),
            public_holiday_weight: Number(publicHolidayWeight),
            monday_weighted: mondayWeighted,
            friday_weighted: fridayWeighted,
            saturday_weighted: saturdayWeighted,
            sunday_weighted: sundayWeighted,
            weekend_mode: weekendMode,
          },
        });
      } else {
        const result = await generateSchedule({
          vessel_id: vessel.id,
          watch_template_id: templates.data?.[0]?.id,
          start_date: range.start,
          end_date: range.end,
          watch_mode: "solo",
        });
        if (result.schedule_run_id) await confirmScheduleRun(result.schedule_run_id, user.id);
      }

      invalidate();
      toast.success("Settings saved and schedule regenerated.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Schedule regeneration failed.");
    } finally {
      setRegenerating(false);
    }
  }

  // ── Tab navigation helper
  function goTo(section: SettingsSection) {
    navigate(`/settings#${section}`, { replace: true });
  }

  // ── Editing crew member (reads from crewDrafts)
  const editingDraft = editingCrewId ? crewDrafts[editingCrewId] : null;
  const archiveTarget = archiveConfirmId ? crew.find((m) => m.id === archiveConfirmId) : null;

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Rota Control Centre
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold">Settings</h1>
        </div>
        {planType && (
          <Badge
            variant="outline"
            className="w-fit border-border text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {PLAN_LABEL[planType]}
          </Badge>
        )}
      </div>

      {/* Section tab bar */}
      <div className="mb-6 overflow-x-auto">
        <nav className="flex min-w-max gap-1 rounded-lg border border-border bg-background/50 p-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => goTo(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                activeSection === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Section content */}
      <div className="min-h-[480px] space-y-5">
        {/* ── Vessel ── */}
        {activeSection === "vessel" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <SectionLabel>Captain</SectionLabel>
              <div className="mt-4 grid gap-3">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} type="email" disabled />
                </div>
              </div>
            </div>
            <div className="panel p-5">
              <SectionLabel>Vessel</SectionLabel>
              <div className="mt-4 grid gap-3">
                <div className="space-y-1.5">
                  <Label>Vessel name</Label>
                  <Input value={vesselName} onChange={(e) => setVesselName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Crew Database ── */}
        {activeSection === "crew-database" && (
          <div className="panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionLabel>Crew Database</SectionLabel>
                <h2 className="mt-1 font-display text-lg font-semibold">
                  Watchkeeping crew roster
                </h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddCrewOpen(true)}>
                <Plus className="h-4 w-4" /> Add crew member
              </Button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Fairness</TableHead>
                    <TableHead>Debt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crew.map((member) => {
                    const draft = crewDrafts[member.id];
                    const stored = persistedFairnessByCrew.get(member.id);
                    const score =
                      stored?.crew_fairness_score ?? fairnessByCrew.get(member.id) ?? null;
                    const debt = stored?.fairness_debt ?? null;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {draft?.fullName ?? member.full_name}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {draft?.department ?? member.department ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={draft?.onRota ?? member.status === "active"}
                              onCheckedChange={(checked) =>
                                updateCrewDraft(member.id, { onRota: checked })
                              }
                              aria-label={`${member.full_name} rota availability`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {(draft?.onRota ?? member.status === "active") ? "On" : "Off"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {score !== null ? `${score}%` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {debt !== null ? String(debt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCrewId(member.id)}
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:border-destructive/40 hover:bg-destructive/10"
                              onClick={() => setArchiveConfirmId(member.id)}
                            >
                              Archive
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!crew.length && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No crew yet. Add watchkeepers before generating the daily schedule.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── Leave Management ── */}
        {activeSection === "leave-management" && (
          <div className="panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionLabel>Leave Management</SectionLabel>
                <h2 className="mt-1 font-display text-lg font-semibold">Leave-aware rota inputs</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddLeaveOpen(true)}>
                <Plus className="h-4 w-4" /> Add leave request
              </Button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crew member</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(leaveRequests.data ?? []).map((request) => {
                    const member = crew.find((c) => c.id === request.crew_member_id);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {member?.full_name ?? "Crew member"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {request.start_date} – {request.end_date}
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {request.leave_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase tracking-wider",
                              request.status === "approved" &&
                                "border-success/40 bg-success/10 text-success",
                              request.status === "rejected" &&
                                "border-destructive/40 bg-destructive/10 text-destructive",
                            )}
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {request.impact_score ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLeaveStatus(request.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLeaveStatus(request.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!leaveRequests.data?.length && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No leave requests yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── Watch Rules ── */}
        {activeSection === "watch-database" && (
          <div className="space-y-5">
            <div className="panel p-5">
              <SectionLabel>Watch Configuration</SectionLabel>
              <h2 className="mt-1 font-display text-lg font-semibold">Daily watch rules</h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Watch type / name</Label>
                  <Input value={watchName} onChange={(e) => setWatchName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vessel watch support</Label>
                  <Select value={watchMode} onValueChange={setWatchMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Single-watch vessel</SelectItem>
                      <SelectItem value="dual">Double-watch vessel</SelectItem>
                      <SelectItem value="triple">Triple-watch vessel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Weekend mode</Label>
                  <Select
                    value={weekendMode}
                    onValueChange={(v) => setWeekendMode(v as WeekendMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard weekend</SelectItem>
                      <SelectItem value="heavy">Heavy weekend</SelectItem>
                      <SelectItem value="friday_sunday">Friday-Sunday</SelectItem>
                      <SelectItem value="saturday_sunday">Saturday/Sunday only</SelectItem>
                      <SelectItem value="custom">Custom weighting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SettingSwitch
                  label="Daily watch enabled"
                  checked={dailyWatchEnabled}
                  onChange={setDailyWatchEnabled}
                />
                <SettingSwitch
                  label="One person per day"
                  checked={onePersonPerDay}
                  onChange={setOnePersonPerDay}
                />
              </div>
            </div>

            <div className="panel p-5">
              <GroupHeading>Duty Weightings</GroupHeading>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <NumberSetting label="Weekday" value={weekdayWeight} onChange={setWeekdayWeight} />
                <NumberSetting label="Monday" value={mondayWeight} onChange={setMondayWeight} />
                <NumberSetting label="Friday" value={fridayWeight} onChange={setFridayWeight} />
                <NumberSetting
                  label="Saturday"
                  value={saturdayWeight}
                  onChange={setSaturdayWeight}
                />
                <NumberSetting label="Sunday" value={sundayWeight} onChange={setSundayWeight} />
                <NumberSetting
                  label="Public holiday"
                  value={publicHolidayWeight}
                  onChange={setPublicHolidayWeight}
                />
                <NumberSetting
                  label="Christmas Eve"
                  value={christmasEveWeight}
                  onChange={setChristmasEveWeight}
                />
                <NumberSetting
                  label="Christmas Day"
                  value={christmasDayWeight}
                  onChange={setChristmasDayWeight}
                />
                <NumberSetting
                  label="Boxing Day"
                  value={boxingDayWeight}
                  onChange={setBoxingDayWeight}
                />
                <NumberSetting
                  label="New Year's Eve"
                  value={newYearsEveWeight}
                  onChange={setNewYearsEveWeight}
                />
                <NumberSetting
                  label="New Year's Day"
                  value={newYearsDayWeight}
                  onChange={setNewYearsDayWeight}
                />
              </div>
            </div>

            <div className="panel p-5">
              <GroupHeading>Day-Type Weighting Toggles</GroupHeading>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SettingSwitch
                  label="Monday weighted"
                  checked={mondayWeighted}
                  onChange={setMondayWeighted}
                />
                <SettingSwitch
                  label="Friday weighted"
                  checked={fridayWeighted}
                  onChange={setFridayWeighted}
                />
                <SettingSwitch
                  label="Saturday weighted"
                  checked={saturdayWeighted}
                  onChange={setSaturdayWeighted}
                />
                <SettingSwitch
                  label="Sunday weighted"
                  checked={sundayWeighted}
                  onChange={setSundayWeighted}
                />
              </div>
            </div>

            <div className="panel p-5">
              <GroupHeading>Assignment Rules</GroupHeading>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SettingSwitch
                  label="Qualification-based assignment"
                  checked={qualificationBased}
                  onChange={setQualificationBased}
                />
                <SettingSwitch
                  label="Availability-aware allocation"
                  checked={availabilityAware}
                  onChange={setAvailabilityAware}
                />
                <SettingSwitch
                  label="Leave-aware allocation"
                  checked={leaveAware}
                  onChange={setLeaveAware}
                />
                <SettingSwitch
                  label="Manual override capability"
                  checked={manualOverrideEnabled}
                  onChange={setManualOverrideEnabled}
                />
                <SettingSwitch
                  label="Avoid repeated Friday allocations"
                  checked={avoidRepeatedFriday}
                  onChange={setAvoidRepeatedFriday}
                />
                <SettingSwitch
                  label="Avoid repeated Sunday allocations"
                  checked={avoidRepeatedSunday}
                  onChange={setAvoidRepeatedSunday}
                />
                <SettingSwitch
                  label="Avoid repeated holiday allocations"
                  checked={avoidRepeatedHoliday}
                  onChange={setAvoidRepeatedHoliday}
                />
                <SettingSwitch
                  label="Avoid consecutive duties"
                  checked={avoidConsecutiveDuties}
                  onChange={setAvoidConsecutiveDuties}
                />
                <SettingSwitch
                  label="Preserve established rotations"
                  checked={preserveRotation}
                  onChange={setPreserveRotation}
                />
                <SettingSwitch
                  label="Minimise unnecessary changes"
                  checked={minimiseChanges}
                  onChange={setMinimiseChanges}
                />
                <SettingSwitch
                  label="Use Fairness Debt correction"
                  checked={useFairnessDebtCorrection}
                  onChange={setUseFairnessDebtCorrection}
                />
                <SettingSwitch
                  label="Prioritise Most Due To Serve"
                  checked={prioritiseMostDue}
                  onChange={setPrioritiseMostDue}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                These controls persist to Supabase and are used by the schedule generation Edge
                Function when deployed.
              </p>
            </div>
          </div>
        )}

        {/* ── Charter Mode Settings ── */}
        {activeSection === "charter-mode-settings" && (
          <div className="panel p-5">
            <SectionLabel>Charter Mode Settings</SectionLabel>
            <h2 className="mt-1 font-display text-lg font-semibold">Charter behaviour rules</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SettingSwitch
                label="Pause normal rota"
                checked={pauseNormalRota}
                onChange={setPauseNormalRota}
              />
              <SettingSwitch
                label="Freeze rotation order"
                checked={freezeRotationOrder}
                onChange={setFreezeRotationOrder}
              />
              <SettingSwitch
                label="Resume with next person"
                checked={resumeWithNextPerson}
                onChange={setResumeWithNextPerson}
              />
              <SettingSwitch
                label="Count charter days in fairness"
                checked={countCharterDays}
                onChange={setCountCharterDays}
              />
              <SettingSwitch
                label="Require captain confirmation"
                checked={requireConfirmation}
                onChange={setRequireConfirmation}
              />
              <SettingSwitch
                label={autoResume ? "Auto-resume enabled" : "Manual resume required"}
                checked={autoResume}
                onChange={setAutoResume}
              />
            </div>
          </div>
        )}

        {/* ── Fairness Engine ── */}
        {activeSection === "fairness-engine-settings" && (
          <div className="space-y-5">
            <div className="panel p-5">
              <SectionLabel>Fairness Engine</SectionLabel>
              <h2 className="mt-1 font-display text-lg font-semibold">
                Scoring thresholds and correction loop
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <NumberSetting
                  label="Crew Fairness Score threshold"
                  value={crewFairnessThreshold}
                  onChange={setCrewFairnessThreshold}
                />
                <NumberSetting
                  label="Schedule Fairness Score target"
                  value={scheduleFairnessTarget}
                  onChange={setScheduleFairnessTarget}
                />
                <NumberSetting
                  label="Fairness Debt correction strength"
                  value={debtCorrectionStrength}
                  onChange={setDebtCorrectionStrength}
                />
                <NumberSetting
                  label="Consecutive duty penalty"
                  value={consecutiveDutyPenalty}
                  onChange={setConsecutiveDutyPenalty}
                />
                <NumberSetting
                  label="Repeated Friday penalty"
                  value={repeatedFridayPenalty}
                  onChange={setRepeatedFridayPenalty}
                />
                <NumberSetting
                  label="Repeated Sunday penalty"
                  value={repeatedSundayPenalty}
                  onChange={setRepeatedSundayPenalty}
                />
                <NumberSetting
                  label="Repeated holiday penalty"
                  value={repeatedHolidayPenalty}
                  onChange={setRepeatedHolidayPenalty}
                />
                <NumberSetting
                  label="Minimum Schedule Health Score"
                  value={minimumHealthScore}
                  onChange={setMinimumHealthScore}
                />
              </div>
            </div>

            <div className="panel p-5">
              <GroupHeading>Current Fairness Status</GroupHeading>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                  label="Rotation Stability Score"
                  value={`${(scheduleHealth.data?.rotation_stability_score ?? fairnessEngine.rotationStabilityScore) || "—"}%`}
                />
                <InfoTile
                  label="Schedule Health Score"
                  value={`${scheduleHealth.data?.schedule_health_score ?? "—"}%`}
                />
                <InfoTile
                  label="Manual overrides"
                  value={String(manualOverrides.data?.length ?? 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Publishing Workflow ── */}
        {activeSection === "publishing-workflow" && (
          <div className="space-y-5">
            <div className="panel p-5">
              <SectionLabel>Publishing Workflow</SectionLabel>
              <h2 className="mt-1 font-display text-lg font-semibold">
                Versioning, approval, and audit controls
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SettingSwitch
                  label="Captain approval required"
                  checked={captainApprovalRequired}
                  onChange={setCaptainApprovalRequired}
                />
                <SettingSwitch
                  label="OOW approval required"
                  checked={oowApprovalRequired}
                  onChange={setOowApprovalRequired}
                />
                <SettingSwitch
                  label="Schedule locking"
                  checked={scheduleLocking}
                  onChange={setScheduleLocking}
                />
                <SettingSwitch
                  label="Version history"
                  checked={versionHistory}
                  onChange={setVersionHistory}
                />
                <SettingSwitch label="Audit trail" checked={auditTrail} onChange={setAuditTrail} />
                <SettingSwitch
                  label="Manual override tracking"
                  checked={manualOverrideEnabled}
                  onChange={setManualOverrideEnabled}
                />
              </div>
            </div>

            <div className="panel p-5">
              <GroupHeading>Schedule Status</GroupHeading>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile label="Latest schedule" value={latestRun.data?.status ?? "No schedule"} />
                <InfoTile label="Version" value={String(latestRun.data?.version ?? "—")} />
                <InfoTile label="Recent exports" value={String(exportsQuery.data?.length ?? 0)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Intelligence & Explainability ── */}
        {activeSection === "intelligence-settings" && (
          <div className="space-y-5">
            <div className="panel p-5">
              <SectionLabel>Explainability & Intelligence</SectionLabel>
              <h2 className="mt-1 font-display text-lg font-semibold">
                Decision history and future AI layer
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SettingSwitch
                  label="Generate schedule explanations"
                  checked={generateExplanations}
                  onChange={setGenerateExplanations}
                />
                <SettingSwitch
                  label="Track override fairness impact"
                  checked={trackOverrideImpact}
                  onChange={setTrackOverrideImpact}
                />
                <SettingSwitch
                  label="Store AI recommendations"
                  checked={storeAiRecommendations}
                  onChange={setStoreAiRecommendations}
                />
                <SettingSwitch
                  label="Ask the Schedule"
                  checked={askScheduleEnabled}
                  onChange={setAskScheduleEnabled}
                  description="Disabled — requires AI backend"
                />
                <SettingSwitch
                  label="What-if scenario tracking"
                  checked={whatIfTrackingEnabled}
                  onChange={setWhatIfTrackingEnabled}
                  description="Disabled — future capability"
                />
                <SettingSwitch
                  label="Fairness alerts"
                  checked={fairnessAlertsEnabled}
                  onChange={setFairnessAlertsEnabled}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Ask the Schedule and AI recommendations require a real intelligence backend.
                Explanations and alerts are stored as schedule metadata.
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                Stored explanations: {explanations.data?.length ?? 0}
              </div>
            </div>

            <DevSubscriptionPanel />
          </div>
        )}
      </div>

      {/* Spacer for sticky save bar */}
      <div className="h-20 md:h-16" />

      {/* ── Dialogs ── */}

      {/* Crew edit dialog */}
      <Dialog
        open={!!editingCrewId}
        onOpenChange={(open) => {
          if (!open) setEditingCrewId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit crew member</DialogTitle>
          </DialogHeader>
          {editingCrewId && editingDraft && (
            <div className="grid gap-3 pt-1">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={editingDraft.fullName}
                  onChange={(e) => updateCrewDraft(editingCrewId, { fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Input
                    value={editingDraft.position}
                    onChange={(e) => updateCrewDraft(editingCrewId, { position: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rank</Label>
                  <Input
                    value={editingDraft.rank}
                    onChange={(e) => updateCrewDraft(editingCrewId, { rank: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={editingDraft.department}
                  onValueChange={(v) => updateCrewDraft(editingCrewId, { department: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="command">Command</SelectItem>
                    <SelectItem value="deck">Deck</SelectItem>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lifecycle status</Label>
                <Select
                  value={editingDraft.lifecycleStatus}
                  onValueChange={(v) => updateCrewDraft(editingCrewId, { lifecycleStatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="joiner">Joiner</SelectItem>
                    <SelectItem value="leaver">Leaver</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 pt-1">
                <SettingSwitch
                  label="Watch eligible"
                  checked={editingDraft.watchEligible}
                  onChange={(v) => updateCrewDraft(editingCrewId, { watchEligible: v })}
                />
                <SettingSwitch
                  label="Rotational crew"
                  checked={editingDraft.isRotational}
                  onChange={(v) => updateCrewDraft(editingCrewId, { isRotational: v })}
                />
                <SettingSwitch
                  label="Relief crew"
                  checked={editingDraft.isRelief}
                  onChange={(v) => updateCrewDraft(editingCrewId, { isRelief: v })}
                />
                <SettingSwitch
                  label="On rota"
                  checked={editingDraft.onRota}
                  onChange={(v) => updateCrewDraft(editingCrewId, { onRota: v })}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Changes are saved to draft. Click "Save Settings Only" to persist to Supabase.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setEditingCrewId(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive confirm dialog */}
      <Dialog
        open={!!archiveConfirmId}
        onOpenChange={(open) => {
          if (!open) setArchiveConfirmId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive crew member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {archiveTarget
              ? `${archiveTarget.full_name} will be removed from the active rota.`
              : "This crew member will be removed from the active rota."}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setArchiveConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => archiveConfirmId && archiveCrewMember(archiveConfirmId)}
            >
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add crew dialog */}
      <Dialog
        open={addCrewOpen}
        onOpenChange={(open) => {
          setAddCrewOpen(open);
          if (!open) setAddCrewDraft(DEFAULT_CREW_DRAFT);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add crew member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-1">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={addCrewDraft.fullName}
                onChange={(e) => setAddCrewDraft((d) => ({ ...d, fullName: e.target.value }))}
                placeholder="e.g. James Murray"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input
                  value={addCrewDraft.position}
                  onChange={(e) => setAddCrewDraft((d) => ({ ...d, position: e.target.value }))}
                  placeholder="e.g. OOW"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rank</Label>
                <Input
                  value={addCrewDraft.rank}
                  onChange={(e) => setAddCrewDraft((d) => ({ ...d, rank: e.target.value }))}
                  placeholder="e.g. Chief Officer"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={addCrewDraft.department}
                onValueChange={(v) => setAddCrewDraft((d) => ({ ...d, department: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="command">Command</SelectItem>
                  <SelectItem value="deck">Deck</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 pt-1">
              <SettingSwitch
                label="Watch eligible"
                checked={addCrewDraft.watchEligible}
                onChange={(v) => setAddCrewDraft((d) => ({ ...d, watchEligible: v }))}
              />
              <SettingSwitch
                label="Rotational crew"
                checked={addCrewDraft.isRotational}
                onChange={(v) => setAddCrewDraft((d) => ({ ...d, isRotational: v }))}
              />
              <SettingSwitch
                label="Add to rota immediately"
                checked={addCrewDraft.onRota}
                onChange={(v) => setAddCrewDraft((d) => ({ ...d, onRota: v }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAddCrewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAddCrew}>
                <Plus className="h-4 w-4" /> Add crew member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add leave request dialog */}
      <Dialog
        open={addLeaveOpen}
        onOpenChange={(open) => {
          setAddLeaveOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add leave request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-1">
            <div className="space-y-1.5">
              <Label>Crew member</Label>
              <Select
                value={leaveDraft.crewMemberId}
                onValueChange={(v) => setLeaveDraft((d) => ({ ...d, crewMemberId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {crew.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={leaveDraft.startDate}
                  onChange={(e) => setLeaveDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={leaveDraft.endDate}
                  onChange={(e) => setLeaveDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Leave type</Label>
                <Select
                  value={leaveDraft.leaveType}
                  onValueChange={(v) => setLeaveDraft((d) => ({ ...d, leaveType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="off_vessel">Off vessel</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={leaveDraft.status}
                  onValueChange={(v) => setLeaveDraft((d) => ({ ...d, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                value={leaveDraft.notes}
                onChange={(e) => setLeaveDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Brief notes about this leave request"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAddLeaveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addLeaveRequest}>
                <Plus className="h-4 w-4" /> Add leave
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-16 left-0 right-0 z-10 border-t border-border bg-background/95 backdrop-blur-sm md:bottom-0">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 md:px-8">
          <span className="hidden text-xs text-muted-foreground sm:block">
            Save settings before regenerating the schedule.
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={saving || regenerating}
              onClick={saveSettingsOnly}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Settings Only"}
            </Button>
            <Button size="sm" disabled={saving || regenerating} onClick={saveAndRegenerate}>
              <RefreshCcw className="h-3.5 w-3.5" />
              {regenerating ? "Regenerating..." : "Save All & Regenerate"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
