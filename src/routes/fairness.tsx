import { createFileRoute } from "@tanstack/react-router";
import FairnessEngine from "@/pages/FairnessEngine";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/fairness")({
  head: () => ({ meta: [{ title: "Fairness Engine · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <FairnessEngine />
    </ProtectedRoute>
  ),
});
