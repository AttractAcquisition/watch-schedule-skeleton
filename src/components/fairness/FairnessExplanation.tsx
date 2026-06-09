import { MOCK_FAIRNESS } from "@/lib/mockData";
import { AlertTriangle } from "lucide-react";

export function FairnessExplanation() {
  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Plain-English Explanation
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Watches this week are distributed evenly across eligible crew, with weekend and night blocks
        balanced to within {100 - MOCK_FAIRNESS.weekendFairness} points of an ideal split. Crew
        rotating into consecutive day-watch blocks have been flagged for captain review. Fairness
        balancing offers professional scheduling support; captain approval is required before publishing.
      </p>
      <div className="mt-5 space-y-2">
        {MOCK_FAIRNESS.warnings.map((w, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
