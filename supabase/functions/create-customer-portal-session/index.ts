// WatchSchedule — create-customer-portal-session Edge Function.
// Creates a Stripe Billing Portal session so subscribers can manage their plan,
// update payment methods, and cancel. Requires an active Stripe customer.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^17";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, HttpError } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req);
    const user = await requireUser(userClient);

    const body = await req.json();
    const { return_url } = body ?? {};
    if (!return_url) throw new HttpError("return_url is required.", 422);

    // Read stripe_customer_id using the caller's JWT (RLS: users can SELECT their own row).
    const { data: sub, error } = await userClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) throw new HttpError(error.message, 400);
    if (!sub?.stripe_customer_id) {
      throw new HttpError("No active Stripe subscription found for this account.", 404);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url,
    });

    return jsonResponse({ url: portal.url });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error.", status);
  }
});
