import { createFileRoute } from "@tanstack/react-router";
import ReportsExport from "@/pages/ReportsExport";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Export · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <ReportsExport />
    </ProtectedRoute>
  ),
});
