import { MOCK_CHARTER } from "@/lib/mockData";

export function CharterTimeline() {
  const steps = [
    { label: "Before charter", date: "Schedule active", state: "done" },
    { label: "Charter paused", date: `${MOCK_CHARTER.startDate} → ${MOCK_CHARTER.endDate}`, state: "current" },
    { label: "Resume point", date: MOCK_CHARTER.endDate, state: "todo" },
  ];
  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Charter Timeline
      </div>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={
                  "h-2.5 w-2.5 rounded-full border " +
                  (s.state === "current"
                    ? "border-foreground bg-foreground"
                    : s.state === "done"
                    ? "border-foreground"
                    : "border-border")
                }
              />
              {i < steps.length - 1 && <div className="mt-1 h-10 w-px bg-border" />}
            </div>
            <div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.date}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
