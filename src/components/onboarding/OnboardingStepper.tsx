export function OnboardingStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-success text-success"
                    : "border-border")
              }
            >
              {i + 1}
            </span>
            <span className={active ? "text-primary" : ""}>{s}</span>
            {i < steps.length - 1 && <span className="text-border">·</span>}
          </li>
        );
      })}
    </ol>
  );
}
