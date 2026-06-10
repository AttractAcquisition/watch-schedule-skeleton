import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { WatchTodayCard } from "@/components/dashboard/WatchTodayCard";
import { FairnessScoreCard } from "@/components/dashboard/FairnessScoreCard";
import { CharterStatusCard } from "@/components/dashboard/CharterStatusCard";
import { SchedulePreview } from "@/components/dashboard/SchedulePreview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Badge } from "@/components/ui/badge";
import { Anchor, Users, CalendarX, FileDown, Activity, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCrew, useLatestScheduleRun, useLeave, useCharterPauses } from "@/hooks/data";
import { PLAN_LABEL } from "@/lib/constants";
import type { PlanType } from "@/lib/types";

const WATCH_MODE_HINT: Record<string, string> = {
  solo: "Single watchkeeper",
  dual: "Watchkeeper · OOW",
  triple: "Deck/OOW · Interior · Engineering",
};

export default function Dashboard() {
  const { subscription, vessel } = useAuth();
  const crew = useCrew();
  const latestRun = useLatestScheduleRun();
  const leave = useLeave();
  const charter = useCharterPauses();

  const crewList = crew.data ?? [];
  const activeCrew = crewList.filter((c) => c.status === "active").length;
  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;
  const watchMode = vessel?.watch_mode ?? "solo";

  const fairness = latestRun.data?.fairness_score;
  const activeCharter = (charter.data ?? []).find((c) => c.status === "active");
  const leaveConflicts = (leave.data ?? []).filter((l) => l.status !== "available").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vessel Dashboard"
        title={`${vessel?.name ?? "Your vessel"} Watch Dashboard`}
        description="Generate, review, pause, and export fair yacht watch schedules."
        actions={
          <>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
              {planType ? PLAN_LABEL[planType] : "No plan"}
            </Badge>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
              <span
                className={
                  "mr-1.5 inline-block h-1.5 w-1.5 rounded-full " +
                  (subscription?.status === "active" ? "bg-success" : "bg-muted-foreground")
                }
              />{" "}
              Subscription {subscription?.status ?? "inactive"}
            </Badge>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
              Charter · {activeCharter ? "Paused" : "Inactive"}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Fairness Score"
          value={fairness != null ? `${Math.round(fairness)}%` : "—"}
          hint={latestRun.data ? "Latest draft" : "No schedule yet"}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Active Crew"
          value={crew.isLoading ? "…" : `${activeCrew}/${crewList.length}`}
          hint="On vessel"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Watch Mode"
          value={`${watchMode[0].toUpperCase()}${watchMode.slice(1)} Watch`}
          hint={WATCH_MODE_HINT[watchMode]}
          icon={<Anchor className="h-4 w-4" />}
        />
        <StatCard
          label="Charter Status"
          value={activeCharter ? "Paused" : "Inactive"}
          hint={activeCharter ? `Resumes ${activeCharter.end_date}` : "No active charter"}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <StatCard
          label="Leave Conflicts"
          value={`${leaveConflicts}`}
          hint="Open availability records"
          icon={<CalendarX className="h-4 w-4" />}
        />
        <StatCard
          label="Latest Schedule"
          value={latestRun.data ? latestRun.data.status : "None"}
          hint={
            latestRun.data
              ? `${latestRun.data.start_date} → ${latestRun.data.end_date}`
              : "Generate one"
          }
          icon={<FileDown className="h-4 w-4" />}
        />
      </div>

      {/* The preview cards below remain illustrative; wire to live assignment
          data once a schedule has been generated for this vessel. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <SchedulePreview />
          <div className="grid gap-4 md:grid-cols-2">
            <WatchTodayCard />
            <FairnessScoreCard />
          </div>
        </div>
        <div className="space-y-4">
          <QuickActions />
          <CharterStatusCard />
        </div>
      </div>
    </AppShell>
  );
}
