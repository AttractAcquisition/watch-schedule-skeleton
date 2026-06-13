import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CharterStatusCard } from "@/components/dashboard/CharterStatusCard";
import { CharterPausePanel } from "@/components/charter/CharterPausePanel";
import { CharterTimeline } from "@/components/charter/CharterTimeline";

export default function CharterMode() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Charter Mode"
        title="Charter Mode"
        description="Pause the normal rotation during charter and resume from the correct point afterwards."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <CharterPausePanel />
          <CharterTimeline />
        </div>
        <div>
          <CharterStatusCard />
        </div>
      </div>
      <div className="mt-4 panel p-4 text-xs text-muted-foreground">
        Charter Mode pauses normal rota logic. The captain remains responsible for final scheduling
        decisions.
      </div>
    </AppShell>
  );
}
