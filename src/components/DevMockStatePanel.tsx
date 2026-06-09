import { useEffect, useState } from "react";
import { getAuthState, setMockState, subscribeAuth, type MockState } from "@/lib/authPlaceholder";

const OPTIONS: { id: MockState; label: string }[] = [
  { id: "logged_out", label: "Logged out" },
  { id: "logged_in_unpaid", label: "Logged in · unpaid" },
  { id: "logged_in_paid_new", label: "Logged in · paid · new user" },
  { id: "logged_in_paid_onboarded", label: "Logged in · paid · onboarded" },
];

export function DevMockStatePanel({ compact = false }: { compact?: boolean }) {
  const [auth, setAuth] = useState(getAuthState());
  useEffect(() => subscribeAuth(setAuth), []);

  return (
    <div className={"panel " + (compact ? "p-4" : "p-5")}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Developer · Mock State
        </div>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          frontend only
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Switch between auth / payment / onboarding states for testing. Replaced with real Supabase + Stripe state later.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setMockState(o.id)}
            className={
              "rounded-md border px-3 py-2 text-left text-xs " +
              (auth.mockState === o.id
                ? "border-foreground bg-secondary/40"
                : "border-border text-muted-foreground hover:bg-secondary/30")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
