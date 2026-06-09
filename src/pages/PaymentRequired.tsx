import { Button } from "@/components/ui/button";
import { BRAND, PLANS } from "@/lib/constants";
import { createStripeCheckoutSession } from "@/lib/stripePlaceholder";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export default function PaymentRequired() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {BRAND.name}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Choose your watch system
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pricing scales with the watch architecture you operate. Cancel any time.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={
                "panel relative flex flex-col p-6 " +
                (p.popular ? "border-foreground" : "")
              }
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-6 rounded border border-foreground bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em]">
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
                onClick={async () => {
                  await createStripeCheckoutSession(p.id); // TODO: real Stripe checkout
                  toast("Stripe checkout placeholder — backend connection required.");
                  navigate({ to: "/payment-success" });
                }}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
