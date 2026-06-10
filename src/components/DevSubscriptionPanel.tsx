// DEVELOPMENT ONLY — temporary subscription control for testing the payment
// gate before Stripe is wired up. Hidden entirely in production builds.
//
// TODO(stripe): remove this component once Stripe Checkout + webhook drive the
// subscription status. This is NOT a production billing replacement.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { IS_DEV } from "@/lib/supabase";
import { devActivateSubscription } from "@/lib/api";
import { PLAN_LABEL } from "@/lib/constants";
import type { PlanType } from "@/lib/types";

export function DevSubscriptionPanel({ compact = false }: { compact?: boolean }) {
  const { user, subscription, isAuthenticated, refreshAppState } = useAuth();
  const [plan, setPlan] = useState<PlanType>(
    (subscription?.plan_type as PlanType) ?? "triple_watch",
  );
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (!IS_DEV) return null;

  return (
    <div className={"panel " + (compact ? "p-4" : "p-5")}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Development only — remove before production
        </div>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          dev subscription
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Stripe is not configured. Use this to flag your account as paid so you can test onboarding
        and the dashboard. Writes <code>subscriptions.status = &apos;active&apos;</code> for the
        signed-in user.
      </p>

      {!isAuthenticated ? (
        <p className="mt-3 text-xs text-muted-foreground">Sign in first to use this control.</p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(["solo_watch", "dual_watch", "triple_watch"] as PlanType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={
                  "rounded-md border px-3 py-2 text-left text-xs " +
                  (plan === p
                    ? "border-foreground bg-secondary/40"
                    : "border-border text-muted-foreground hover:bg-secondary/30")
                }
              >
                {PLAN_LABEL[p]}
              </button>
            ))}
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              if (!user) return;
              setBusy(true);
              try {
                await devActivateSubscription(user.id, plan);
                await refreshAppState();
                toast.success("Subscription marked active (dev).");
                navigate("/");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to activate.");
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 w-full rounded-md border border-foreground bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-60"
          >
            {busy ? "Activating…" : `Mark as paid · ${PLAN_LABEL[plan]} (dev)`}
          </button>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Current status: {subscription?.status ?? "none"}
          </div>
        </>
      )}
    </div>
  );
}
