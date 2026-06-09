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
import { toast } from "sonner";
import { MOCK_CHARTER } from "@/lib/mockData";

export default function ScheduleCalendar() {
  const [dept, setDept] = useState("all");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendar View"
        title="Weekly watch calendar"
        description="View, filter, and export the current week's watches. Charter and leave overlays included."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast("Regenerate placeholder.")}>Regenerate</Button>
            <Button size="sm" onClick={() => toast("PDF export placeholder.")}>Export PDF</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="deck">Deck</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="command">Command</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScheduleGrid filterDept={dept} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="panel p-4 text-xs text-muted-foreground">
          <span className="text-foreground">Charter overlay</span> · paused from {MOCK_CHARTER.startDate} to {MOCK_CHARTER.endDate}.
        </div>
        <div className="panel p-4 text-xs text-muted-foreground">
          <span className="text-foreground">Leave markers</span> · Sam O'Connor (on leave), Lukas Weiss (training).
        </div>
      </div>
    </AppShell>
  );
}
