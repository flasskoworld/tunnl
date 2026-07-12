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
import { findOrCreateUser, createPendingPurchase } from "../../../lib/db";
import { setSessionCookie } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { email, readingId } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
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
              name: "TUNNL — The Protocol",
              description:
                "The full memo unlocked, the 14-Day Protocol, the Vault, and the Ledger export. One-time. Final sale.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user.id, readingId: readingId || "" },
      success_url: `${origin}/protocol?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=1`,
    });

    await createPendingPurchase(user.id, session.id, "starter");
    // Sign them in now — payment status is checked separately via
    // /api/me once the webhook (or verify-purchase fallback) confirms.
    await setSessionCookie(user.id, user.email);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
