import { useMemo } from "react";
import { useCrew, useLatestScheduleRun, useAssignments } from "@/hooks/data";

const ROLE_LABEL: Record<string, string> = {
  oow: "OOW",
  deck_watch: "Deck Watch",
  interior_watch: "Interior Watch",
  engineering_oow: "Engineering OOW",
  watchkeeper: "Watchkeeper",
};

export function SchedulePreview() {
  const latestRun = useLatestScheduleRun();
  const { data: rawAssignments } = useAssignments(latestRun.data?.id);
  const { data: crew } = useCrew();

  const crewById = useMemo(() => new Map((crew ?? []).map((c) => [c.id, c])), [crew]);

  const { days, roles, lookup } = useMemo(() => {
    const asgn = rawAssignments ?? [];

    const days = [...new Set(asgn.map((a) => a.assignment_date ?? a.watch_start.slice(0, 10)))]
      .sort()
      .slice(0, 7);

    const roles = [...new Set(asgn.flatMap((a) => (a.watch_role ? [a.watch_role] : [])))];

    // "date|role" → first crew_member_id found
    const lookup = new Map<string, string>();
    for (const a of asgn) {
      const date = a.assignment_date ?? a.watch_start.slice(0, 10);
      const role = a.watch_role ?? "";
      const key = `${date}|${role}`;
      if (!lookup.has(key)) lookup.set(key, a.crew_member_id);
    }

    return { days, roles, lookup };
  }, [rawAssignments]);

  if (latestRun.isLoading) {
    return (
      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Weekly Schedule Preview
        </div>
        <div className="p-8 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!latestRun.data || !days.length) {
    return (
      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Weekly Schedule Preview
        </div>
        <div className="p-8 text-sm text-muted-foreground">
          No schedule generated yet. Configure and regenerate from Settings.
        </div>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Weekly Schedule Preview · Week of {latestRun.data.start_date}
        </div>
        <div className="text-[11px] text-muted-foreground">v{latestRun.data.version}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Role</th>
              {days.map((d) => (
                <th key={d} className="px-3 py-2 text-[10px] font-medium">
                  {d.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{ROLE_LABEL[role] ?? role}</td>
                {days.map((d) => {
                  const crewMemberId = lookup.get(`${d}|${role}`);
                  const member = crewMemberId ? crewById.get(crewMemberId) : null;
                  return (
                    <td key={d} className="px-3 py-3 align-top">
                      <div className="rounded border border-primary/25 bg-primary/10 px-2 py-1.5">
                        <div className="text-[11px] text-foreground">
                          {member?.full_name ?? "—"}
                        </div>
                        <span className="mt-1 inline-flex rounded border border-border px-1 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          {latestRun.data?.status === "confirmed" ? "Confirmed" : "Draft"}
                        </span>
                      </div>
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
