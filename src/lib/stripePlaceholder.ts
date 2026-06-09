// Watch Schedule — Stripe placeholders.
// TODO: call real Stripe checkout session endpoint via server function.

import type { PlanType, SubscriptionStatus } from "./types";
import { setMockState } from "./authPlaceholder";

export async function getSubscriptionStatus(
  _userId: string
): Promise<SubscriptionStatus> {
  // TODO: read subscription from Supabase / Stripe
  return "active";
}

export async function createStripeCheckoutSession(planId: PlanType) {
  // TODO: POST to /api/public/stripe/checkout returning a hosted checkout URL
  console.info("[stripe placeholder] createStripeCheckoutSession", planId);
  // Simulate successful payment for the demo flow:
  setTimeout(() => setMockState("logged_in_paid_new"), 600);
  return { url: "/payment-success" };
}

export async function openStripeCustomerPortal() {
  // TODO: POST to /api/public/stripe/portal returning portal URL
  console.info("[stripe placeholder] openStripeCustomerPortal");
  return { url: "#" };
}
