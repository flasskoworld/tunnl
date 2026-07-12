// ─────────────────────────────────────────────
// TUNNL engine — modules, diagnostic, scoring
// Shared by client pages and the API route.
// ─────────────────────────────────────────────

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

export const QUESTIONS = [
  {
    id: "context",
    eyebrow: "Context",
    q: "What are you building right now?",
    context: true,
    options: [
      { t: "A creator / media brand", v: "creator brand" },
      { t: "A community or membership", v: "community" },
      { t: "A product or software", v: "product / software" },
      { t: "A service or client business", v: "service business" },
      { t: "Still deciding", v: "undecided" },
    ],
  },
  {
    id: "destination",
    eyebrow: "Destination",
    q: "Twelve months from now, what must be true for you to call this a win?",
    context: true,
    field: "destination",
    options: [
      { t: "This replaced my income", v: "replace income" },
      { t: "An audience and community that compounds", v: "compounding audience" },
      { t: "A product with paying users", v: "paying product" },
      { t: "More freedom over my time", v: "time freedom" },
      { t: "I haven't defined it yet", v: "undefined destination" },
    ],
  },
  {
    id: "qL1",
    eyebrow: "Leverage",
    q: "When your revenue grows, what grows with it?",
    options: [
      { t: "Assets and systems — my hours stay flat", w: { leverage: 10 } },
      { t: "Both, roughly together", w: { leverage: 5 } },
      { t: "My hours. More money means more of me", w: { leverage: 1 } },
    ],
  },
  {
    id: "q2",
    eyebrow: "Systems",
    q: "If you disappeared for two weeks, what happens to your operation?",
    options: [
      { t: "It runs — systems and automation carry it", w: { systems: 10, leverage: 9 } },
      { t: "It slows, but survives", w: { systems: 6, leverage: 5 } },
      { t: "Everything stops", w: { systems: 2, leverage: 1 } },
    ],
  },
  {
    id: "q3",
    eyebrow: "Strategy",
    q: "Can you state, in one sentence, who you serve and why they choose you over the alternatives?",
    options: [
      { t: "Yes — instantly", w: { strategy: 10 } },
      { t: "Roughly", w: { strategy: 5 } },
      { t: "Not really", w: { strategy: 0 } },
    ],
  },
  {
    id: "q4",
    eyebrow: "Strategy · Focus",
    q: "How do you decide what to work on each day?",
    options: [
      { t: "Written priorities tied to one goal", w: { strategy: 8, focus: 8, systems: 7 } },
      { t: "Whatever has a deadline", w: { strategy: 4, focus: 4, systems: 4 } },
      { t: "Whatever excites me that day", w: { strategy: 2, focus: 2, systems: 2 } },
      { t: "Whatever other people ask of me", w: { strategy: 1, focus: 1, systems: 1 } },
    ],
  },
  {
    id: "q5",
    eyebrow: "Building",
    q: "What have you shipped in the last 90 days?",
    options: [
      { t: "Multiple assets — product, content system, infrastructure", w: { building: 10 } },
      { t: "One real thing, live in public", w: { building: 7 } },
      { t: "Lots of drafts, nothing public", w: { building: 3 } },
      { t: "Nothing", w: { building: 0 } },
    ],
  },
  {
    id: "q5b",
    eyebrow: "Building",
    q: "Where is your last big idea right now?",
    options: [
      { t: "Live — and earning or growing", w: { building: 10, leverage: 8 } },
      { t: "Built, but sitting unlaunched", w: { building: 5, leverage: 2 } },
      { t: "Still in my notes", w: { building: 1, leverage: 0 } },
    ],
  },
  {
    id: "q6",
    eyebrow: "Ownership",
    q: "Where does your audience or customer base primarily live?",
    options: [
      { t: "My email list or community I own", w: { ownership: 10, forces: 9 } },
      { t: "Split between platforms and owned channels", w: { ownership: 6, forces: 5 } },
      { t: "Entirely on social platforms", w: { ownership: 2, forces: 2 } },
      { t: "I don't have an audience yet", w: { ownership: 0, building: 2, forces: 5 } },
    ],
  },
  {
    id: "q7",
    eyebrow: "Ownership · Economy",
    q: "How does money reach you?",
    options: [
      { t: "Multiple streams, including things I own", w: { ownership: 10, economy: 10 } },
      { t: "One stream from something I own", w: { ownership: 8, economy: 4 } },
      { t: "Freelance or client checks", w: { ownership: 5, economy: 5 } },
      { t: "A single paycheck", w: { ownership: 2, economy: 2 } },
    ],
  },
  {
    id: "q10",
    eyebrow: "Network Effects",
    q: "Does your work spread without you pushing it?",
    options: [
      { t: "Yes — referrals and shares happen weekly", w: { network: 10, leverage: 8 } },
      { t: "Occasionally", w: { network: 5, leverage: 4 } },
      { t: "Only when I promote it myself", w: { network: 1, leverage: 1 } },
    ],
  },
  {
    id: "q11",
    eyebrow: "Network Effects",
    q: "Do your customers or members interact with each other?",
    options: [
      { t: "Yes — an active community", w: { network: 10 } },
      { t: "A little", w: { network: 5 } },
      { t: "No — everything routes through me", w: { network: 1 } },
    ],
  },
  {
    id: "q12",
    eyebrow: "Tunnel Vision",
    q: "How many active projects are you running right now?",
    options: [
      { t: "One or two", w: { focus: 10 } },
      { t: "Three or four", w: { focus: 6 } },
      { t: "Five or more", w: { focus: 2 } },
    ],
  },
  {
    id: "q13",
    eyebrow: "Invisible Forces",
    q: "Who's really steering your attention and moves?",
    options: [
      { t: "Me — curated inputs, and I map who profits before big moves", w: { forces: 10 } },
      { t: "Mixed — some awareness, some drift", w: { forces: 5 } },
      { t: "The feed and the crowd decide more than I admit", w: { forces: 1 } },
    ],
  },
  {
    id: "q9",
    eyebrow: "Personal Economy",
    q: "Do you know your monthly burn and your written 'enough' number?",
    options: [
      { t: "Both — written down", w: { economy: 10 } },
      { t: "Roughly, in my head", w: { economy: 5 } },
      { t: "No", w: { economy: 0 } },
    ],
  },
];


