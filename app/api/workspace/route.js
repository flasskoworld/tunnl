import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import {
  getReadings,
  getStarterWorkspace,
  getInterventionBenchmarks,
  saveReading,
  updateStarterWorkspace,
  syncInterventionOutcomes,
  userHasPaidStarter,
} from "../../../lib/db";

const unauthorized = () => NextResponse.json({ error: "Sign in required" }, { status: 401 });

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const [readings, workspace, unlocked, benchmarks] = await Promise.all([
    getReadings(session.userId),
    getStarterWorkspace(session.userId),
    userHasPaidStarter(session.userId),
    getInterventionBenchmarks(),
  ]);
  return NextResponse.json({ readings, workspace, unlocked, benchmarks });
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
  if (updates.protocol_evidence) {
    const allowedSignals = new Set(["strong", "some", "none", "blocked"]);
    const allowedStatuses = new Set(["started", "waiting", "complete"]);
    const entries = Object.entries(updates.protocol_evidence);
    if (entries.length > 14 || entries.some(([day, entry]) =>
      Number(day) < 1 || Number(day) > 14 ||
      (entry?.signal && !allowedSignals.has(entry.signal)) ||
      (entry?.status && !allowedStatuses.has(entry.status)) ||
      String(entry?.output || "").length > 4000 ||
      JSON.stringify(entry || {}).length > 12000
    )) return NextResponse.json({ error: "Invalid evidence record" }, { status: 400 });
  }
  if (updates.course_correction && JSON.stringify(updates.course_correction).length > 10000) {
    return NextResponse.json({ error: "Course correction is too large" }, { status: 413 });
  }
  const workspace = await updateStarterWorkspace(session.userId, updates);
  if (updates.protocol_evidence) await syncInterventionOutcomes(session.userId, workspace, updates.protocol_evidence);
  return NextResponse.json({ workspace });
}
