import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openStripeCustomerPortal } from "@/lib/stripePlaceholder";
import { DevMockStatePanel } from "@/components/DevMockStatePanel";
import { toast } from "sonner";
import { MOCK_VESSEL } from "@/lib/mockData";

const ROLES = ["Captain / Admin", "Officer", "Department Head", "Crew Member"];

export default function Settings() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="Account, vessel & billing"
        description="Manage account, vessel profile, plan, and role-based access. Real backend integration pending."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Account</div>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input defaultValue="Capt. James Whitcombe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="captain@meridian.yacht" type="email" />
            </div>
            <Button className="self-start" onClick={() => toast("Account saved (mock).")}>Save account</Button>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Vessel</div>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label>Vessel name</Label>
              <Input defaultValue={MOCK_VESSEL.name} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input defaultValue={MOCK_VESSEL.timezone} />
            </div>
            <Button className="self-start" onClick={() => toast("Vessel saved (mock).")}>Save vessel</Button>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Plan &amp; billing</div>
          <div className="mt-3 text-sm">
            Current plan: <span className="font-medium">Triple Watch</span> · £99/month
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Subscription managed via Stripe.</div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={async () => {
              await openStripeCustomerPortal(); // TODO: real Stripe portal
              toast("Stripe customer portal placeholder.");
            }}
          >
            Manage billing
          </Button>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Roles &amp; access</div>
          <div className="mt-3 space-y-2 text-sm">
            {ROLES.map((r) => (
              <div key={r} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span>{r}</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Placeholder</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <DevMockStatePanel />
        </div>
      </div>
    </AppShell>
  );
}
