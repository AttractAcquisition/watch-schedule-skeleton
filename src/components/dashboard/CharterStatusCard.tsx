import { useCharterPauses } from "@/hooks/data";
import { Badge } from "@/components/ui/badge";

export function CharterStatusCard() {
  const { data: pauses, isLoading, error } = useCharterPauses();

  if (isLoading) {
    return (
      <div className="panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Status
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Status
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Failed to load charter status.</p>
      </div>
    );
  }

  const active = pauses?.find((p) => p.status === "active") ?? null;

  if (!active) {
    return (
      <div className="panel p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Status
        </div>
        <p className="mt-3 text-sm text-muted-foreground">No active charter pauses.</p>
        <div className="mt-4 flex gap-2">
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
            View Charter Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Status
        </div>
        <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
          Active
        </Badge>
      </div>
      <div className="mt-3 text-sm">
        Charter from <span className="font-mono">{active.start_date}</span> →{" "}
        <span className="font-mono">{active.end_date}</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Engineering watch {active.keep_engineering_watch_active ? "maintained" : "paused"} ·
        Security {active.keep_security_watch_active ? "maintained" : "paused"}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Charter Mode active. Normal rotation is frozen.{" "}
        {active.resume_mode === "automatic"
          ? "Will resume automatically."
          : "Manual resume required."}
      </p>
      <div className="mt-4 flex gap-2">
        <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
          View Charter Mode
        </button>
        <button className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground">
          Resume Schedule
        </button>
      </div>
    </div>
  );
}
