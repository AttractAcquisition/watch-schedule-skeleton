import { MOCK_FAIRNESS } from "@/lib/mockData";

export function FairnessScoreCard() {
  const f = MOCK_FAIRNESS;
  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Fairness Score
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-semibold tracking-tight">{f.overall}%</div>
        <div className="text-xs text-muted-foreground">across {f.perCrew.length} watchkeepers</div>
      </div>
      <div className="mt-4 space-y-2">
        {[
          ["Total watch balance", f.totalWatchBalance],
          ["Weekend fairness", f.weekendFairness],
          ["Night watch balance", f.nightWatchBalance],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex items-center gap-3 text-xs">
            <div className="w-32 text-muted-foreground">{label}</div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-foreground" style={{ width: `${val}%` }} />
            </div>
            <div className="w-8 text-right font-mono text-muted-foreground">{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
