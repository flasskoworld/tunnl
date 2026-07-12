// ─────────────────────────────────────────────
// THE 14-DAY PROTOCOL — the memo re-sequenced into
// a daily calendar. One move per day. Integration
// days are load-bearing, not filler: they're where
// the plan gets checked against real life before
// the next priority starts.
// ─────────────────────────────────────────────

import { MODULES } from "./engine";

const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

// Builds a 14-day sequence from the memo's 3 priorities (3 actions each).
// Day shape: { day, type: "kickoff"|"action"|"integration"|"close",
//              module, title, detail }
export function buildProtocol(memo, profile) {
  const days = [];
  const [p1, p2, p3] = memo.priorities;

  days.push({
    day: 1,
    type: "kickoff",
    title: "Read the verdict again",
    detail: `"${memo.verdict}" — Before moving, sit with it. Today is not for action; it's for agreement. If you disagree with the board, that's data too — note where.`,
  });

  [p1, p2, p3].forEach((p, pIdx) => {
    p.actions.forEach((action, aIdx) => {
      days.push({
        day: days.length + 1,
        type: "action",
        module: p.module,
        title: `${moduleLabel(p.module)} — Move ${aIdx + 1} of 3`,
        detail: action,
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
    });
  });

  days.push({
    day: 14,
    type: "close",
    title: "Close the Protocol",
    detail:
      `Twelve months from now you said you wanted: "${profile?.twelve_month_destination || "your destination"}". ` +
      `Did these fourteen days point at it? Your next reading unlocks in 30 days — the delta is the only proof that matters.`,
  });

  return days;
}

export function protocolProgress(checked, days) {
  const total = days.length;
  const done = Object.values(checked).filter(Boolean).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
