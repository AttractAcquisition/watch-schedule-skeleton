import { MOCK_SCHEDULE, MOCK_CREW } from "@/lib/mockData";

export function SchedulePreview() {
  const days = Array.from(new Set(MOCK_SCHEDULE.assignments.map((a) => a.date))).slice(0, 7);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Schedule Preview · Week of {MOCK_SCHEDULE.weekStart}
        </div>
        <div className="text-[11px] text-muted-foreground">v{MOCK_SCHEDULE.version}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Block</th>
              {days.map((d) => (
                <th key={d} className="px-3 py-2 font-mono text-[10px] font-medium">
                  {d.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["00:00–04:00", "04:00–08:00", "20:00–00:00"].map((block) => (
              <tr key={block} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{block}</td>
                {days.map((d) => {
                  const a = MOCK_SCHEDULE.assignments.find(
                    (x) => x.date === d && x.blockLabel === block && x.role === "oow"
                  );
                  const crew = MOCK_CREW.find((c) => c.id === a?.crewMemberId);
                  return (
                    <td key={d} className="px-3 py-2">
                      <span className="rounded border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px]">
                        {crew?.name.split(" ").map((n) => n[0]).join("") ?? "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
