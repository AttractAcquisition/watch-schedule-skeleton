import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  ShipWheel,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { PLAN_LABEL } from "@/lib/constants";
import {
  useAssignments,
  useCharterPauses,
  useCrew,
  useCrewFairnessScores,
  useLatestScheduleRun,
  useManualOverrides,
  useScheduleExplanations,
  useScheduleHealth,
  useVesselId,
} from "@/hooks/data";
import { activateCharterMode, exportSchedule, resumeCharterMode } from "@/lib/edgeFunctions";
import type { PlanType } from "@/lib/types";
import {
  adaptDailyAssignments,
  addMonths,
  getDayWeightKind,
  monthKey,
  startOfMonth,
  toISODate,
  type DailyWatchAssignment,
} from "@/lib/dailySchedule";
import { calculateFairnessEngine } from "@/lib/fairnessEngine";
import type { CrewMemberRow, ScheduleAssignmentRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMPTY_CREW: CrewMemberRow[] = [];
const EMPTY_ASSIGNMENTS: ScheduleAssignmentRow[] = [];

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function buildMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const firstDay = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function buildCurrentWeek(month: Date) {
  const today = new Date();
  const anchor =
    today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear()
      ? today
      : startOfMonth(month);
  const offset = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - offset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function DailyCalendar({
  assignments,
  month,
  onMonthChange,
}: {
  assignments: DailyWatchAssignment[];
  month: Date;
  onMonthChange: (date: Date) => void;
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const todayIso = toISODate(new Date());
  const todayMonth = startOfMonth(new Date());
  const maxMonth = startOfMonth(addMonths(todayMonth, 3));
  const currentMonth = startOfMonth(month);
  const days = view === "month" ? buildMonthGrid(month) : buildCurrentWeek(month);
  const assignmentByDate = new Map(assignments.map((a) => [a.date, a]));
  const canGoBack = currentMonth > todayMonth;
  const canGoForward = currentMonth < maxMonth;
  const hasAssignments = assignments.length > 0;

  return (
    <div className="panel overflow-hidden">
      {/* Calendar header */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Daily Watch Calendar
          </div>
          <h2 className="mt-0.5 font-display text-lg font-semibold">{formatMonth(month)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs">
                Month
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canGoBack}
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canGoForward}
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border bg-background/40 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 md:px-3">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day);
          const assignment = assignmentByDate.get(iso);
          const inMonth = day.getMonth() === month.getMonth();
          const kind = getDayWeightKind(day);
          const isWeekend = kind === "saturday" || kind === "sunday";
          const isTransition = kind === "monday" || kind === "friday";
          const isToday = iso === todayIso;

          return (
            <div
              key={iso}
              className={cn(
                "min-h-[5.5rem] border-b border-r border-border p-2 text-sm md:p-3",
                !inMonth && view === "month" && "bg-background/30 opacity-50",
                inMonth && isWeekend && "bg-warning/5",
                inMonth && isTransition && !isWeekend && "bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[11px]",
                  isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {day.getDate()}
              </div>
              <div className="mt-2 min-h-6">
                {assignment ? (
                  <div className="text-[12px] font-medium leading-tight text-foreground">
                    {assignment.crewName}
                  </div>
                ) : inMonth ? (
                  <div className="text-[11px] text-muted-foreground/50">—</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!hasAssignments && (
        <div className="border-t border-border px-5 py-5 text-sm text-muted-foreground">
          No schedule generated yet. Configure watch settings and regenerate from Settings.
        </div>
      )}
    </div>
  );
}

function BridgeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3.5">
      <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-medium text-primary">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const vesselId = useVesselId();
  const { subscription, vessel } = useAuth();
  const crewQuery = useCrew();
  const latestRun = useLatestScheduleRun();
  const assignmentsQuery = useAssignments(latestRun.data?.id);
  const charter = useCharterPauses();
  const persistedFairness = useCrewFairnessScores();
  const scheduleHealth = useScheduleHealth();
  const explanations = useScheduleExplanations();
  const manualOverrides = useManualOverrides();

  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [charterBusy, setCharterBusy] = useState(false);

  const crew = crewQuery.data ?? EMPTY_CREW;
  const assignments = assignmentsQuery.data ?? EMPTY_ASSIGNMENTS;

  const dailyAssignments = useMemo(
    () => adaptDailyAssignments(assignments, crew),
    [assignments, crew],
  );

  const visibleAssignments = useMemo(
    () => dailyAssignments.filter((a) => a.date.startsWith(monthKey(calendarMonth))),
    [dailyAssignments, calendarMonth],
  );

  const fairnessEngine = useMemo(
    () => calculateFairnessEngine(crew, dailyAssignments),
    [crew, dailyAssignments],
  );

  const persistedFairnessByCrew = new Map(
    (persistedFairness.data ?? []).map((s) => [s.crew_member_id, s]),
  );

  const crewFairnessRows = fairnessEngine.crewScores.map((score) => {
    const stored = persistedFairnessByCrew.get(score.crewMemberId);
    return {
      crewMemberId: score.crewMemberId,
      crewName: score.crewName,
      score: stored?.crew_fairness_score ?? score.score,
      fairnessDebt: stored?.fairness_debt ?? score.fairnessDebt,
    };
  });

  const scheduleFairnessScore =
    latestRun.data?.fairness_score ?? fairnessEngine.scheduleFairnessScore;
  const averageCrewFairnessScore =
    crewFairnessRows.length > 0
      ? Math.round(crewFairnessRows.reduce((sum, r) => sum + r.score, 0) / crewFairnessRows.length)
      : fairnessEngine.averageCrewFairnessScore;
  const highestFairnessDebt =
    crewFairnessRows.length > 0
      ? Math.max(...crewFairnessRows.map((r) => r.fairnessDebt), 0)
      : fairnessEngine.highestFairnessDebt;
  const lowestFairnessScore =
    crewFairnessRows.length > 0
      ? Math.min(...crewFairnessRows.map((r) => r.score))
      : fairnessEngine.lowestFairnessScore;
  const rotationStabilityScore =
    scheduleHealth.data?.rotation_stability_score ?? fairnessEngine.rotationStabilityScore;
  const scheduleHealthScore = scheduleHealth.data?.schedule_health_score ?? scheduleFairnessScore;

  const runWarnings = Array.isArray(latestRun.data?.warnings)
    ? (latestRun.data.warnings.filter((w) => typeof w === "string") as string[])
    : [];
  const alerts = [
    ...runWarnings,
    ...(explanations.data ?? [])
      .filter((e) => e.explanation_type === "alert")
      .map((e) => e.explanation_text),
  ];

  const activeCharter = (charter.data ?? []).find((c) => c.status === "active");
  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;

  async function handleExport() {
    if (!latestRun.data?.id) {
      toast("No schedule generated yet. Regenerate from Settings first.");
      return;
    }
    try {
      const result = await exportSchedule({
        schedule_run_id: latestRun.data.id,
        export_type: "bridge",
      });
      toast.success(result.file_url ? "Schedule PDF exported." : "Export started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    }
  }

  async function handleCharterToggle(next: boolean) {
    if (!vesselId) return;
    setCharterBusy(true);
    try {
      if (next) {
        const today = toISODate(new Date());
        const end = toISODate(addMonths(new Date(), 1));
        await activateCharterMode({
          vessel_id: vesselId,
          schedule_run_id: latestRun.data?.id,
          start_date: today,
          end_date: end,
          pause_all_watches: true,
          keep_engineering_watch_active: false,
          keep_security_watch_active: false,
          resume_mode: "manual",
        });
        toast.success("Charter Mode active.");
      } else {
        await resumeCharterMode({
          vessel_id: vesselId,
          schedule_run_id: latestRun.data?.id,
          resume_mode: "manual",
        });
        toast.success("Normal rotation active.");
      }
    } catch (error) {
      // TODO(charter-mode): keep this optimistic fallback until the daily
      // charter mode edge-function contract is finalized.
      toast.error(error instanceof Error ? error.message : "Charter Mode update failed.");
    } finally {
      setCharterBusy(false);
      charter.refetch();
    }
  }

  return (
    <AppShell>
      {/* Operating strip */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Daily Watch Rota
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            {vessel?.name ?? "Your vessel"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {planType && (
              <Badge
                variant="outline"
                className="border-border text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {PLAN_LABEL[planType]}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "border text-[10px] uppercase tracking-wider",
                activeCharter
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : "border-success/40 bg-success/10 text-success",
              )}
            >
              {activeCharter ? "Charter Mode" : "Normal Rotation"}
            </Badge>
          </div>
        </div>

        {/* Charter toggle + export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2">
            <Switch
              checked={!!activeCharter}
              disabled={charterBusy}
              onCheckedChange={handleCharterToggle}
              aria-label="Toggle Charter Mode"
            />
            <span className="text-xs text-muted-foreground">
              {activeCharter ? "Charter" : "Normal"}
            </span>
          </div>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export Schedule PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={charterBusy}
          onClick={() => handleCharterToggle(!activeCharter)}
        >
          <ShipWheel className="h-3.5 w-3.5" />
          {activeCharter ? "Resume Rotation" : "Pause for Charter"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/settings#crew-database")}>
          <Pencil className="h-3.5 w-3.5" /> Edit Crew
        </Button>
      </div>

      {/* Bridge metrics */}
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <BridgeMetric label="Schedule Fairness" value={`${scheduleFairnessScore || "—"}%`} />
        <BridgeMetric label="Avg Crew Fairness" value={`${averageCrewFairnessScore || "—"}%`} />
        <BridgeMetric label="Highest Debt" value={String(highestFairnessDebt || "—")} />
        <BridgeMetric label="Lowest Fairness" value={`${lowestFairnessScore || "—"}%`} />
        <BridgeMetric label="Rotation Stability" value={`${rotationStabilityScore || "—"}%`} />
        <BridgeMetric label="Schedule Health" value={`${scheduleHealthScore || "—"}%`} />
      </div>

      {/* Main content: calendar + fairness panel */}
      <div className="grid gap-5 xl:grid-cols-[1fr_296px]">
        {/* Calendar — dominant */}
        <DailyCalendar
          assignments={visibleAssignments}
          month={calendarMonth}
          onMonthChange={(date) => setCalendarMonth(startOfMonth(date))}
        />

        {/* Fairness & alerts panel */}
        <aside className="panel flex flex-col gap-5 p-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Crew Fairness
              </div>
              <div className="mt-0.5 font-display text-lg font-semibold">
                {scheduleFairnessScore || "—"}% score
              </div>
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-border bg-background/35 p-3">
              <div className="text-muted-foreground">Highest debt</div>
              <div className="mt-1 font-mono text-primary">{highestFairnessDebt || "—"}</div>
            </div>
            <div className="rounded border border-border bg-background/35 p-3">
              <div className="text-muted-foreground">Rotation stability</div>
              <div className="mt-1 font-mono text-success">{rotationStabilityScore || "—"}%</div>
            </div>
          </div>

          {/* Most due to serve */}
          {fairnessEngine.mostDueToServe && (
            <div className="rounded border border-primary/30 bg-primary/8 p-3 text-xs">
              <div className="text-muted-foreground">Most due to serve</div>
              <div className="mt-0.5 font-medium">{fairnessEngine.mostDueToServe.crewName}</div>
            </div>
          )}

          {/* Crew fairness list */}
          <div className="divide-y divide-border">
            {crewFairnessRows.length > 0 ? (
              crewFairnessRows.map((score) => (
                <div key={score.crewMemberId} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{score.crewName}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    <span className="text-primary">{score.score}%</span>
                    {" · "}
                    <span className={score.fairnessDebt > 0 ? "text-warning" : "text-success"}>
                      {score.fairnessDebt > 0 ? "+" : ""}
                      {score.fairnessDebt}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-sm text-muted-foreground">
                Add active crew in Settings to calculate fairness.
              </div>
            )}
          </div>

          {/* Alerts & explainability */}
          <div className="rounded border border-border bg-background/35 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Alerts & Explainability
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert, i) => (
                  <div key={i} className="border-l-2 border-warning/40 pl-2">
                    {alert}
                  </div>
                ))
              ) : (
                <div>No fairness alerts.</div>
              )}
              {!!manualOverrides.data?.length && (
                <div className="mt-1 text-muted-foreground/70">
                  {manualOverrides.data.length} recent manual override
                  {manualOverrides.data.length !== 1 ? "s" : ""}.
                </div>
              )}
            </div>
            <Button
              className="mt-3 w-full justify-start"
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings#intelligence-settings")}
            >
              Explain schedule
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
