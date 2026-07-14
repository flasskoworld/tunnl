// ─────────────────────────────────────────────
// TUNNL engine — modules, diagnostic, scoring
// Shared by client pages and the API route.
// ─────────────────────────────────────────────

import { interventionFor } from "./interventions.js";

export const MODULES = [
  { key: "leverage", label: "Leverage" },
  { key: "systems", label: "Systems" },
  { key: "strategy", label: "Strategy" },
  { key: "building", label: "Building" },
  { key: "ownership", label: "Ownership" },
  { key: "network", label: "Network Effects" },
  { key: "economy", label: "Personal Economy" },
  { key: "focus", label: "Tunnel Vision" },
  { key: "forces", label: "Invisible Forces" },
];

export const MODEL_QUESTION = {
  id: "business_model",
  eyebrow: "Your work",
  q: "Which model best describes what you are building?",
  options: [
    { t: "Creator or media business", v: "creator" },
    { t: "Service or consulting business", v: "service" },
    { t: "Community or membership", v: "community" },
    { t: "Product or software", v: "product" },
  ],
};

export const UNIVERSAL_QUESTIONS = [
  { id: "stage", field: "stage", eyebrow: "Stage", q: "What evidence of demand exists today?", options: [
    { t: "Repeat customers or dependable revenue", v: "repeat revenue", w: { building: 10, economy: 9 } },
    { t: "A few paying customers or sales", v: "early revenue", w: { building: 8, economy: 6 } },
    { t: "An audience or users, but little revenue", v: "audience no revenue", w: { building: 6, economy: 2 } },
    { t: "A concept or early work, not launched", v: "pre-launch", w: { building: 2, economy: 1 } },
  ]},
  { id: "destination", field: "destination", eyebrow: "Goal", q: "Twelve months from now, what result would make this work feel successful?", options: [
    { t: "Reliable income from the work", v: "replace income", w: { economy: 7, ownership: 6 } },
    { t: "A product or offer with repeat buyers", v: "paying product", w: { strategy: 7, building: 7 } },
    { t: "An owned audience that keeps growing", v: "compounding audience", w: { ownership: 7, network: 7 } },
    { t: "More control over my time", v: "time freedom", w: { systems: 7, leverage: 7 } },
  ]},
  { id: "capacity", field: "weeklyCapacity", eyebrow: "Capacity", q: "How much time did you set aside for this work last week? (Time planned specifically for it, without other tasks.)", options: [
    { t: "Eight hours or more", v: "8+ hours", w: { focus: 9, systems: 8 } },
    { t: "Four to seven hours", v: "4 hours", w: { focus: 7, systems: 6 } },
    { t: "One to three hours", v: "2 hours", w: { focus: 4, systems: 3 } },
    { t: "I did not set aside any time", v: "0 hours", w: { focus: 1, systems: 1 } },
  ]},
  { id: "recent_evidence", field: "recentEvidence", eyebrow: "Evidence", q: "What happened in the last 30 days because you put work into the world?", options: [
    { t: "People paid, renewed, or referred someone", v: "commercial signal", w: { building: 10, strategy: 9, network: 8 } },
    { t: "People replied, joined, tested, or booked a call", v: "market signal", w: { building: 8, strategy: 7, network: 6 } },
    { t: "I published or launched, but received little response", v: "shipped no signal", w: { building: 7, strategy: 3, network: 2 } },
    { t: "Nothing reached another person", v: "no external evidence", w: { building: 1, strategy: 2, network: 1 } },
  ]},
  { id: "primary_constraint", field: "blocker", eyebrow: "Constraint", q: "Which constraint is costing you the most momentum right now?", options: [
    { t: "I do not have enough dedicated time", v: "Time", w: { focus: 2, systems: 3 } },
    { t: "The offer or direction is unclear", v: "Knowledge", w: { strategy: 2, building: 4 } },
    { t: "Not enough of the right people see it", v: "Audience", w: { network: 2, ownership: 3 } },
    { t: "Revenue is too inconsistent", v: "Money", w: { economy: 2, leverage: 3 } },
    { t: "I start more than I finish", v: "Discipline", w: { focus: 2, systems: 2, building: 3 } },
  ]},
];

const q = (id, eyebrow, question, options) => ({ id, eyebrow, q: question, options });
const scale = (strong, working, weak, weights) => [
  { t: strong, w: Object.fromEntries(Object.keys(weights).map((key) => [key, 10])) },
  { t: working, w: Object.fromEntries(Object.keys(weights).map((key) => [key, 6])) },
  { t: weak, w: Object.fromEntries(Object.keys(weights).map((key) => [key, 2])) },
];

