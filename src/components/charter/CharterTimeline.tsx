import { useCharterPauses } from "@/hooks/data";

export function CharterTimeline() {
  const { data: pauses, isLoading } = useCharterPauses();

  if (isLoading) {
    return (
      <div className="panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Timeline
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const active = pauses?.find((p) => p.status === "active") ?? null;
  const hasAny = (pauses?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <div className="panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Timeline
        </div>
        <p className="mt-3 text-sm text-muted-foreground">No charter events recorded.</p>
      </div>
    );
  }

  const steps = [
    {
      label: "Before Charter",
      date: "Normal rotation active.",
      state: active ? "done" : "current",
    },
    {
      label: "Charter Mode",
      date: active
        ? `Rotation frozen · ${active.start_date} → ${active.end_date}`
        : "No active charter.",
      state: active ? "current" : "todo",
    },
    {
      label: "After Charter",
      date: active
        ? active.resume_mode === "automatic"
          ? "Resumes automatically."
          : "Manual resume required."
        : "—",
      state: "todo",
    },
  ] as const;

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
                    ? "border-primary bg-primary"
                    : s.state === "done"
                      ? "border-success bg-success/40"
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
