import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { WatchModeSelector } from "@/components/schedule/WatchModeSelector";
import { RuleBuilder } from "@/components/schedule/RuleBuilder";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ConfirmScheduleModal } from "@/components/schedule/ConfirmScheduleModal";
import { Button } from "@/components/ui/button";
import { MOCK_CREW } from "@/lib/mockData";
import type { WatchMode } from "@/lib/types";
import { generateWatchSchedule } from "@/lib/scheduleEnginePlaceholder";
import { toast } from "sonner";

export default function WatchBuilder() {
  const [mode, setMode] = useState<WatchMode>("triple");
  const [open, setOpen] = useState(false);
  const eligible = MOCK_CREW.filter((c) => c.watchEligible);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Watch Builder"
        title="Build & confirm a watch schedule"
        description="Choose watch mode, configure rules, and generate a draft schedule for captain approval."
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Watch mode</h2>
          <WatchModeSelector value={mode} onChange={setMode} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Rules</h2>
            <RuleBuilder />
          </div>
          <div>
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Crew eligibility</h2>
            <div className="panel p-5 text-sm">
              <div className="text-3xl font-semibold tracking-tight">{eligible.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">eligible across {MOCK_CREW.length} crew</div>
              <div className="mt-4 space-y-1 text-xs">
                {["command", "deck", "interior", "engineering"].map((d) => (
                  <div key={d} className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{d}</span>
                    <span className="font-mono">{eligible.filter((c) => c.department === d).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Draft schedule preview
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await generateWatchSchedule({ mode }); // TODO: real edge fn
                  toast("Draft schedule generated (mock).");
                }}
              >
                Generate Schedule
              </Button>
              <Button size="sm" onClick={() => setOpen(true)}>Submit &amp; Confirm</Button>
            </div>
          </div>
          <ScheduleGrid />
        </section>
      </div>

      <ConfirmScheduleModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          setOpen(false);
          toast("Schedule published (mock).");
        }}
      />
    </AppShell>
  );
}
