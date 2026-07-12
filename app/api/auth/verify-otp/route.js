// The typed-code alternative to clicking the magic link — same trust
// model (whoever has the email), less tab-switching.
import { NextResponse } from "next/server";
import { verifyAndConsumeOtp } from "../../../../lib/db";
import { findOrCreateUser } from "../../../../lib/db";
import { setSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Enter the email and code" }, { status: 400 });
    }
    const ok = await verifyAndConsumeOtp(email, code);
    if (!ok) {
      return NextResponse.json({ error: "That code is wrong or expired" }, { status: 400 });
    }
    const user = await findOrCreateUser(email);
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
