import { Link, useLocation } from "react-router-dom";
import { BarChart2, SlidersHorizontal } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Legacy — kept for any remaining usages
export function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <div className="grid grid-cols-2 gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "rounded-md border px-3 py-2 text-[12px]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/45 hover:bg-primary/10 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

const BOTTOM_TABS = [
  { to: "/dashboard", label: "Dashboard", Icon: BarChart2 },
  { to: "/settings", label: "Settings", Icon: SlidersHorizontal },
] as const;

// V2 mobile bottom tab bar
export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      {BOTTOM_TABS.map(({ to, label, Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
