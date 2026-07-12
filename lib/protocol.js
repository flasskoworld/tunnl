// ─────────────────────────────────────────────
// THE 14-DAY PROTOCOL — the memo re-sequenced into
// a daily calendar. One move per day. Integration
// days are load-bearing, not filler: they're where
// the plan gets checked against real life before
// the next priority starts.
// ─────────────────────────────────────────────

import { MODULES } from "./engine.js";

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
export function buildProtocol(memo, profile) {
  const days = [];
  const [p1, p2, p3] = memo.priorities;
  const weeklyHours = Number.parseInt(profile?.weeklyCapacity, 10) || 4;
  const timeScale = Math.min(1, (weeklyHours * 120) / 310);
  const fitTime = (minutes) => Math.max(10, Math.round((minutes * timeScale) / 5) * 5);

  days.push({
    day: 1,
    type: "kickoff",
    title: "Read the verdict again",
    detail: `"${memo.verdict}" — Before moving, sit with it. Today is not for action; it's for agreement. If you disagree with the board, that's data too — note where.`,
    minutes: 15,
    why: "A plan only works after you decide which diagnosis you are willing to act on.",
    doneWhen: "You have written one sentence you accept, one sentence you resist, and why.",
    reflection: "What did the board name that you have been explaining away?",
  });

  [p1, p2, p3].forEach((p, pIdx) => {
    p.actions.forEach((action, aIdx) => {
      const guidance = MODULE_GUIDANCE[p.module] || {
        minutes: 25,
        why: "A concrete move turns the diagnosis into evidence.",
        proof: "The action has produced a visible decision, artifact, or scheduled commitment.",
      };
      days.push({
        day: days.length + 1,
        type: "action",
        module: p.module,
        title: `${moduleLabel(p.module)} — Move ${aIdx + 1} of 3`,
        detail: action,
        context: profile?.focusProject
          ? `Apply this to ${profile.focusProject}${profile.audience ? ` for ${profile.audience}` : ""}.`
          : null,
        minutes: fitTime(guidance.minutes),
        why: guidance.why,
        doneWhen: guidance.proof,
        reflection: `What changed in ${moduleLabel(p.module)} because you completed this move?`,
      });
    });
    days.push({
      day: days.length + 1,
      type: "integration",
      module: p.module,
      title: `Check: did ${moduleLabel(p.module)} actually move?`,
      detail:
        pIdx < 2
          ? `Before you start the next priority — did the three moves land, or did life absorb them? Adjust before moving on, not after.`
          : `Three priorities, nine moves, thirteen days. Before the close: which module changed? Which didn't?`,
      minutes: 15,
      why: "Integration keeps a plan responsive to reality instead of rewarding empty completion.",
      doneWhen: `You have named what moved in ${moduleLabel(p.module)}, what stalled, and one adjustment for the next block.`,
      reflection: "Did the work create evidence, or only activity?",
    });
  });

  days.push({
    day: 14,
    type: "close",
    title: "Complete the sprint",
    detail:
      `Twelve months from now you said you wanted: "${profile?.twelve_month_destination || "your destination"}". ` +
      `Did these fourteen days point at it? Run a new reading when you are ready to measure what moved.`,
    minutes: 25,
    why: "The sprint is complete only when the work changes what you will do next.",
    doneWhen: profile?.successMeasure
      ? `You have compared the sprint against: ${profile.successMeasure}. Then recorded the strongest result, unresolved constraint, and next commitment.`
      : "You have recorded the strongest result, the unresolved constraint, and the next 30-day commitment.",
    reflection: "Which result would not exist if you had stayed in diagnosis mode?",
  });

  return days;
}

export function protocolProgress(checked, days) {
  const total = days.length;
  const done = Object.values(checked).filter(Boolean).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
