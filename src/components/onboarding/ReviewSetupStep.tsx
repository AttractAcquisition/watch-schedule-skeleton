import { MOCK_CREW, MOCK_VESSEL } from "@/lib/mockData";
import { PLAN_LABEL } from "@/lib/constants";

export function ReviewSetupStep() {
  const deps = Array.from(new Set(MOCK_CREW.map((c) => c.department)));
  const rows = [
    ["Vessel", MOCK_VESSEL.name],
    ["Plan", PLAN_LABEL[MOCK_VESSEL.plan]],
    ["Crew count", String(MOCK_CREW.length)],
    ["Departments", deps.join(", ")],
    ["Watch mode", "Triple Watch"],
    ["Rules enabled", "Weekend rotation, fairness balancing, rest-hour aware warnings, PDF exports"],
  ];
  return (
    <div className="panel divide-y divide-border">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[180px_1fr] gap-4 px-5 py-3 text-sm">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{k}</div>
          <div>{v}</div>
        </div>
      ))}
    </div>
  );
}
