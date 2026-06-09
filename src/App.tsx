import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { getAuthState } from "@/lib/authPlaceholder";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import PaymentRequired from "@/pages/PaymentRequired";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import CrewDatabase from "@/pages/CrewDatabase";
import WatchBuilder from "@/pages/WatchBuilder";
import ScheduleCalendar from "@/pages/ScheduleCalendar";
import FairnessEngine from "@/pages/FairnessEngine";
import CharterMode from "@/pages/CharterMode";
import LeaveManagement from "@/pages/LeaveManagement";
import ReportsExport from "@/pages/ReportsExport";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const state = getAuthState();

    if (!state.isAuthenticated) navigate("/login", { replace: true });
    else if (state.subscriptionStatus !== "active") {
      navigate("/payment-required", { replace: true });
    } else if (!state.hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

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
      <Route
        path="/crew"
        element={
          <ProtectedPage>
            <CrewDatabase />
          </ProtectedPage>
        }
      />
      <Route
        path="/watch-builder"
        element={
          <ProtectedPage>
            <WatchBuilder />
          </ProtectedPage>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedPage>
            <ScheduleCalendar />
          </ProtectedPage>
        }
      />
      <Route
        path="/fairness"
        element={
          <ProtectedPage>
            <FairnessEngine />
          </ProtectedPage>
        }
      />
      <Route
        path="/charter-mode"
        element={
          <ProtectedPage>
            <CharterMode />
          </ProtectedPage>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedPage>
            <LeaveManagement />
          </ProtectedPage>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedPage>
            <ReportsExport />
          </ProtectedPage>
        }
      />
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