export const MODEL_BRANCHES = {
  creator: [
    q("creator_offer", "Offer", "What can someone buy from you today?", scale("A clear offer people have bought more than once", "An offer exists, but sales are inconsistent", "Nothing clear is available to buy", { strategy: 1, economy: 1 })),
    q("creator_owned", "Ownership", "How many audience relationships can you reach without an algorithm?", [{ t: "1,000 or more owned contacts", w: { ownership: 10 } }, { t: "100–999 owned contacts", w: { ownership: 7 } }, { t: "Fewer than 100 owned contacts", w: { ownership: 3 } }, { t: "None — the audience is platform-only", w: { ownership: 1 } }]),
    q("creator_cadence", "Systems", "How many planned pieces did you publish in the last four weeks?", [{ t: "Eight or more", w: { systems: 10, building: 9 } }, { t: "Four to seven", w: { systems: 7, building: 7 } }, { t: "One to three", w: { systems: 4, building: 4 } }, { t: "None", w: { systems: 1, building: 1 } }]),
    q("creator_conversion", "Strategy", "Can you trace any recent sale or signup to a specific piece of content?", scale("Yes — I know which content converts", "Sometimes, but tracking is loose", "No — content and offers are disconnected", { strategy: 1, forces: 1 })),
    q("creator_reuse", "Leverage", "How much of your content is reused across formats or continues working after publication?", scale("Most of it is repurposed or evergreen", "Some is reused", "Almost every piece starts from zero", { leverage: 1, systems: 1 })),
    q("creator_referrals", "Spread", "How often did someone share, recommend, or forward your work last month?", [{ t: "Weekly or more", w: { network: 10 } }, { t: "A few times", w: { network: 6 } }, { t: "Once", w: { network: 3 } }, { t: "Not that I can verify", w: { network: 1 } }]),
    q("creator_focus", "Focus", "How many distinct topics, offers, or audiences did you actively serve last month?", [{ t: "One", w: { focus: 10 } }, { t: "Two", w: { focus: 7 } }, { t: "Three", w: { focus: 4 } }, { t: "Four or more", w: { focus: 1 } }]),
  ],
  service: [
    q("service_position", "Position", "Of your last five inquiries, how many fit the same customer problem?", [{ t: "Four or five", w: { strategy: 10 } }, { t: "Two or three", w: { strategy: 6 } }, { t: "One", w: { strategy: 3 } }, { t: "No consistent pattern", w: { strategy: 1 } }]),
    q("service_pipeline", "Pipeline", "How many qualified sales conversations happened in the last 30 days?", [{ t: "Eight or more", w: { network: 10, building: 9 } }, { t: "Four to seven", w: { network: 7, building: 7 } }, { t: "One to three", w: { network: 4, building: 4 } }, { t: "None", w: { network: 1, building: 1 } }]),
    q("service_repeat", "Economy", "How much current revenue is repeatable, retained, or already contracted?", scale("Most of it", "Some of it", "Almost none of it", { economy: 1, leverage: 1 })),
    q("service_delivery", "Systems", "How many core delivery steps are documented and reusable?", scale("The full delivery process", "The repeated parts", "Delivery mostly lives in my head", { systems: 1, leverage: 1 })),
    q("service_dependency", "Leverage", "What happens to client delivery if you are unavailable for one week?", scale("Work continues without disruption", "Some work continues", "Nearly everything stops", { leverage: 1, systems: 1 })),
    q("service_owned", "Ownership", "Do you control the primary relationship with your best-fit prospects?", scale("Yes — through direct contacts and an owned list", "Partly — referrals and platforms both matter", "No — one platform or intermediary controls access", { ownership: 1, forces: 1 })),
    q("service_focus", "Focus", "How many materially different services are you currently selling?", [{ t: "One", w: { focus: 10 } }, { t: "Two", w: { focus: 7 } }, { t: "Three", w: { focus: 4 } }, { t: "Four or more", w: { focus: 1 } }]),
  ],
  community: [
    q("community_active", "Participation", "What share of members participated meaningfully in the last 30 days?", [{ t: "More than half", w: { network: 10 } }, { t: "About a quarter to half", w: { network: 7 } }, { t: "Fewer than a quarter", w: { network: 3 } }, { t: "I do not measure this", w: { network: 1 } }]),
    q("community_retention", "Retention", "What does your latest renewal or return-participation data show?", scale("Most members return or renew", "Retention is mixed", "Most members leave or disappear", { economy: 1, strategy: 1 })),
    q("community_value", "Strategy", "Can members name one recurring outcome the community helps them achieve?", scale("Yes — member evidence repeats the same outcome", "The value is understood but broad", "The value depends on how I explain it", { strategy: 1 })),
    q("community_member_led", "Leverage", "How much valuable activity happens without you initiating it?", scale("Members regularly create value for each other", "Some activity is member-led", "Nearly everything begins with me", { leverage: 1, network: 1 })),
    q("community_ops", "Systems", "Are onboarding, programming, and member follow-up repeatable?", scale("All three run from documented systems", "Some parts are repeatable", "Most parts are improvised", { systems: 1 })),
    q("community_owned", "Ownership", "Can you directly reach and export your member relationships?", scale("Yes — contacts, data, and access are owned", "Partly", "No — a platform controls the relationship", { ownership: 1, forces: 1 })),
    q("community_growth", "Building", "How many growth or programming experiments did you complete last month?", [{ t: "Four or more", w: { building: 10, focus: 8 } }, { t: "Two or three", w: { building: 7, focus: 6 } }, { t: "One", w: { building: 4, focus: 4 } }, { t: "None", w: { building: 1, focus: 2 } }]),
  ],
  product: [
    q("product_users", "Demand", "How many target users used the product in the last 30 days?", [{ t: "100 or more", w: { building: 10 } }, { t: "20–99", w: { building: 7 } }, { t: "1–19", w: { building: 4 } }, { t: "None", w: { building: 1 } }]),
    q("product_paid", "Economy", "What payment evidence exists?", scale("Repeat or growing revenue", "A few customers have paid", "No one has paid yet", { economy: 1, strategy: 1 })),
    q("product_retention", "Strategy", "What does your return-use or retention data show?", scale("Users repeatedly return to a core behavior", "Some return, but the pattern is unclear", "Few return or I do not measure it", { strategy: 1 })),
    q("product_cycle", "Systems", "How many user-informed releases shipped in the last 30 days?", [{ t: "Four or more", w: { systems: 10, building: 9 } }, { t: "Two or three", w: { systems: 7, building: 7 } }, { t: "One", w: { systems: 4, building: 4 } }, { t: "None", w: { systems: 1, building: 1 } }]),
    q("product_acquisition", "Distribution", "Can you name one repeatable source of qualified users?", scale("Yes — it produces users consistently", "One source shows promise", "No repeatable source yet", { network: 1, forces: 1 })),
    q("product_dependency", "Leverage", "How much operation or delivery still requires your manual attention?", scale("Very little", "Some important parts", "Most important parts", { leverage: 1, systems: 1 })),
    q("product_owned", "Ownership", "Do you own the customer relationship, product access, and core data?", scale("Yes — all three", "Most, with one major dependency", "A platform controls a critical part", { ownership: 1, forces: 1 })),
  ],
};

