import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

/**
 * ProtectedRoute — real Supabase session + subscription + onboarding gate.
 *
 * Routing rules:
 *   logged out                       -> /login
 *   logged in, unpaid                -> /payment-required
 *   paid, onboarding incomplete      -> /onboarding
 *   paid, onboarding complete        -> children
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, isPaid, hasCompletedOnboarding } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isPaid) {
      navigate("/payment-required", { replace: true });
      return;
    }
    if (!hasCompletedOnboarding && pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (hasCompletedOnboarding && pathname === "/onboarding") {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, isPaid, hasCompletedOnboarding, pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <div className="text-[11px] uppercase tracking-[0.28em]">Loading your vessel…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isPaid) return null;
  if (!hasCompletedOnboarding && pathname !== "/onboarding") return null;

  return <>{children}</>;
}
