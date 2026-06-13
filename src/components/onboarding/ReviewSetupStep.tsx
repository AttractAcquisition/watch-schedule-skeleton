export function ReviewSetupStep() {
  const rows = [
    ["Vessel", "Configured from your setup form"],
    ["Plan", "Loaded from your subscription"],
    ["Crew count", "Add crew from Settings"],
    ["Departments", "Configure after setup"],
    ["Watch mode", "Loaded from your plan"],
    ["Department breakdown", "Available once crew are added"],
    [
      "Rules enabled",
      "Weekend rotation, fairness balancing, charter pauses, leave management, rest-hour aware warnings, Submit & Confirm",
    ],
  ];
  return (
    <div className="space-y-4">
      <div className="panel divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[180px_1fr] gap-4 px-5 py-3 text-sm">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {k}
            </div>
            <div>{v}</div>
          </div>
        ))}
      </div>
      <div className="panel p-4 text-xs text-muted-foreground">
        Crew and vessel data will be protected through authenticated access and vessel-level
        permissions once Supabase is connected.
      </div>
    </div>
  );
}
