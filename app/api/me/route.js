// Source of truth for "is this visitor signed in, and have they paid?"
// Client pages call this instead of trusting localStorage alone.
import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { userHasPaidStarter } from "../../../lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ signedIn: false, unlocked: false });
  const unlocked = await userHasPaidStarter(session.userId);
  return NextResponse.json({ signedIn: true, email: session.email, unlocked });
}
