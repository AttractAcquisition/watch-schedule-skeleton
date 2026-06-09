import { MOCK_CREW } from "@/lib/mockData";
import { Switch } from "@/components/ui/switch";

export function DepartmentReviewStep() {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Position</th>
            <th className="px-4 py-3 font-medium">Suggested department</th>
            <th className="px-4 py-3 font-medium">Watch eligible</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {MOCK_CREW.map((c) => (
            <tr key={c.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2">{c.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{c.position}</td>
              <td className="px-4 py-2 text-muted-foreground capitalize">{c.department}</td>
              <td className="px-4 py-2"><Switch defaultChecked={c.watchEligible} /></td>
              <td className="px-4 py-2 text-right text-xs text-muted-foreground">Edit</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
