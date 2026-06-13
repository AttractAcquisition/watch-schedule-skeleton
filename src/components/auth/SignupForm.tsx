import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import type { PlanType } from "@/lib/types";
import { PLANS } from "@/lib/constants";
import { toast } from "sonner";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [plan, setPlan] = useState<PlanType>("dual_watch");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) {
          toast.error("Passwords do not match.");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }
        setLoading(true);
        // The new-user database trigger creates the profile + inactive
        // subscription rows. The intended plan is stored in user metadata.
        const { error, needsConfirmation } = await signUp(email, password, { fullName, plan });
        setLoading(false);
        if (error) {
          toast.error(error);
          return;
        }
        if (needsConfirmation) {
          toast.success("Check your email to confirm your account, then sign in.");
          navigate("/login");
          return;
        }
        // Session is active immediately (email confirmation disabled) — gate
        // routing takes over from "/".
        navigate("/");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
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
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-foreground")
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
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
