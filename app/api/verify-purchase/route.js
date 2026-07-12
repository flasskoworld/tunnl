// Fallback confirmation path for local dev or if the webhook hasn't
// fired yet when the buyer lands back on /protocol. Checks Stripe
// directly and marks the DB purchase paid if needed — idempotent,
// safe to call from the client.
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { markPurchasePaid } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ paid: false, error: "missing session_id" }, { status: 400 });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    if (paid) await markPurchasePaid(sessionId);
    return NextResponse.json({ paid });
  } catch (e) {
    return NextResponse.json({ paid: false, error: String(e) }, { status: 500 });
  }
}
