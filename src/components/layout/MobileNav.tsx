import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/lib/constants";

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
            className={
              "rounded-md border px-3 py-2 text-[12px] " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
