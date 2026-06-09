import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CharterStatusCard } from "@/components/dashboard/CharterStatusCard";
import { CharterPausePanel } from "@/components/charter/CharterPausePanel";
import { CharterTimeline } from "@/components/charter/CharterTimeline";

export default function CharterMode() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Charter Mode"
        title="Pause & resume scheduling for charter periods"
        description="Charter Mode pauses crew watches while maintaining engineering and security coverage."
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
    </AppShell>
  );
}
