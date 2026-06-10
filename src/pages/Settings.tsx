import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DevSubscriptionPanel } from "@/components/DevSubscriptionPanel";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { updateProfile, updateVessel } from "@/lib/api";
import { PLAN_LABEL } from "@/lib/constants";
import type { PlanType } from "@/lib/types";

const ROLES = ["Captain/Admin", "Officer", "Department Head", "Crew Member", "Viewer"];

export default function Settings() {
  const { user, profile, subscription, vessel, signOut, refreshAppState } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [vesselLength, setVesselLength] = useState("");
  const [timezone, setTimezone] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingVessel, setSavingVessel] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setVesselName(vessel?.name ?? "");
    setVesselLength(vessel?.length_meters ? String(vessel.length_meters) : "");
    setTimezone(vessel?.timezone ?? "");
  }, [profile, vessel]);

  const planType = (subscription?.plan_type ?? vessel?.plan_type) as PlanType | null | undefined;

  async function saveAccount() {
    if (!user) return;
    setSavingAccount(true);
    try {
      await updateProfile(user.id, { full_name: fullName });
      await refreshAppState();
      toast.success("Account saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save account.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveVessel() {
    if (!vessel) {
      toast.error("No vessel yet — complete onboarding first.");
      return;
    }
    setSavingVessel(true);
    try {
      await updateVessel(vessel.id, {
        name: vesselName,
        length_meters: vesselLength ? Number(vesselLength) : null,
        timezone: timezone || "UTC",
      });
      await refreshAppState();
      toast.success("Vessel saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save vessel.");
    } finally {
      setSavingVessel(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="Account, vessel & billing"
        description="Manage account, vessel profile, plan, and role-based access."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Account
          </div>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} type="email" disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile?.role ?? "captain"} disabled />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveAccount} disabled={savingAccount}>
                {savingAccount ? "Saving…" : "Save account"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Vessel
          </div>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label>Vessel name</Label>
              <Input value={vesselName} onChange={(e) => setVesselName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vessel length (m)</Label>
              <Input value={vesselLength} onChange={(e) => setVesselLength(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <Button className="self-start" onClick={saveVessel} disabled={savingVessel}>
              {savingVessel ? "Saving…" : "Save vessel"}
            </Button>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Plan &amp; billing
          </div>
          <div className="mt-3 text-sm">
            Current plan:{" "}
            <span className="font-medium">{planType ? PLAN_LABEL[planType] : "None"}</span> ·
            Subscription status: {subscription?.status ?? "inactive"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Billing email: {user?.email ?? "—"}
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => toast("Stripe customer portal is not configured yet.")}
          >
            Manage billing
          </Button>
          <div className="mt-3 font-mono text-[10px] text-muted-foreground">
            TODO: connect Stripe Customer Portal
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Roles &amp; access
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {ROLES.map((r) => (
              <div
                key={r}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span>{r}</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {r === "Captain/Admin" ? "You" : "Invite later"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            TODO: crew/member invitations and fine-grained permissions.
          </p>
        </div>

        <div className="lg:col-span-2 panel p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Security
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            All vessel and crew data is protected by Supabase Row Level Security — access is scoped
            to the vessel owner and members.
          </p>
        </div>

        <div className="lg:col-span-2">
          <DevSubscriptionPanel />
        </div>
      </div>
    </AppShell>
  );
}
