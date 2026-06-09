import { MOCK_LEAVE, MOCK_CREW } from "@/lib/mockData";
import { CrewStatusBadge } from "@/components/crew/CrewStatusBadge";

export function LeaveTable() {
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
          {MOCK_LEAVE.map((l) => {
            const crew = MOCK_CREW.find((c) => c.id === l.crewMemberId);
            return (
              <tr key={l.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{crew?.name}</td>
                <td className="px-4 py-2"><CrewStatusBadge status={l.status} /></td>
                <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">{l.startDate}</td>
                <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">{l.endDate}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{l.notes ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
