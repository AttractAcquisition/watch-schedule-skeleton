import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAuthState } from "@/lib/authPlaceholder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Watch Schedule — Professional watch scheduling for superyacht teams" },
      { name: "description", content: "Fair, professional watch rotas for superyacht captains and crew. Solo, Dual, and Triple Watch systems with fairness balancing, charter mode, and rest-hour aware warnings." },
      { property: "og:title", content: "Watch Schedule" },
      { property: "og:description", content: "Professional watch scheduling for superyacht teams." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const s = getAuthState();
    if (!s.isAuthenticated) navigate({ to: "/login" });
    else if (s.subscriptionStatus !== "active") navigate({ to: "/payment-required" });
    else if (!s.hasCompletedOnboarding) navigate({ to: "/onboarding" });
    else navigate({ to: "/dashboard" });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="text-[11px] uppercase tracking-[0.28em]">Watch Schedule</div>
    </div>
  );
}
