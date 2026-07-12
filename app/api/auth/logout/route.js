import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
