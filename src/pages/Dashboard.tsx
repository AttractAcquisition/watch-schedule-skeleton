import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { WatchTodayCard } from "@/components/dashboard/WatchTodayCard";
import { FairnessScoreCard } from "@/components/dashboard/FairnessScoreCard";
import { CharterStatusCard } from "@/components/dashboard/CharterStatusCard";
import { SchedulePreview } from "@/components/dashboard/SchedulePreview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MOCK_CREW, MOCK_SCHEDULE, MOCK_FAIRNESS, MOCK_LEAVE } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Anchor, Users, CalendarX, FileDown, Activity, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const active = MOCK_CREW.filter((c) => c.status === "active").length;
  const leaveConflicts = MOCK_LEAVE.length;
  return (
    <AppShell>
      <PageHeader
        eyebrow="Vessel Dashboard"
        title="M/Y Meridian Watch Dashboard"
        description={`Week of ${MOCK_SCHEDULE.weekStart} → ${MOCK_SCHEDULE.weekEnd}`}
        actions={
          <>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">Triple Watch</Badge>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" /> Subscription Active
            </Badge>
            <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">Charter · Scheduled</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Current Watch Mode" value="Triple" hint="Deck · Interior · Engineering" icon={<Anchor className="h-4 w-4" />} />
        <StatCard label="Fairness Score" value={`${MOCK_FAIRNESS.overall}%`} hint="Balanced across watchkeepers" icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Active Crew" value={active} hint={`${MOCK_CREW.length} total on vessel`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Leave Conflicts" value={leaveConflicts} hint="Affecting current week" icon={<CalendarX className="h-4 w-4" />} />
        <StatCard label="Charter Status" value="Scheduled" hint="Fri → Mon" icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="PDF Export" value="Ready" hint={`v${MOCK_SCHEDULE.version} · Bridge edition`} icon={<FileDown className="h-4 w-4" />} />
      </div>

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
