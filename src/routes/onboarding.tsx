import { createFileRoute } from "@tanstack/react-router";
import Onboarding from "@/pages/Onboarding";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Vessel setup · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  ),
});
