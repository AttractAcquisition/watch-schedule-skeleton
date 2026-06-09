import { createFileRoute } from "@tanstack/react-router";
import WatchBuilder from "@/pages/WatchBuilder";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export const Route = createFileRoute("/watch-builder")({
  head: () => ({ meta: [{ title: "Watch Builder · Watch Schedule" }] }),
  component: () => (
    <ProtectedRoute>
      <WatchBuilder />
    </ProtectedRoute>
  ),
});
