// WatchSchedule — stripe-webhook Edge Function.
// Receives Stripe events, verifies the signature, and is the ONLY writer for
// subscription status. Runs with the service_role key so it can bypass RLS.
// verify_jwt = false: the request comes from Stripe, not a logged-in user.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^17";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../_shared/cors.ts";

type PlanType = "solo_watch" | "dual_watch" | "triple_watch";

function planFromPriceId(priceId: string): PlanType | null {
  const map: Record<string, PlanType> = {};
  const solo = Deno.env.get("STRIPE_PRICE_SOLO_WATCH");
  const dual = Deno.env.get("STRIPE_PRICE_DUAL_WATCH");
  const triple = Deno.env.get("STRIPE_PRICE_TRIPLE_WATCH");
  if (solo) map[solo] = "solo_watch";
  if (dual) map[dual] = "dual_watch";
  if (triple) map[triple] = "triple_watch";
  return map[priceId] ?? null;
}

const STRIPE_TO_DB_STATUS: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "cancelled",
  unpaid: "past_due",
  paused: "inactive",
  incomplete: "inactive",
  incomplete_expired: "inactive",
};

async function upsertSubscription(
  db: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>,
) {
  const { data: existing } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await db.from("subscriptions").update(patch).eq("id", existing.id);
  } else {
    await db.from("subscriptions").insert({ user_id: userId, ...patch });
  }
}

Deno.serve(async (req: Request) => {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return errorResponse("Missing Stripe-Signature header.", 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      );
    } catch {
      return errorResponse("Webhook signature verification failed.", 400);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = (session.metadata?.plan_type ?? null) as PlanType | null;
        if (!userId) break;

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const stripeSubId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        let periodEnd: string | null = null;
        if (stripeSubId) {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        }

        await upsertSubscription(db, userId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubId,
          plan_type: planType,
          status: "active",
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        });
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;
        const priceId = stripeSub.items.data[0]?.price.id ?? null;
        const planType = priceId ? planFromPriceId(priceId) : null;
        const status = STRIPE_TO_DB_STATUS[stripeSub.status] ?? "inactive";
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

        await db
          .from("subscriptions")
          .update({
            stripe_subscription_id: stripeSub.id,
            plan_type: planType,
            status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;
        await db
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
        if (!customerId) break;
        await db
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Return 200 for unhandled events so Stripe does not retry them.
        break;
    }

    return jsonResponse({ received: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Webhook handler error.", 500);
  }
});
