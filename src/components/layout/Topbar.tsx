import { useNavigate } from "react-router-dom";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, initialsFromName } from "@/lib/auth";
import { PLAN_LABEL } from "@/lib/constants";
import type { PlanType } from "@/lib/types";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, profile, subscription, vessel, isPaid } = useAuth();
  const navigate = useNavigate();

  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;
  const initials = initialsFromName(profile?.full_name, user?.email);

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
        <div className="text-sm font-semibold tracking-tight">{vessel?.name ?? "Your vessel"}</div>
        <span className="hidden text-border md:inline">/</span>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:inline-flex"
        >
          {planType ? PLAN_LABEL[planType] : "No plan"}
        </Badge>
        <Badge
          variant="outline"
          className="hidden border-border text-[10px] font-medium uppercase tracking-wider md:inline-flex"
        >
          <span
            className={
              "mr-1.5 inline-block h-1.5 w-1.5 rounded-full " +
              (isPaid ? "bg-success" : "bg-muted-foreground")
            }
          />
          {subscription?.status === "active"
            ? "Active"
            : subscription?.status === "trialing"
              ? "Trial"
              : "Inactive"}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() => navigate("/watch-builder")}
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Regenerate Schedule
        </Button>
        <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/reports")}>
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          {initials}
        </div>
      </div>
    </header>
  );
}
