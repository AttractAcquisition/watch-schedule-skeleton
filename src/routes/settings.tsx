import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  ),
});
