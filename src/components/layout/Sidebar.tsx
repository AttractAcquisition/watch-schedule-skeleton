import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Anchor, Compass } from "lucide-react";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { getAuthState, subscribeAuth, signOut } from "@/lib/authPlaceholder";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [auth, setAuth] = useState(getAuthState());
  useEffect(() => subscribeAuth(setAuth), []);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <Anchor className="h-4 w-4 opacity-80" />
        <span className="text-sm font-semibold tracking-tight">{BRAND.name}</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={
                "flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-colors " +
                (active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
              }
            >
              <span>{item.label}</span>
              {active && <Compass className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
            {auth.user?.initials ?? "—"}
          </div>
          <div>
            <div className="text-foreground">{auth.user?.fullName ?? "Guest"}</div>
            <div>{auth.user?.email ?? ""}</div>
          </div>
        </div>
        <button
          className="w-full rounded-md border border-border px-2 py-1.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
