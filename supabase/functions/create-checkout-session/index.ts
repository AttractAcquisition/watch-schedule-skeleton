// WatchSchedule — create-checkout-session Edge Function.
// Creates a Stripe Checkout session for the selected plan and returns the
// redirect URL. The stripe-webhook function is the authoritative writer for
// the subscriptions table; this function never sets status directly.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^17";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getUserClient, requireUser, HttpError } from "../_shared/client.ts";

type PlanType = "solo_watch" | "dual_watch" | "triple_watch";

const PRICE_ENV: Record<PlanType, string> = {
  solo_watch: "STRIPE_PRICE_SOLO_WATCH",
  dual_watch: "STRIPE_PRICE_DUAL_WATCH",
  triple_watch: "STRIPE_PRICE_TRIPLE_WATCH",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req);
    const user = await requireUser(userClient);

    const body = await req.json();
    const { plan_type, success_url, cancel_url } = body ?? {};

    if (!plan_type || !(plan_type in PRICE_ENV)) {
      throw new HttpError("plan_type must be solo_watch, dual_watch, or triple_watch.", 422);
    }
    if (!success_url || !cancel_url) {
      throw new HttpError("success_url and cancel_url are required.", 422);
    }

    const priceId = Deno.env.get(PRICE_ENV[plan_type as PlanType]);
    if (!priceId) throw new HttpError(`Stripe price not configured for ${plan_type}.`, 503);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    // Look up any existing Stripe customer stored from a previous checkout.
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: existing } = await serviceClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let customerId: string | undefined = existing?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      // user_id and plan_type are forwarded to the webhook via metadata so the
      // stripe-webhook function can write the subscription row authoritatively.
      metadata: { user_id: user.id, plan_type },
      subscription_data: { metadata: { user_id: user.id, plan_type } },
    });

    if (!session.url) throw new HttpError("Stripe did not return a checkout URL.", 502);
    return jsonResponse({ url: session.url });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return errorResponse(err instanceof Error ? err.message : "Unexpected error.", status);
  }
});
