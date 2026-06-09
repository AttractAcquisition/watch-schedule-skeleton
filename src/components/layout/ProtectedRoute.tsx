import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getAuthState, subscribeAuth } from "@/lib/authPlaceholder";

/**
 * ProtectedRoute — mock auth/payment/onboarding gate.
 * TODO: replace mock states with real Supabase session + Stripe subscription check.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(getAuthState());
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => subscribeAuth(setAuth), []);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (auth.subscriptionStatus !== "active") {
      navigate({ to: "/payment-required" });
      return;
    }
    if (!auth.hasCompletedOnboarding && pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
      return;
    }
    if (auth.hasCompletedOnboarding && pathname === "/onboarding") {
      navigate({ to: "/dashboard" });
    }
  }, [auth, pathname, navigate]);

  if (!auth.isAuthenticated) return null;
  if (auth.subscriptionStatus !== "active") return null;
  if (!auth.hasCompletedOnboarding && pathname !== "/onboarding") return null;

  return <>{children}</>;
}
