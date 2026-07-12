// The link the visitor clicks in their email. Verifies the short-lived
// magic-link token, then issues the long-lived session cookie.
import { NextResponse } from "next/server";
import { verifyMagicLinkToken, setSessionCookie } from "../../../../lib/auth";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(`${origin}/signin?error=missing_token`);

  try {
    const payload = await verifyMagicLinkToken(token);
    await setSessionCookie(payload.uid, payload.email);
    return NextResponse.redirect(`${origin}/account`);
  } catch (e) {
    return NextResponse.redirect(`${origin}/signin?error=expired_link`);
  }
}
