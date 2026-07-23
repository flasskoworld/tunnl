import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import {
  getPublicSprintOutcomes,
  getStarterWorkspace,
  saveSprintOutcome,
  userHasPaidStarter,
} from "../../../lib/db";

const RESULT_STATUSES = new Set(["exceeded", "met", "moved", "unchanged", "unmeasured"]);

export async function GET() {
  try {
    const outcomes = await getPublicSprintOutcomes(3);
    return NextResponse.json({ outcomes });
  } catch (error) {
    return NextResponse.json({ outcomes: [] });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await userHasPaidStarter(session.userId))) {
    return NextResponse.json({ error: "Starter required" }, { status: 403 });
  }

  const workspace = await getStarterWorkspace(session.userId);
  const setup = workspace?.setup || {};
  const review = workspace?.completion_review || {};
  if (!workspace?.protocol_checked?.["14"] || !review.strongestResult) {
    return NextResponse.json({ error: "Complete the sprint first" }, { status: 409 });
  }

  const body = await request.json();
  const outcomeText = String(body.outcomeText || "").trim();
  const attribution = String(body.attribution || "").trim() || "Anonymous Tunnl user";
  if (body.permissionToPublish !== true) {
    return NextResponse.json({ error: "Publishing permission is required" }, { status: 400 });
  }
  if (outcomeText.length < 20 || outcomeText.length > 600 || attribution.length > 80) {
    return NextResponse.json({ error: "Check the outcome and credit lengths" }, { status: 400 });
  }

  const saved = await saveSprintOutcome(session.userId, {
    sprintId: String(setup.sprintId || `${setup.readingId || "reading"}:${workspace.protocol_start_date}`),
    businessModel: setup.businessModel,
    projectIntent: setup.projectIntent,
    focusProject: setup.focusProject,
    outcomeText,
    resultStatus: RESULT_STATUSES.has(review.targetStatus) ? review.targetStatus : null,
    attribution,
  });

  return NextResponse.json({
    saved: true,
    id: saved.id,
    status: "pending_review",
  });
}
