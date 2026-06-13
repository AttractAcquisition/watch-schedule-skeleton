// DEVELOPMENT ONLY — visible only when import.meta.env.DEV is true.
// Direct client writes to subscriptions are blocked by RLS in all environments.
// For local subscription testing use the Stripe CLI to replay webhook events:
//   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
//   stripe trigger checkout.session.completed

import { useAuth } from "@/lib/auth";

export function DevSubscriptionPanel({ compact = false }: { compact?: boolean }) {
  const { subscription } = useAuth();

  if (!import.meta.env.DEV) return null;

  return (
    <div className={"panel " + (compact ? "p-4" : "p-5")}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Development only
        </div>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          dev info
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Direct client writes to <code>subscriptions</code> are blocked by RLS. To test the payment
        gate locally, use the Stripe CLI:
      </p>
      <pre className="mt-2 overflow-x-auto rounded border border-border bg-surface px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        {[
          "stripe listen \\",
          "  --forward-to localhost:54321/functions/v1/stripe-webhook",
          "",
          "stripe trigger checkout.session.completed",
        ].join("\n")}
      </pre>
      <div className="mt-2 text-[10px] text-muted-foreground">
        Current status:{" "}
        <span className="font-medium text-foreground">{subscription?.status ?? "none"}</span>
        {subscription?.stripe_customer_id && (
          <span className="ml-2 text-muted-foreground/60">
            cus: {subscription.stripe_customer_id}
          </span>
        )}
      </div>
    </div>
  );
}
