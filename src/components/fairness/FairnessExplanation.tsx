import { AlertTriangle } from "lucide-react";
import { useScheduleExplanations, useLatestScheduleRun } from "@/hooks/data";

export function FairnessExplanation() {
  const { data: explanations, isLoading } = useScheduleExplanations();
  const latestRun = useLatestScheduleRun();

  const runWarnings = Array.isArray(latestRun.data?.warnings)
    ? (latestRun.data!.warnings as unknown[]).filter((w): w is string => typeof w === "string")
    : [];

  const alerts = [
    ...runWarnings,
    ...(explanations ?? [])
      .filter((e) => e.explanation_type === "alert" || e.explanation_type === "warning")
      .map((e) => e.explanation_text),
  ];

  const infoTexts = (explanations ?? [])
    .filter((e) => e.explanation_type === "explanation" || e.explanation_type === "info")
    .map((e) => e.explanation_text);

  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Plain-English Explanation
      </div>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : infoTexts.length > 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{infoTexts[0]}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {latestRun.data
            ? "Schedule generated. No plain-English explanations have been stored for this run."
            : "Generate a schedule from Settings to see fairness explanations here."}
        </p>
      )}
      {alerts.length > 0 && (
        <div className="mt-5 space-y-2">
          {alerts.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
