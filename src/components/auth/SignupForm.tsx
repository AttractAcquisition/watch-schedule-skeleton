import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithEmail } from "@/lib/authPlaceholder";
import type { PlanType } from "@/lib/types";
import { PLANS } from "@/lib/constants";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [plan, setPlan] = useState<PlanType>("dual_watch");
  const navigate = useNavigate();

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) return;
        await signUpWithEmail(email, password, plan); // TODO: Supabase signUp
        navigate({ to: "/payment-required" });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Intended plan</Label>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={
                "rounded-md border px-2 py-2 text-xs " +
                (plan === p.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-secondary")
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full">
        Create account
      </Button>
      <p className="pt-1 text-center text-[11px] text-muted-foreground">
        Payment and vessel setup will follow after account creation.
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
