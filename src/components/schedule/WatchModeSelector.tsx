import type { WatchMode } from "@/lib/types";

export function WatchModeSelector({
  value,
  onChange,
}: {
  value: WatchMode;
  onChange: (v: WatchMode) => void;
}) {
  const opts: { id: WatchMode; name: string; blurb: string }[] = [
    { id: "solo", name: "Solo Watch", blurb: "One watchkeeper per watch block." },
    { id: "dual", name: "Dual Watch", blurb: "Watchkeeper + OOW, or Day/Night rotation." },
    { id: "triple", name: "Triple Watch", blurb: "Deck OOW + Interior watch + Engineering OOW." },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            "rounded-md border p-4 text-left transition-colors " +
            (value === o.id
              ? "border-primary bg-primary/12 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/45 hover:bg-primary/10 hover:text-foreground")
          }
        >
          <div className="text-sm font-medium">{o.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{o.blurb}</div>
        </button>
      ))}
    </div>
  );
}
