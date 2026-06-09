import { createFileRoute } from "@tanstack/react-router";
import LeaveManagement from "@/pages/LeaveManagement";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/leave")({
  head: () => ({ meta: [{ title: "Leave Management · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <LeaveManagement />
    </ProtectedRoute>
  ),
});