export const FOLLOW_UPS = Object.fromEntries(MODULES.map((module) => [module.key,
  q(`follow_${module.key}`, `Closer look · ${module.label}`, {
    leverage: "In the last month, how many hours of repeated work did an asset, system, or person remove from your plate?",
    systems: "How many recurring workflows could another person run today from written instructions?",
    strategy: "How many customer decisions last month were guided by one explicit audience and outcome?",
    building: "How many finished artifacts reached a real user, buyer, or audience member last month?",
    ownership: "How many new direct audience or customer relationships did you add last month?",
    network: "How many new people arrived through another person's recommendation last month?",
    economy: "How many months could the work continue at its current costs without new income?",
    focus: "How many planned work sessions last week ended with the intended output finished?",
    forces: "How many major decisions last month were based on your own customer evidence rather than a platform trend?",
  }[module.key], [
    { t: "Four or more", w: { [module.key]: 10 } },
    { t: "Two or three", w: { [module.key]: 7 } },
    { t: "One", w: { [module.key]: 4 } },
    { t: "None or not measured", w: { [module.key]: 1 } },
  ])
]));

export function buildDiagnosticQuestions(model, answers = []) {
  const base = [...UNIVERSAL_QUESTIONS, ...(MODEL_BRANCHES[model] || [])];
  if (answers.length < base.length) return base;
  return [...base, ...weakestModules(computeScores(answers), 3).map((key) => FOLLOW_UPS[key])];
}

