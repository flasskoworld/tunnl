// Creates a Stripe Checkout Session for the $49 Starter purchase.
// The visitor's email creates (or matches) their TUNNL account and
// signs them in immediately — no need to wait on a magic-link email
// for the happy path of returning to the same browser after paying.
//
// automatic Apple Pay / Google Pay: both surface as wallet buttons
// under "card" automatically on supported devices — no extra code.
// PayPal is enabled below and must also be turned on for the Stripe
// account under Dashboard > Settings > Payment methods.
import { NextResponse } from "next/server";
import { stripe, STARTER_PRICE_USD } from "../../../lib/stripe";
import { findOrCreateUser, createPendingPurchase, recordProductEvent } from "../../../lib/db";

export async function POST(request) {
  try {
    const { email, result } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (!result?.scores || !result?.memo || !result?.profile) {
      return NextResponse.json({ error: "Complete the diagnostic before checkout" }, { status: 400 });
    }
    if (JSON.stringify(result).length > 100000) {
      return NextResponse.json({ error: "Reading is too large" }, { status: 413 });
    }

    const user = await findOrCreateUser(email);
    const origin = process.env.APP_URL || new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: STARTER_PRICE_USD * 100,
            product_data: {
              name: "TUNNL — Starter",
              description:
                "Your 14-Day Plan, Decision Tools, and Sprint Report. One-time. Final sale.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user.id, readingSource: result.id || result.date || "diagnostic" },
      success_url: `${origin}/protocol?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=1`,
    });

    await createPendingPurchase(user.id, session.id, "starter", result);
    await recordProductEvent(user.id, "checkout_started", { product: "starter" });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: "Checkout could not be started" }, { status: 500 });
  }
}
