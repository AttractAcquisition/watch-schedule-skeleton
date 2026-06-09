import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/lib/authPlaceholder";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("captain@meridian.yacht");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        await signInWithEmail(email, password); // TODO: connect to Supabase
        setLoading(false);
        navigate({ to: "/dashboard" });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => toast("Magic link placeholder — backend connection required.")}
      >
        Send magic link
      </Button>
      <p className="pt-2 text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
