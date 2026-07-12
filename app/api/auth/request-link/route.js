// A visitor asking to sign in (not via a fresh purchase). Finds or
// creates their account and emails a fresh magic link.
import { NextResponse } from "next/server";
import { findOrCreateUser, createOtpCode } from "../../../../lib/db";
import { createMagicLinkToken } from "../../../../lib/auth";
import { sendMagicLink } from "../../../../lib/mail";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    const user = await findOrCreateUser(email);
    const token = await createMagicLinkToken(user.id, user.email);
    const code = await createOtpCode(user.email);
    const origin = process.env.APP_URL || new URL(request.url).origin;
    const link = `${origin}/api/auth/callback?token=${token}`;
    await sendMagicLink(user.email, link, code);
    return NextResponse.json({ sent: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
