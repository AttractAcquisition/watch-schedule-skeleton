import { createFileRoute } from "@tanstack/react-router";
import ScheduleCalendar from "@/pages/ScheduleCalendar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <ScheduleCalendar />
    </ProtectedRoute>
  ),
});
