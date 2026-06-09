import { Button } from "@/components/ui/button";
import { BRAND, PLANS } from "@/lib/constants";
import { mockCreateCheckoutSession } from "@/lib/stripePlaceholder";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DevMockStatePanel } from "@/components/DevMockStatePanel";

export default function PaymentRequired() {
  const navigate = useNavigate();
  const [successOpen, setSuccessOpen] = useState(false);
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
            Select the watch structure your vessel needs. Payment will be handled securely through
            Stripe.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={
                "panel relative flex flex-col p-6 " + (p.popular ? "border-foreground" : "")
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
                  await mockCreateCheckoutSession(p.id); // TODO: real Stripe checkout
                  toast("Stripe Checkout placeholder. Backend connection required.");
                  setSuccessOpen(true);
                }}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <DevMockStatePanel compact />
        </div>
      </div>
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment successful - continue to onboarding</DialogTitle>
            <DialogDescription>
              Stripe Checkout placeholder completed. Backend connection required before production.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/payment-success")}>Continue to /payment-success</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
