// ─────────────────────────────────────────────
// THE 14-DAY PROTOCOL — the memo re-sequenced into
// a daily calendar. One move per day. Integration
// days are load-bearing, not filler: they're where
// the plan gets checked against real life before
// the next priority starts.
// ─────────────────────────────────────────────

import { MODULES } from "./engine.js";
import { interventionFor } from "./interventions.js";
import { courseCorrectionMode, interventionKey, METHOD_VERSION } from "./methodology.js";

const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

const MODULE_GUIDANCE = {
  leverage: { minutes: 25, why: "Removing one recurring hour creates capacity that keeps returning.", proof: "The task has an owner, automation, or written process that no longer depends on memory." },
  systems: { minutes: 30, why: "A system becomes real when it can run without explanation.", proof: "A repeatable workflow is documented with a trigger, steps, and a clear finish." },
  strategy: { minutes: 25, why: "A sharper choice prevents weeks of efficient motion in the wrong direction.", proof: "One audience, outcome, and deliberate tradeoff are written in a sentence you can use." },
  building: { minutes: 45, why: "A shipped artifact produces better information than another private draft.", proof: "A visible version exists outside your workspace and at least one real person can respond to it." },
  ownership: { minutes: 30, why: "Durable upside begins where your access cannot be revoked by someone else's platform.", proof: "One asset or audience relationship has a named path toward direct ownership." },
  network: { minutes: 30, why: "Distribution compounds when participation carries the work farther than promotion alone.", proof: "A specific share, referral, or member-to-member loop is live or scheduled to ship." },
  economy: { minutes: 25, why: "A number turns financial pressure into a decision rule instead of a mood.", proof: "Your burn, enough number, and next allocation decision are written in one place." },
  focus: { minutes: 20, why: "Attention compounds only after competing work is explicitly refused.", proof: "One priority is protected and at least one competing commitment is killed, frozen, or delegated." },
  forces: { minutes: 25, why: "Naming the incentive changes how much power it has over your next move.", proof: "The people, platforms, incentives, and likely resistance around the decision are mapped." },
};

