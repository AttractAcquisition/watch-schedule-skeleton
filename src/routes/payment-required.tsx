import { createFileRoute } from "@tanstack/react-router";
import PaymentRequired from "@/pages/PaymentRequired";

export const Route = createFileRoute("/payment-required")({
  head: () => ({ meta: [{ title: "Choose your plan · Watch Schedule" }] }),
  component: PaymentRequired,
});
