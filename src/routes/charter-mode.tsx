import { createFileRoute } from "@tanstack/react-router";
import CharterMode from "@/pages/CharterMode";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/charter-mode")({
  head: () => ({ meta: [{ title: "Charter Mode · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <CharterMode />
    </ProtectedRoute>
  ),
});
