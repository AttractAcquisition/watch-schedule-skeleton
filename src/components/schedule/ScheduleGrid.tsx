import { MOCK_SCHEDULE, MOCK_CREW } from "@/lib/mockData";
import type { WatchRole } from "@/lib/types";

const ROLES: { id: WatchRole; label: string }[] = [
  { id: "oow", label: "OOW" },
  { id: "deck_watch", label: "Deck Watch" },
  { id: "interior_watch", label: "Interior Watch" },
  { id: "engineering_oow", label: "Engineering OOW" },
];

export function ScheduleGrid({ filterDept }: { filterDept?: string }) {
  const days = Array.from(new Set(MOCK_SCHEDULE.assignments.map((a) => a.date))).slice(0, 7);
  const blocks = ["00:00–04:00", "04:00–08:00", "20:00–00:00"];
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Block</th>
            <th className="px-3 py-3 font-medium">Role</th>
            {days.map((d) => (
              <th key={d} className="px-3 py-3 font-mono text-[10px] font-medium">
                {d.slice(5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) =>
            ROLES.map((r) => (
              <tr key={b + r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{b}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                {days.map((d) => {
                  const a = MOCK_SCHEDULE.assignments.find(
                    (x) => x.date === d && x.blockLabel === b && x.role === r.id
                  );
                  const crew = MOCK_CREW.find((c) => c.id === a?.crewMemberId);
                  if (filterDept && filterDept !== "all" && crew?.department !== filterDept) {
                    return <td key={d} className="px-3 py-2 text-muted-foreground/40">·</td>;
                  }
                  return (
                    <td key={d} className="px-3 py-2">
                      <span className="rounded border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px]">
                        {crew?.name ?? "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
