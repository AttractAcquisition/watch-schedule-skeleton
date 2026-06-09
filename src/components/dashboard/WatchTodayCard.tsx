import { MOCK_SCHEDULE, MOCK_CREW } from "@/lib/mockData";

export function WatchTodayCard() {
  const today = new Date().toISOString().slice(0, 10);
  const todays = MOCK_SCHEDULE.assignments.filter((a) => a.date === today).slice(0, 6);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Today's Watches
        </div>
        <div className="text-[11px] text-muted-foreground">{today}</div>
      </div>
      <div className="mt-4 divide-y divide-border">
        {todays.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">No watches scheduled for today.</div>
        )}
        {todays.map((a) => {
          const crew = MOCK_CREW.find((c) => c.id === a.crewMemberId);
          return (
            <div key={a.id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-muted-foreground">{a.blockLabel}</span>
                <span className="text-foreground">{crew?.name ?? "Unassigned"}</span>
              </div>
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {a.role.replace("_", " ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
