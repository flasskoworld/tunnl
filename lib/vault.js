import { interventionFor } from "./interventions.js";
import { projectBriefContext } from "./projectBrief.js";

// ─────────────────────────────────────────────
// THE VAULT — module-by-module worksheets.
// Unlocked at Starter. Real, fillable, specific —
// not generic advice. Each ties to the module the
// diagnostic scored, so the Vault feels like a
// direct response to the reading, not a bonus pack.
// ─────────────────────────────────────────────

export const VAULT = {
  leverage: {
    title: "The Leverage Audit",
    subtitle: "Find what still costs you an hour.",
    fields: [
      { label: "List every task you did this week that only you can do", type: "list", rows: 5 },
      { label: "Of those, which could be documented into a process a hire or a tool could run?", type: "textarea" },
      { label: "One thing you will automate, delegate, or productize in the next 14 days", type: "text" },
      { label: "What form of leverage do you have the least of — capital, code, media, or people?", type: "text" },
    ],
  },
  systems: {
    title: "The Standing Protocol",
    subtitle: "What runs when you don't show up.",
    fields: [
      { label: "Your three most repeated workflows", type: "list", rows: 3 },
      { label: "For each: is it written down anywhere but your head?", type: "list", rows: 3 },
      { label: "The one protocol you'll document this week", type: "text" },
      { label: "Who or what could run it without you — a person, a tool, an automation?", type: "text" },
    ],
  },
  strategy: {
    title: "The Positioning One-Liner",
    subtitle: "Who you serve, and why they choose you.",
    fields: [
      { label: "I help [specific person] achieve [specific outcome] without [specific pain]", type: "textarea" },
      { label: "The three alternatives your audience compares you to", type: "list", rows: 3 },
      { label: "What you do that none of them do", type: "text" },
      { label: "One offer or channel to kill because it doesn't serve this position", type: "text" },
    ],
  },
  building: {
    title: "The Ship Log",
    subtitle: "Turn drafts into a public record.",
    fields: [
      { label: "The one asset you'll ship a v1 of in the next 14 days", type: "text" },
      { label: "The public deadline — and where you'll post it so it's witnessed", type: "text" },
      { label: "What you're cutting from scope to make that date unmissable", type: "textarea" },
      { label: "What 'embarrassing but shipped' looks like for this asset", type: "text" },
    ],
  },
  ownership: {
    title: "The Ownership Audit",
    subtitle: "Map what you actually control.",
    fields: [
      { label: "Where does your audience live? List every platform and channel", type: "list", rows: 4 },
      { label: "Of those, which do you own outright (email list, your own site, your own app)?", type: "list", rows: 2 },
      { label: "Your plan to move 10% of your best followers to an owned channel this month", type: "textarea" },
      { label: "One piece of IP you give away free that could be packaged as owned property", type: "text" },
    ],
  },
  network: {
    title: "The Loop Design",
    subtitle: "Make it spread without you pushing it.",
    fields: [
      { label: "Right now, what makes someone share your work? Be honest if the answer is 'nothing'", type: "textarea" },
      { label: "One referral or share mechanic you'll add to your core offer", type: "text" },
      { label: "One space where members could talk to each other instead of only to you", type: "text" },
      { label: "What would make sharing easier than describing?", type: "text" },
    ],
  },
  economy: {
    title: "The Enough Number",
    subtitle: "Know the number you're actually running toward.",
    fields: [
      { label: "Monthly personal burn — everything it costs you to live", type: "text" },
      { label: "Monthly business burn — everything it costs to operate", type: "text" },
      { label: "Your written 'enough' number — the monthly income where you'd stop feeling the chase", type: "text" },
      { label: "Current income streams and what each contributes", type: "list", rows: 4 },
      { label: "Allocation rule: what does every dollar in do before you touch it?", type: "textarea" },
    ],
  },
  focus: {
    title: "The Kill List",
    subtitle: "What you refuse defines what you become.",
    fields: [
      { label: "Every active project right now, ranked by leverage toward your destination", type: "list", rows: 5 },
      { label: "Everything below #2 — kill or freeze it. Name the date you'll do it", type: "textarea" },
      { label: "Your weekly zoom-out — when will you check the tunnel is still pointed right?", type: "text" },
    ],
  },
  forces: {
    title: "The Incentive Map",
    subtitle: "Know who profits before you move.",
    fields: [
      { label: "Your top five information inputs (feeds, people, publications)", type: "list", rows: 5 },
      { label: "For each: who profits from you consuming it?", type: "textarea" },
      { label: "One algorithmic feed you'll replace with one curated source", type: "text" },
      { label: "Before your next big move: who profits, who blocks, and why?", type: "textarea" },
    ],
  },
};

