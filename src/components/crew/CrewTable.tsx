import type { CrewMember } from "@/lib/types";
import { CrewStatusBadge } from "./CrewStatusBadge";
import { Switch } from "@/components/ui/switch";

export function CrewTable({
  crew,
  onEdit,
  onToggleEligible,
}: {
  crew: CrewMember[];
  onEdit: (c: CrewMember) => void;
  onToggleEligible: (c: CrewMember, v: boolean) => void;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Position</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Watch eligible</th>
            <th className="px-4 py-3 font-medium">Eligible roles</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Leave</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {crew.map((c) => (
            <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.position}</td>
              <td className="px-4 py-3 text-muted-foreground capitalize">{c.department}</td>
              <td className="px-4 py-3">
                <Switch checked={c.watchEligible} onCheckedChange={(v) => onToggleEligible(c, v)} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {c.eligibleRoles.length ? c.eligibleRoles.join(", ").replace(/_/g, " ") : "—"}
              </td>
              <td className="px-4 py-3">
                <CrewStatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                {c.leaveStart ? `${c.leaveStart} → ${c.leaveEnd}` : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => onEdit(c)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
