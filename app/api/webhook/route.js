// Stripe webhook — the reliable, server-to-server confirmation of
// payment (works even if the buyer closes the tab before the success
// redirect fires). Marks the purchase paid and emails a magic link so
// the account is reachable from any device, not just the one that paid.
// Wire the endpoint URL + secret in the Stripe Dashboard once deployed.
// Docs: https://docs.stripe.com/webhooks
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { markPurchasePaid, getUserById, createOtpCode } from "../../../lib/db";
import { createMagicLinkToken } from "../../../lib/auth";
import { sendMagicLink } from "../../../lib/mail";

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const purchase = await markPurchasePaid(session.id);

    if (purchase) {
      const user = await getUserById(purchase.user_id);
      if (user) {
        const token = await createMagicLinkToken(user.id, user.email);
        const code = await createOtpCode(user.email);
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const link = `${appUrl}/api/auth/callback?token=${token}`;
        await sendMagicLink(user.email, link, code, { purchased: true });
      }
    }
  }

  return NextResponse.json({ received: true });
}
