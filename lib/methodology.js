export const METHOD_VERSION = "1.1";

export const TUNNL_METHOD = [
  { key: "diagnose", label: "Diagnose", description: "Find the constraint beneath the visible symptoms." },
  { key: "focus", label: "Focus", description: "Choose the smallest meaningful outcome worth moving now." },
  { key: "test", label: "Test", description: "Turn each move into visible evidence from the real world." },
  { key: "adjust", label: "Adjust", description: "Use the midpoint signal to continue, narrow, or change course." },
  { key: "prove", label: "Prove", description: "Compare the starting point with what changed and decide what comes next." },
];

export const OUTCOME_SIGNALS = [
  { value: "strong", label: "Clear movement", weight: 3 },
  { value: "some", label: "Some movement", weight: 2 },
  { value: "none", label: "No movement yet", weight: 1 },
  { value: "blocked", label: "Blocked", weight: 0 },
];

export function interventionKey(track, move) {
  if (move === undefined) return `${METHOD_VERSION}:day-${track}`;
  return `${METHOD_VERSION}:${track}:${move}`;
}

export function courseCorrectionMode(checkpoint = {}) {
  if (checkpoint.direction === "change") return "change";
  if (checkpoint.direction === "narrow" || checkpoint.friction === "scope") return "narrow";
  return "continue";
}
