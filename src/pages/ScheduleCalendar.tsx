import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useCharterPauses, useLatestScheduleRun } from "@/hooks/data";

export default function ScheduleCalendar() {
  const [dept, setDept] = useState("all");
  const navigate = useNavigate();
  const charter = useCharterPauses();
  const latestRun = useLatestScheduleRun();

  const activeCharter = (charter.data ?? []).find((c) => c.status === "active");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendar View"
        title="Calendar View"
        description="View the confirmed rota across days, weeks, departments, and charter pauses."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/watch-builder")}>
              Regenerate schedule
            </Button>
            <Button size="sm" onClick={() => navigate("/reports")}>
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/leave")}>
              Add leave
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/charter-mode")}>
              Pause for charter
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="department">Department</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="deck">Deck</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="command">Command</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* The grid is illustrative; wire it to schedule_assignments for the
          latest run to render live watches. */}
      <ScheduleGrid filterDept={dept} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="panel p-4 text-xs text-muted-foreground">
          <span className="text-foreground">Charter overlay</span> ·{" "}
          {activeCharter
            ? `paused from ${activeCharter.start_date} to ${activeCharter.end_date}.`
            : "no active charter pause."}
        </div>
        <div className="panel p-4 text-xs text-muted-foreground">
          <span className="text-foreground">Latest schedule</span> ·{" "}
          {latestRun.data
            ? `${latestRun.data.status} · ${latestRun.data.start_date} → ${latestRun.data.end_date}`
            : "none generated yet."}
        </div>
      </div>
    </AppShell>
  );
}
