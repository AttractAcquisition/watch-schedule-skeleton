import { MOCK_CHARTER } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export function CharterStatusCard() {
  const c = MOCK_CHARTER;
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Charter Status
        </div>
        <Badge variant="outline" className="border-border text-[10px] uppercase tracking-wider">
          {c.active ? "Active" : "Scheduled"}
        </Badge>
      </div>
      <div className="mt-3 text-sm">
        Charter from <span className="font-mono">{c.startDate}</span> →{" "}
        <span className="font-mono">{c.endDate}</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Engineering watch {c.keepEngineering ? "maintained" : "paused"} · Security{" "}
        {c.keepSecurity ? "maintained" : "paused"}
      </div>
    </div>
  );
}