// Builds a 14-day sequence from the memo's 3 priorities (3 actions each).
// Day shape: { day, type: "kickoff"|"action"|"integration"|"close",
//              module, title, detail }
export function buildProtocol(memo, profile, checkpoint = {}) {
  const days = [];
  const [p1, p2, p3] = memo.priorities;
  const weeklyHours = Number.parseInt(profile?.weeklyCapacity, 10) || 4;
  const timeScale = Math.min(1, (weeklyHours * 120) / 310);
  const fitTime = (minutes) => Math.max(10, Math.round((minutes * timeScale) / 5) * 5);

  const model = profile?.business_model || "creator";
  const trackFor = (priority) => priority?.intervention || interventionFor(model, priority?.module);
  const moveDay = (day, priority, move, correctionLead = "") => {
    const track = trackFor(priority);
    const guidance = MODULE_GUIDANCE[priority.module] || {
      minutes: 25,
      why: "A concrete move turns the diagnosis into evidence.",
      proof: "The action has produced a visible decision, artifact, or scheduled commitment.",
    };
    return {
      day,
      type: "action",
      module: priority.module,
      title: `${moduleLabel(priority.module)} - ${move.kind}`,
      detail: `${correctionLead}${move.detail}`,
      minutes: fitTime(guidance.minutes),
      why: track?.hypothesis || guidance.why,
      doneWhen: move.doneWhen || guidance.proof,
      reflection: `What changed in ${moduleLabel(priority.module)} because you completed this move?`,
      methodStage: day > 7 ? "test" : "focus",
      interventionId: interventionKey(track?.id || `${model}.${priority.module}`, move.key),
      methodVersion: METHOD_VERSION,
      moveKind: move.kind,
      toolKey: track?.toolKey || priority.module,
      baselinePrompt: track?.baseline,
      passSignal: track?.passSignal,
      failSignal: track?.failSignal,
      prescribedNextMove: track?.nextMove,
    };
  };
  const integrationDay = (day, priority, detail) => ({
    day,
    type: "integration",
    module: priority.module,
    title: `Check: did ${moduleLabel(priority.module)} actually move?`,
    detail,
    minutes: 15,
    why: "Integration keeps a plan responsive to reality instead of rewarding empty completion.",
    doneWhen: `You have named what moved in ${moduleLabel(priority.module)}, what stalled, and one adjustment for the next block.`,
    reflection: "Did the work create evidence, or only activity?",
    methodStage: "test",
  });

  days.push({
    day: 1,
    type: "kickoff",
    title: "Confirm the starting point",
    detail: `"${memo.verdict}" Before moving, confirm that this is the constraint worth working on now.`,
    minutes: 15,
    why: "A plan only works after you decide which diagnosis you are willing to act on.",
    doneWhen: "You have named the constraint in your own words and one observable sign that it is improving.",
    reflection: "What makes this the right constraint for the next 14 days?",
    methodStage: "diagnose",
  });

  trackFor(p1).moves.forEach((move, index) => days.push(moveDay(index + 2, p1, move)));
  days.push(integrationDay(5, p1, "Before starting the next priority, compare the three moves with the evidence you began with."));
  days.push(moveDay(6, p2, trackFor(p2).moves[0]));
  days.push({
    day: 7,
    type: "checkpoint",
    module: p2.module,
    title: "Course Correction",
    detail: "Pause before the second half. Use the evidence you have gathered to continue, narrow the target, or change course.",
    minutes: 20,
    why: "The strongest plan responds to evidence instead of protecting its original assumptions.",
    doneWhen: "You have named the clearest signal, the main friction, and how Days 8-13 should change.",
    reflection: "What is the work telling you that the starting diagnosis could not?",
    methodStage: "adjust",
    interventionId: interventionKey(`${model}.${p2.module}`, "checkpoint"),
  });

  const correction = courseCorrectionMode(checkpoint);
  if (correction === "change") {
    const revisedModule = checkpoint.revisedModule || p2.module;
    const revisedTrack = interventionFor(model, revisedModule);
    const revisedPriority = { module: revisedModule, intervention: revisedTrack };
    const revisedConstraint = checkpoint.revisedConstraint?.trim().replace(/[.!?]+$/, "");
    const lead = revisedConstraint
      ? `The Day 7 evidence changed the constraint to: ${revisedConstraint}. `
      : "The Day 7 evidence changed the constraint. ";
    revisedTrack.moves.forEach((move, index) => days.push(moveDay(index + 8, revisedPriority, move, lead)));
    days.push(integrationDay(11, revisedPriority, "Compare the revised intervention with the Day 7 evidence. Decide whether the new constraint is producing a clearer signal."));
    days.push(moveDay(12, revisedPriority, {
      key: "next",
      kind: "Prescribed next move",
      detail: revisedTrack.nextMove,
      doneWhen: "The prescribed next move is completed or scheduled with an owner and date.",
    }));
    days.push(integrationDay(13, revisedPriority, "Close the rerouted second half. Name the evidence that supports or rejects the revised constraint."));
  } else {
    const lead = correction === "narrow" ? "Reduce this to the smallest version that can create a real signal. " : "";
    trackFor(p2).moves.slice(1).forEach((move, index) => days.push(moveDay(index + 8, p2, move, lead)));
    trackFor(p3).moves.forEach((move, index) => days.push(moveDay(index + 10, p3, move, lead)));
    days.push(integrationDay(13, p3, "Three priorities have been tested. Name which assumption held, which failed, and what the evidence requires next."));
  }

  days.push({
    day: 14,
    type: "close",
    title: "Complete the sprint",
    detail: "Record the strongest result, decide what changed, and choose the next action from the evidence.",
    minutes: 25,
    why: "The sprint is complete only when the work changes what you will do next.",
    doneWhen: "You have recorded the strongest result, the unresolved constraint, and the next commitment.",
    reflection: "Which result would not exist if you had stayed in diagnosis mode?",
    methodStage: "prove",
  });

  return days;
}

export function protocolProgress(checked, days) {
  const total = days.length;
  const done = days.filter((day) => checked[day.day]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function dayIsAdvanced(day, checked, evidence) {
  return !!checked[day] || evidence?.[day]?.status === "waiting";
}

export function nextActionableDay(days, checked, evidence) {
  return days.find((day) => !dayIsAdvanced(day.day, checked, evidence)) || null;
}
