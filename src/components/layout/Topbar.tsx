import { Link, useLocation, useNavigate } from "react-router-dom";
import { Anchor, LogOut, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, initialsFromName } from "@/lib/auth";
import { BRAND, PLAN_LABEL } from "@/lib/constants";
import type { PlanType } from "@/lib/types";
import { cn } from "@/lib/utils";

function NavTab({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={cn(
        "rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const { user, profile, subscription, vessel, isPaid, signOut } = useAuth();

  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;
  const initials = initialsFromName(profile?.full_name, user?.email);
  const fullName = profile?.full_name || user?.email || "Account";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 md:px-8">
        {/* Wordmark */}
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
          <Anchor className="h-[15px] w-[15px] text-primary" />
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            {BRAND.name}
          </span>
        </Link>

        {/* Vessel info — desktop only */}
        <div className="hidden items-center gap-2 text-sm md:flex">
          <div className="mx-1 h-4 w-px bg-border" />
          <span className="max-w-[180px] truncate font-medium text-foreground">
            {vessel?.name ?? "Vessel"}
          </span>
          {planType && (
            <Badge
              variant="outline"
              className="border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {PLAN_LABEL[planType]}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-border text-[10px] font-medium uppercase tracking-wider"
          >
            <span
              className={cn(
                "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                isPaid ? "bg-success" : "bg-muted-foreground",
              )}
            />
            {subscription?.status === "active"
              ? "Active"
              : subscription?.status === "trialing"
                ? "Trial"
                : "Inactive"}
          </Badge>
        </div>

        {/* Segmented nav — desktop */}
        <div className="ml-auto hidden items-center gap-1 rounded-lg border border-border bg-background/50 p-1 md:flex">
          <NavTab to="/dashboard" label="Dashboard" />
          <NavTab to="/settings" label="Settings" />
        </div>

        {/* Account dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring md:ml-3"
              aria-label="Account menu"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              {fullName}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="-mt-1 text-[11px] font-normal text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <User className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
