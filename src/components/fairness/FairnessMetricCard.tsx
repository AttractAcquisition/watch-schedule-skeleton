export function FairnessMetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}%</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-success" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
