export function WatchTodayCard() {
  const today = new Date().toISOString().slice(0, 10);
  const todays = [
    ["Deck/OOW Watch", "Sarah Mills", "20:00-00:00"],
    ["Interior Watch", "Lisa Green", "20:00-00:00"],
    ["Engineering OOW", "Marco Rossi", "20:00-00:00"],
  ];
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Today's Watches
        </div>
        <div className="text-[11px] text-muted-foreground">{today}</div>
      </div>
      <div className="mt-4 divide-y divide-border">
        {todays.map(([role, crew, block]) => (
          <div key={role} className="flex items-center justify-between py-2.5 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground">{block}</span>
              <span className="text-foreground">{crew}</span>
            </div>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
