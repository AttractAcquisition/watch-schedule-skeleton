import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthState, subscribeAuth } from "@/lib/authPlaceholder";
import { PLAN_LABEL } from "@/lib/constants";
import { MOCK_CHARTER, MOCK_VESSEL } from "@/lib/mockData";
import { toast } from "sonner";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const [auth, setAuth] = useState(getAuthState());
  useEffect(() => subscribeAuth(setAuth), []);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur md:px-6">
      <button
        className="rounded-md border border-border p-1.5 md:hidden"
        onClick={onMenu}
        aria-label="Menu"
      >
        <span className="block h-3 w-4 border-t border-b border-foreground" />
      </button>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="text-sm font-semibold tracking-tight">{MOCK_VESSEL.name}</div>
        <span className="hidden text-border md:inline">/</span>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:inline-flex"
        >
          {auth.currentPlan ? PLAN_LABEL[auth.currentPlan] : "No plan"}
        </Badge>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider md:inline-flex"
        >
          <span
            className={
              "mr-1.5 inline-block h-1.5 w-1.5 rounded-full " +
              (auth.subscriptionStatus === "active" ? "bg-success" : "bg-muted-foreground")
            }
          />
          {auth.subscriptionStatus === "active" ? "Active" : "Inactive"}
        </Badge>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:inline-flex"
        >
          Triple Watch
        </Badge>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground xl:inline-flex"
        >
          Charter {MOCK_CHARTER.active ? "Paused" : "Inactive"}
        </Badge>
        <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground xl:inline">
          {"{{VESSEL_NAME}} {{CURRENT_PLAN}} {{SUBSCRIPTION_STATUS}}"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() => {
            // TODO: call schedule generation Edge Function
            toast("Regenerate placeholder — schedule engine not yet connected.");
            navigate("/watch-builder");
          }}
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Regenerate Schedule
        </Button>
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            // TODO: call PDF export Edge Function
            toast("PDF export placeholder — backend connection required.");
            navigate("/reports");
          }}
        >
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          {auth.user?.initials ?? "—"}
        </div>
      </div>
    </header>
  );
}