export function vaultFor(moduleKey, model = null, context = {}) {
  const base = VAULT[moduleKey] || null;
  if (!base || !model) return base;
  const track = interventionFor(model, moduleKey);
  const project = context.focusProject?.trim();
  const projectContext = projectBriefContext(context.projectBrief || project);
  return {
    ...base,
    focusProject: project || "",
    projectIntent: project ? projectContext.label : "",
    subtitle: track.hypothesis,
    guidance: [
      { label: "Hypothesis", value: track.hypothesis },
      { label: "Recommended decision", value: track.moves.find((move) => move.key === "decision")?.detail },
      { label: "Smallest useful artifact", value: track.moves.find((move) => move.key === "artifact")?.detail },
      { label: "Real-world test", value: track.moves.find((move) => move.key === "test")?.detail },
      { label: "A pass looks like", value: track.passSignal },
      { label: "If it fails", value: track.failSignal },
      { label: "Then", value: track.nextMove },
    ],
    fields: [
      { key: "baseline", label: track.baseline, prompt: "Record what is true today. Use a number or observable fact when possible.", type: "textarea" },
      { key: "decision", label: project ? "What decision does this work require?" : "What decision are you making?", prompt: project ? projectContext.moves.decision : "Write the choice and the tradeoff in one clear sentence.", type: "textarea" },
      { key: "work", label: project ? "What will you make or test next?" : "What will you make or test?", prompt: project ? projectContext.moves.artifact : "Name the smallest artifact or real-world test you will complete.", type: "textarea" },
      { key: "result", label: "What happened?", prompt: "Return after the test and record the signal, result, or new constraint.", type: "textarea" },
    ],
  };
}

export function legacyPrefillVaultValues(result, setup = {}) {
  const project = setup.focusProject || result?.profile?.focusProject || result?.profile?.building || "this project";
  const audience = setup.audience || "the people it serves";
  const metric = setup.targetMetric || "the outcome that matters";
  const baseline = setup.baselineValue || "the current starting point";
  const target = setup.targetValue || "the Day 14 target";
  const values = {
    "strategy:0": `I help ${audience} achieve ${metric} through ${project}.`,
    "building:0": project,
    "ownership:0": result?.profile?.business_model === "product" ? "Customer identity, product access, core data, and direct communication" : "The channels currently used to reach the audience or customer",
    "economy:2": `${metric}: ${baseline} -> ${target}`,
    "focus:0": `1. ${project} - measured by ${metric}`,
  };
  result?.memo?.priorities?.forEach((priority) => {
    const track = priority.intervention || interventionFor(result?.profile?.business_model || "creator", priority.module);
    const move = (key) => track.moves.find((item) => item.key === key)?.detail || "";
    Object.assign(values, {
      [`${priority.module}:0`]: track.hypothesis,
      [`${priority.module}:1`]: `${metric}: ${baseline} -> ${target}`,
      [`${priority.module}:2`]: move("decision"),
      [`${priority.module}:3`]: move("artifact"),
      [`${priority.module}:4`]: move("test"),
      [`${priority.module}:5`]: track.passSignal,
      [`${priority.module}:6`]: track.failSignal,
      [`${priority.module}:7`]: track.nextMove,
    });
  });
  return values;
}
