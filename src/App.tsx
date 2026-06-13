import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import PaymentRequired from "@/pages/PaymentRequired";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

function IndexRedirect() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isPaid, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) navigate("/login", { replace: true });
    else if (!isPaid) navigate("/payment-required", { replace: true });
    else if (!hasCompletedOnboarding) navigate("/onboarding", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [navigate, isLoading, isAuthenticated, isPaid, hasCompletedOnboarding]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="text-[11px] uppercase tracking-[0.28em]">Watch Schedule</div>
    </div>
  );
}

function ProtectedPage({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/payment-required" element={<PaymentRequired />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedPage>
            <Onboarding />
          </ProtectedPage>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        }
      />
      <Route path="/crew" element={<Navigate to="/settings#crew-database" replace />} />
      <Route path="/watch-builder" element={<Navigate to="/settings#regeneration" replace />} />
      <Route path="/calendar" element={<Navigate to="/dashboard" replace />} />
      <Route path="/fairness" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/charter-mode"
        element={<Navigate to="/settings#charter-mode-settings" replace />}
      />
      <Route path="/leave" element={<Navigate to="/settings#crew-database" replace />} />
      <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/settings"
        element={
          <ProtectedPage>
            <Settings />
          </ProtectedPage>
        }
      />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
