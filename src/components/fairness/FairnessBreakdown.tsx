import { MOCK_FAIRNESS, MOCK_CREW } from "@/lib/mockData";

export function FairnessBreakdown() {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Crew member</th>
            <th className="px-4 py-3 font-medium">Watches</th>
            <th className="px-4 py-3 font-medium">Nights</th>
            <th className="px-4 py-3 font-medium">Weekends</th>
            <th className="px-4 py-3 font-medium">Fairness</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_FAIRNESS.perCrew.map((row) => {
            const crew = MOCK_CREW.find((c) => c.id === row.crewMemberId);
            return (
              <tr key={row.crewMemberId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{crew?.name}</td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.watches}</td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.nights}</td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{row.weekends}</td>
                <td className="px-4 py-2 font-mono">{row.score}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
