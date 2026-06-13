import { useMemo } from "react";
import { useCrew, useLatestScheduleRun, useAssignments } from "@/hooks/data";

const ROLE_LABEL: Record<string, string> = {
  oow: "OOW",
  deck_watch: "Deck Watch",
  interior_watch: "Interior Watch",
  engineering_oow: "Engineering OOW",
  watchkeeper: "Watchkeeper",
};

function formatBlock(watchStart: string, watchEnd: string): string {
  return `${watchStart.slice(11, 16)}–${watchEnd.slice(11, 16)}`;
}

export function ScheduleGrid({ filterDept }: { filterDept?: string }) {
  const latestRun = useLatestScheduleRun();
  const { data: rawAssignments, isLoading } = useAssignments(latestRun.data?.id);
  const { data: crew } = useCrew();

  const crewById = useMemo(() => new Map((crew ?? []).map((c) => [c.id, c])), [crew]);

  const { days, blockLabels, roles, lookup } = useMemo(() => {
    const asgn = rawAssignments ?? [];

    const days = [...new Set(asgn.map((a) => a.assignment_date ?? a.watch_start.slice(0, 10)))]
      .sort()
      .slice(0, 7);

    const blockLabels = [...new Set(asgn.map((a) => formatBlock(a.watch_start, a.watch_end)))];

    const roles = [...new Set(asgn.flatMap((a) => (a.watch_role ? [a.watch_role] : [])))];

    // "date|blockLabel|role" → crew_member_id (first assignment wins)
    const lookup = new Map<string, string>();
    for (const a of asgn) {
      const date = a.assignment_date ?? a.watch_start.slice(0, 10);
      const block = formatBlock(a.watch_start, a.watch_end);
      const role = a.watch_role ?? "";
      const key = `${date}|${block}|${role}`;
      if (!lookup.has(key)) lookup.set(key, a.crew_member_id);
    }

    return { days, blockLabels, roles, lookup };
  }, [rawAssignments]);

  if (latestRun.isLoading || isLoading) {
    return <div className="panel p-8 text-sm text-muted-foreground">Loading schedule…</div>;
  }
  if (!latestRun.data) {
    return (
      <div className="panel p-8 text-sm text-muted-foreground">
        No schedule generated yet. Configure watch settings and regenerate from Settings.
      </div>
    );
  }
  if (!days.length) {
    return (
      <div className="panel p-8 text-sm text-muted-foreground">
        No assignments found in this schedule run.
      </div>
    );
  }

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
          {blockLabels.map((b) =>
            roles.map((r) => (
              <tr key={b + r} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{b}</td>
                <td className="px-3 py-2 text-muted-foreground">{ROLE_LABEL[r] ?? r}</td>
                {days.map((d) => {
                  const crewMemberId = lookup.get(`${d}|${b}|${r}`);
                  const member = crewMemberId ? crewById.get(crewMemberId) : null;
                  if (filterDept && filterDept !== "all" && member?.department !== filterDept) {
                    return (
                      <td key={d} className="px-3 py-2 text-muted-foreground/40">
                        ·
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="px-3 py-2">
                      <span className="rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] text-foreground">
                        {member?.full_name ?? (crewMemberId ? "—" : "·")}
                      </span>
                    </td>
                  );
                })}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
