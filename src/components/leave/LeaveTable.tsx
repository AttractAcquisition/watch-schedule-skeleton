import { useLeave, useCrew } from "@/hooks/data";
import { CrewStatusBadge } from "@/components/crew/CrewStatusBadge";
import type { CrewStatus } from "@/lib/types";

// crew_availability.status includes "available" which is not in CrewStatus;
// guard before passing to CrewStatusBadge.
const CREW_STATUS_VALUES = new Set<string>([
  "active",
  "on_leave",
  "sick",
  "off_vessel",
  "training",
  "unavailable",
]);

export function LeaveTable() {
  const { data: leave, isLoading, error } = useLeave();
  const { data: crew } = useCrew();
  const crewById = new Map((crew ?? []).map((c) => [c.id, c]));

  if (isLoading) {
    return <div className="panel p-8 text-sm text-muted-foreground">Loading leave records…</div>;
  }
  if (error) {
    return (
      <div className="panel p-8 text-sm text-muted-foreground">Failed to load leave records.</div>
    );
  }
  if (!leave?.length) {
    return <div className="panel p-8 text-sm text-muted-foreground">No leave records found.</div>;
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Crew</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Start</th>
            <th className="px-4 py-3 font-medium">End</th>
            <th className="px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {leave.map((l) => {
            const member = crewById.get(l.crew_member_id);
            const isKnownStatus = l.status !== null && CREW_STATUS_VALUES.has(l.status);
            return (
              <tr key={l.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{member?.full_name ?? "—"}</td>
                <td className="px-4 py-2">
                  {isKnownStatus ? (
                    <CrewStatusBadge status={l.status as CrewStatus} />
                  ) : (
                    <span className="text-xs text-muted-foreground">{l.status ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">
                  {l.start_date}
                </td>
                <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">
                  {l.end_date}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{l.notes ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
