import { Switch } from "@/components/ui/switch";

export function RuleBuilder() {
  const rules = [
    "Weekday and weekend schedules rotate differently",
    "Avoid multiple watch days in a row",
    "Balance weekend watches",
    "Balance night watches",
    "Balance department load",
    "Enable Charter Mode",
    "Enable Leave Management",
    "Enable rest-hour aware warnings",
    "Require Submit & Confirm before schedule goes live",
  ];
  return (
    <div className="panel divide-y divide-border">
      {rules.map((r) => (
        <div key={r} className="flex items-center justify-between px-5 py-3 text-sm">
          <span>{r}</span>
          <Switch defaultChecked />
        </div>
      ))}
    </div>
  );
}
