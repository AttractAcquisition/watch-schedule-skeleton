import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND, PLANS } from "@/lib/constants";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { createCheckoutSession, createCustomerPortalSession } from "@/lib/edgeFunctions";
import { DevSubscriptionPanel } from "@/components/DevSubscriptionPanel";
import type { PlanType } from "@/lib/types";

export default function PaymentRequired() {
  const { subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const hasStripeCustomer = Boolean(subscription?.stripe_customer_id);

  async function handleSelectPlan(planId: PlanType) {
    setLoadingPlan(planId);
    try {
      const { url } = await createCheckoutSession({
        plan_type: planId,
        success_url: `${window.location.origin}/?checkout=success`,
        cancel_url: `${window.location.origin}/payment-required`,
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout. Try again.");
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { url } = await createCustomerPortalSession({
        return_url: `${window.location.origin}/payment-required`,
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal.");
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {BRAND.name}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Choose your Watch Schedule plan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select the watch structure your vessel needs. Payment is handled securely through
            Stripe.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={"panel relative flex flex-col p-6 " + (p.popular ? "border-primary" : "")}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-6 rounded border border-primary bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                  Most popular
                </span>
              )}
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.per}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.blurb}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 text-[11px] text-muted-foreground">{p.typical}</div>
              <Button
                className="mt-6"
                disabled={loadingPlan !== null}
                onClick={() => handleSelectPlan(p.id)}
              >
                {loadingPlan === p.id ? "Redirecting…" : p.cta}
              </Button>
            </div>
          ))}
        </div>

        {hasStripeCustomer && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              disabled={portalLoading}
              onClick={handleManageBilling}
              className="gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {portalLoading ? "Opening portal…" : "Manage billing"}
            </Button>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="mt-6">
            <DevSubscriptionPanel compact />
          </div>
        )}
      </div>
    </div>
  );
}
