import { createFileRoute } from "@tanstack/react-router";
import CrewDatabase from "@/pages/CrewDatabase";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/crew")({
  head: () => ({ meta: [{ title: "Crew Database · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <CrewDatabase />
    </ProtectedRoute>
  ),
});
