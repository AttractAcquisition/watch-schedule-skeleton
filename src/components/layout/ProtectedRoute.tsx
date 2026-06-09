import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuthState, subscribeAuth } from "@/lib/authPlaceholder";

/**
 * ProtectedRoute — mock auth/payment/onboarding gate.
 * TODO: replace mock states with real Supabase session + Stripe subscription check.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(getAuthState());
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => subscribeAuth(setAuth), []);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (auth.subscriptionStatus !== "active") {
      navigate("/payment-required", { replace: true });
      return;
    }
    if (!auth.hasCompletedOnboarding && pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (auth.hasCompletedOnboarding && pathname === "/onboarding") {
      navigate("/dashboard", { replace: true });
    }
  }, [auth, pathname, navigate]);

  if (!auth.isAuthenticated) return null;
  if (auth.subscriptionStatus !== "active") return null;
  if (!auth.hasCompletedOnboarding && pathname !== "/onboarding") return null;

  return <>{children}</>;
}
