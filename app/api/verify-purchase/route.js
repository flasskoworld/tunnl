// Fallback confirmation path for local dev or if the webhook hasn't
// fired yet when the buyer lands back on /protocol. Checks Stripe
// directly and marks the DB purchase paid if needed — idempotent,
// safe to call from the client.
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { getUserById, markPurchasePaid, saveReading } from "../../../lib/db";
import { setSessionCookie } from "../../../lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ paid: false, error: "missing session_id" }, { status: 400 });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const purchase = paid ? await markPurchasePaid(sessionId) : null;
    if (!purchase) return NextResponse.json({ paid: false });
    const user = await getUserById(purchase.user_id);
    if (!user) return NextResponse.json({ paid: false });
    if (purchase.reading) await saveReading(user.id, purchase.reading);
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({ paid: true });
  } catch (e) {
    return NextResponse.json({ paid: false, error: String(e) }, { status: 500 });
  }
}
