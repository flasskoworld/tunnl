// Passwordless auth: magic links + a signed session cookie. No passwords
// to store, reset, or leak — the email itself is the credential.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "tunnl_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

// Short-lived (15 min), single-purpose token sent in the magic link.
export async function createMagicLinkToken(userId, email) {
  return new SignJWT({ uid: userId, email, purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}

export async function verifyMagicLinkToken(token) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.purpose !== "magic-link") throw new Error("wrong token purpose");
  return payload; // { uid, email }
}

// Long-lived (30 day) session, stored as an httpOnly cookie.
export async function createSessionToken(userId, email) {
  return new SignJWT({ uid: userId, email, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function setSessionCookie(userId, email) {
  const token = await createSessionToken(userId, email);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "session") return null;
    return { userId: payload.uid, email: payload.email };
  } catch (e) {
    return null;
  }
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}
