// A visitor asking to sign in (not via a fresh purchase). Finds or
// creates their account and emails a fresh magic link.
import { NextResponse } from "next/server";
import { findOrCreateUser, createEmailSignInToken } from "../../../../lib/db";
import { sendMagicLink } from "../../../../lib/mail";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    const user = await findOrCreateUser(email);
    const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const token = await createEmailSignInToken(user.id, requester);
    const origin = process.env.APP_URL || new URL(request.url).origin;
    const link = `${origin}/api/auth/callback?token=${token}`;
    const sent = await sendMagicLink(user.email, link);
    if (!sent) return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign-in unavailable";
    const status = message.startsWith("Too many") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
