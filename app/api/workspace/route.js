import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import {
  getReadings,
  getStarterWorkspace,
  saveReading,
  updateStarterWorkspace,
  userHasPaidStarter,
} from "../../../lib/db";

const unauthorized = () => NextResponse.json({ error: "Sign in required" }, { status: 401 });

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const [readings, workspace, unlocked] = await Promise.all([
    getReadings(session.userId),
    getStarterWorkspace(session.userId),
    userHasPaidStarter(session.userId),
  ]);
  return NextResponse.json({ readings, workspace, unlocked });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { result } = await request.json();
  if (!result?.scores || !result?.memo || !result?.profile) {
    return NextResponse.json({ error: "A complete reading is required" }, { status: 400 });
  }
  if (JSON.stringify(result).length > 100000) {
    return NextResponse.json({ error: "Reading is too large" }, { status: 413 });
  }
  const reading = await saveReading(session.userId, result);
  return NextResponse.json({ reading });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await userHasPaidStarter(session.userId))) {
    return NextResponse.json({ error: "Starter required" }, { status: 403 });
  }
  const updates = await request.json();
  const workspace = await updateStarterWorkspace(session.userId, updates);
  return NextResponse.json({ workspace });
}