// Asked during the loading transition — fills the wait, arms the memo
// with a belief the engine can confirm or overturn.
export const BLOCKER_QUESTION = {
  q: "One last thing — what do you believe is holding you back?",
  options: [
    "Time",
    "Money",
    "Knowledge",
    "Audience",
    "Discipline",
    "Honestly, not sure",
  ],
};

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
    scores[m.key] = counts[m.key]
      ? Math.round((totals[m.key] / (counts[m.key] * 10)) * 100)
      : 0;
  });
  return scores;
}

export function classify(s) {
  if (s.ownership >= 65 && s.economy >= 55 && s.leverage >= 55) return "OWNER";
  if (s.systems >= 60 && s.focus >= 60 && s.building < 50 && s.leverage < 50)
    return "STUCK_OPTIMIZER";
  if (s.building >= 55 && s.ownership < 55) return "BUILDER";
  if (s.systems >= 55 && s.strategy >= 55) return "OPERATOR";
  return s.building >= s.systems ? "BUILDER" : "OPERATOR";
}

export function weakestModules(scores, n) {
  return [...MODULES]
    .sort((a, b) => scores[a.key] - scores[b.key])
    .slice(0, n)
    .map((m) => m.key);
}

export function buildFallbackMemo(archetypeKey, weak) {
  return {
    verdict: ARCHETYPES[archetypeKey].line,
    memo: weak.map((k) => FALLBACK_DIAGNOSES[k].diagnosis),
    priorities: weak.map((k) => ({
      module: k,
      diagnosis: FALLBACK_DIAGNOSES[k].diagnosis,
      actions: FALLBACK_DIAGNOSES[k].actions,
    })),
    risks: [
      "Your strongest module may be compensating for — and hiding — your weakest one.",
      "The gap you scored lowest on is usually the one you've been avoiding longest.",
    ],
  };
}
