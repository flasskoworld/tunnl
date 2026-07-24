// The link the visitor clicks in their email. Verifies the short-lived
// magic-link token, then issues the long-lived session cookie.
import { NextResponse } from "next/server";
import { setSessionCookie } from "../../../../lib/auth";
import { consumeEmailSignInToken } from "../../../../lib/db";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const appOrigin = process.env.APP_URL || origin;
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(`${appOrigin}/signin?error=missing_token`);

  try {
    const user = await consumeEmailSignInToken(token);
    if (!user) throw new Error("expired link");
    await setSessionCookie(user.id, user.email);
    return NextResponse.redirect(`${appOrigin}/account`);
  } catch (e) {
    return NextResponse.redirect(`${appOrigin}/signin?error=expired_link`);
  }
}