// Kept for shared tests and tooling; the live diagnostic uses buildDiagnosticQuestions.
export const QUESTIONS = [...UNIVERSAL_QUESTIONS, ...MODEL_BRANCHES.creator];

export const ARCHETYPES = {
  OWNER: {
    name: "The Owner",
    line: "You hold equity and pipes. The game now is compounding, not proving.",
  },
  OPERATOR: {
    name: "The Operator",
    line: "You run tight systems and clear strategy. The gap is what you own when the music stops.",
  },
  BUILDER: {
    name: "The Builder",
    line: "You ship. But you're building on rented land with a single engine.",
  },
  STUCK_OPTIMIZER: {
    name: "The Stuck Optimizer",
    line: "Immaculate systems, sharpened focus — pointed at low-leverage work. Motion without acquisition.",
  },
};

export const FALLBACK_DIAGNOSES = {
  leverage: {
    diagnosis: "Everything you earn costs an hour. Nothing works while you sleep.",
    actions: [
      "Identify one repeated deliverable and productize it this month",
      "Move one manual workflow into code or automation this week",
      "Put one piece of media to work selling for you around the clock",
    ],
  },
  systems: {
    diagnosis: "Your operation depends on you showing up. That's a job with extra steps.",
    actions: [
      "Document your three most repeated workflows this week",
      "Automate or delegate one of them within 14 days",
      "Write the protocol you fall back to when motivation is gone",
    ],
  },
  strategy: {
    diagnosis: "You can't say who you serve or why they pick you. Effort without position is spend without return.",
    actions: [
      "Write your one-sentence positioning statement today",
      "List the three alternatives your audience compares you against",
      "Kill one offer or channel that doesn't serve the position",
    ],
  },
  building: {
    diagnosis: "Drafts don't compound. Ninety days without shipping is a quarter of tuition unpaid.",
    actions: [
      "Pick one asset and ship a v1 in 14 days — embarrassment included",
      "Set a public deadline where your audience can see it",
      "Cut scope until the ship date is unmissable",
    ],
  },
  ownership: {
    diagnosis: "Your audience lives on land you don't own. The landlord sets the terms.",
    actions: [
      "Add an email capture to every platform touchpoint this week",
      "Move your best 10% of followers to an owned channel",
      "Package one framework you give away free into an owned product",
    ],
  },
  network: {
    diagnosis: "There is no loop. Everything spreads only as far as your own push.",
    actions: [
      "Add one referral or share mechanic to your core offer",
      "Create one space where members talk to each other, not just to you",
      "Make sharing the work easier than describing it",
    ],
  },
  economy: {
    diagnosis: "One stream is a single point of failure with a boss attached.",
    actions: [
      "Write your monthly burn and your 'enough' number this week",
      "Map your second stream from an asset you already have",
      "Set an allocation rule: what every dollar in does before you touch it",
    ],
  },
  focus: {
    diagnosis: "Five projects at 20% each equals zero shipped. Dilution is invisible failure.",
    actions: [
      "Rank every active project — kill or freeze everything below #2",
      "Keep a written kill list next to the to-do list",
      "Schedule one weekly zoom-out to check the tunnel is pointed right",
    ],
  },
  forces: {
    diagnosis: "You're rowing hard inside a current you never mapped. The algorithm curates your ambition.",
    actions: [
      "Audit your top five information inputs — check who profits from each",
      "Before your next big move, write who profits, who blocks, and why",
      "Replace one algorithmic feed with one curated source",
    ],
  },
};

export function computeScores(answers) {
  const totals = {};
  const counts = {};
  MODULES.forEach((m) => {
    totals[m.key] = 0;
    counts[m.key] = 0;
  });
  answers.forEach((a) => {
    if (!a || !a.w) return;
    Object.entries(a.w).forEach(([k, v]) => {
      totals[k] += v;
      counts[k] += 1;
    });
  });
  const scores = {};
  MODULES.forEach((m) => {
    const raw = counts[m.key] ? totals[m.key] / (counts[m.key] * 10) : 0;
    scores[m.key] = Math.round(Math.pow(raw, 1.35) * 92);
  });
  return scores;
}

export function scoreBand(score) {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Working";
  if (score >= 35) return "Needs attention";
  return "Start here";
}

