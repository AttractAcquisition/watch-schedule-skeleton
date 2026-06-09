import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { FairnessMetricCard } from "@/components/fairness/FairnessMetricCard";
import { FairnessBreakdown } from "@/components/fairness/FairnessBreakdown";
import { FairnessExplanation } from "@/components/fairness/FairnessExplanation";
import { MOCK_FAIRNESS } from "@/lib/mockData";

export default function FairnessEngine() {
  const f = MOCK_FAIRNESS;
  return (
    <AppShell>
      <PageHeader
        eyebrow="Fairness Engine"
        title={`Overall fairness · ${f.overall}%`}
        description="Professional scheduling support. Captain approval required before publishing."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <FairnessMetricCard label="Total watch balance" value={f.totalWatchBalance} />
        <FairnessMetricCard label="Weekend fairness" value={f.weekendFairness} />
        <FairnessMetricCard label="Night watch balance" value={f.nightWatchBalance} />
        <FairnessMetricCard label="Consecutive-day risk" value={f.consecutiveDayRisk} />
        <FairnessMetricCard label="Department balance" value={f.departmentBalance} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FairnessBreakdown />
        </div>
        <div className="space-y-4">
          <FairnessExplanation />
          <div className="panel p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Manual override log
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Captain overrides will appear here for audit. (Placeholder — TODO connect audit log.)
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
