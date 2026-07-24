import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { recordProductEvent } from "../../../lib/db";

const ALLOWED_EVENTS = new Set([
  "diagnostic_started",
  "diagnostic_completed",
  "checkout_started",
  "purchase_completed",
  "plan_started",
  "plan_day_completed",
  "sprint_completed",
  "course_correction_completed",
  "outcome_submitted",
]);

export async function POST(request) {
  const { name, metadata = {} } = await request.json();
  if (!ALLOWED_EVENTS.has(name)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }
  if (JSON.stringify(metadata).length > 2000) {
    return NextResponse.json({ error: "Event metadata is too large" }, { status: 413 });
  }
  const session = await getSession();
  await recordProductEvent(session?.userId, name, metadata);
  return NextResponse.json({ ok: true });
}