export function boardAverage(scores) {
  const values = MODULES.map((m) => scores[m.key]);
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function classify(s) {
  if (s.ownership >= 51 && s.economy >= 41 && s.leverage >= 41) return "OWNER";
  if (s.systems >= 46 && s.focus >= 46 && s.building < 36 && s.leverage < 36)
    return "STUCK_OPTIMIZER";
  if (s.building >= 41 && s.ownership < 41) return "BUILDER";
  if (s.systems >= 41 && s.strategy >= 41) return "OPERATOR";
  return s.building >= s.systems ? "BUILDER" : "OPERATOR";
}

export function weakestModules(scores, n) {
  return [...MODULES]
    .sort((a, b) => scores[a.key] - scores[b.key])
    .slice(0, n)
    .map((m) => m.key);
}

const BLOCKER_MODULES = {
  Time: ["systems", "focus", "leverage"],
  Money: ["economy", "ownership", "leverage"],
  Knowledge: ["strategy", "building"],
  Audience: ["network", "ownership", "building"],
  Discipline: ["focus", "systems", "building"],
};

function destinationLine(destination) {
  const lines = {
    "replace income": "Your stated exit is income replacement. Build assets that earn without adding equal hours.",
    "compounding audience": "Your stated exit is a compounding audience. Ownership and spread matter more than reach alone.",
    "paying product": "Your stated exit is a product with paying users. Shipping and market contact outrank polish.",
    "time freedom": "Your stated exit is time freedom. Any plan that grows your workload is pointed the wrong way.",
    "undefined destination": "You have not defined the exit. A tunnel with no exit is a hole.",
  };
  return lines[destination] || "Your destination is still loose. Define the win before optimizing the route.";
}

function blockerVerdict(blocker, weak, weakestLabel) {
  if (blocker === "Honestly, not sure") {
    return `You were not sure what is holding you back. The board says ${weakestLabel}.`;
  }
  const beliefModules = BLOCKER_MODULES[blocker] || [];
  if (beliefModules.some((module) => weak.includes(module))) {
    return `You said ${blocker.toLowerCase()}. The board agrees, but the sharpest gap is ${weakestLabel}.`;
  }
  return `You said ${blocker.toLowerCase()}. The board says ${weakestLabel}.`;
}

const MODEL_CONTEXT = {
  creator: {
    label: "creator business",
    evidence: "content, audience response, and offer behavior",
  },
  service: {
    label: "service business",
    evidence: "pipeline, delivery, and repeat-client behavior",
  },
  community: {
    label: "community",
    evidence: "participation, retention, and member-led value",
  },
  product: {
    label: "product",
    evidence: "usage, payment, retention, and release behavior",
  },
};

function stageLine(profile) {
  const model = MODEL_CONTEXT[profile.business_model] || MODEL_CONTEXT.creator;
  const stage = profile.stage || "current stage";
  const evidence = profile.recentEvidence || "limited external evidence";
  return `This ${model.label} is at ${stage}. The latest signal is ${evidence}; the reading weighs ${model.evidence}, not confidence alone.`;
}

export function buildFallbackMemo(archetypeKey, weak, profile = {}) {
  const weakestLabel = MODULES.find((m) => m.key === weak[0])?.label || weak[0];
  const blocker = profile.self_diagnosed_blocker;
  return {
    verdict: blocker
      ? blockerVerdict(blocker, weak, weakestLabel)
      : ARCHETYPES[archetypeKey].line,
    memo: [
      destinationLine(profile.twelve_month_destination),
      stageLine(profile),
      ...weak.slice(0, 3).map((k) => FALLBACK_DIAGNOSES[k].diagnosis),
    ],
    priorities: weak.map((k) => {
      const intervention = interventionFor(profile.business_model || "creator", k);
      return {
        module: k,
        diagnosis: `${FALLBACK_DIAGNOSES[k].diagnosis} In your ${MODEL_CONTEXT[profile.business_model]?.label || "business"}, this is showing up against ${profile.recentEvidence || "the evidence you reported"}.`,
        hypothesis: intervention.hypothesis,
        baseline: intervention.baseline,
        passSignal: intervention.passSignal,
        failSignal: intervention.failSignal,
        nextMove: intervention.nextMove,
        toolKey: intervention.toolKey,
        intervention,
        actions: intervention.moves.map((move) => move.detail),
      };
    }),
    risks: [
      "Your strongest module may be compensating for — and hiding — your weakest one.",
      "The gap you scored lowest on is usually the one you've been avoiding longest.",
    ],
  };
}
