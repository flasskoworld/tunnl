const PROJECT_INTENTS = [
  {
    key: "launch",
    label: "Launch",
    pattern: /\b(launch(?:ing|ed)?|release|rollout|debut|go live|ship(?:ping|ped)?)\b/i,
    moves: {
      decision: "Set the launch boundary: who it is for, what must ship, and what will wait.",
      artifact: "Build the smallest launch-ready asset that lets a real person understand the promise and act.",
      test: "Put the launch promise in front of intended people and record what they do next.",
    },
  },
  {
    key: "commercial",
    label: "Offer and revenue",
    pattern: /\b(paid|sell(?:ing)?|sales|revenue|buyer|client|customer|enroll(?:ing|ed)?|offer|package|pricing|services?|consulting|agency)\b/i,
    moves: {
      decision: "Choose the buyer, paid outcome, and commercial tradeoff this project will test first.",
      artifact: "Build the smallest offer or sales asset that makes the value and next step unmistakable.",
      test: "Put the offer in front of qualified people and record buying behavior, objections, and next steps.",
    },
  },
  {
    key: "product",
    label: "Product validation",
    pattern: /\b(product|software|app|platform|tool|prototype|feature|repository|database)\b/i,
    moves: {
      decision: "Choose the single user behavior or product assumption this sprint must resolve.",
      artifact: "Build the smallest usable version that can produce behavioral evidence.",
      test: "Put it in the hands of target users and observe use rather than relying on stated interest.",
    },
  },
  {
    key: "participation",
    label: "Audience and participation",
    pattern: /\b(audience|community|member|subscriber|newsletter|content|grow(?:ing|th)?|engagement)\b/i,
    moves: {
      decision: "Choose the specific person and participation behavior this sprint will prioritize.",
      artifact: "Build the smallest invitation, experience, or piece of work that can earn that behavior.",
      test: "Put it in front of the intended people and measure response, participation, and return behavior.",
    },
  },
  {
    key: "operations",
    label: "Operational improvement",
    pattern: /\b(system|process|workflow|operation|automat(?:e|ing|ed|ion)|delegate|delivery|efficiency)\b/i,
    moves: {
      decision: "Choose the recurring bottleneck and the operating standard that will replace it.",
      artifact: "Build the smallest reusable workflow, template, or automation needed to run the change.",
      test: "Run the new process in real work and compare time, quality, and dependence with the old approach.",
    },
  },
];

const GENERAL_CONTEXT = {
  key: "specific-work",
  label: "Specific work",
  moves: {
    decision: "Choose the one tradeoff that gives this work a clearer path forward.",
    artifact: "Build the smallest usable asset that advances this work and creates evidence.",
    test: "Put the central assumption in contact with the people this work is meant to serve.",
  },
};

const MODULE_FOCUSES = {
  leverage: "Remove one repeated workload and confirm that the saved capacity holds.",
  systems: "Turn one recurring workflow into a repeatable process that can run reliably.",
  strategy: "Clarify one audience, one promised outcome, and the evidence that supports the choice.",
  building: "Ship one smallest useful version and use real response to decide what comes next.",
  ownership: "Move one important audience or customer relationship toward direct access and ownership.",
  network: "Test one referral or participation loop and measure whether it carries the work farther.",
  economy: "Validate one economic variable and use the result to make a clearer allocation decision.",
  focus: "Finish one meaningful priority by protecting it from competing work for 14 days.",
  forces: "Make one consequential decision using observable evidence instead of outside pressure.",
};

const SPRINT_DIRECTIONS = {
  creator: {
    leverage: "Turn one idea into a reusable content system.",
    systems: "Establish a dependable publishing rhythm.",
    strategy: "Clarify one audience and outcome promise.",
    building: "Ship one smaller public release.",
    ownership: "Move engaged people into a direct channel.",
    network: "Create a clear reason to share.",
    economy: "Connect proven audience demand to one offer.",
    focus: "Commit to one editorial and commercial priority.",
    forces: "Replace algorithm cues with direct audience evidence.",
  },
  service: {
    leverage: "Productize one repeated deliverable.",
    systems: "Document one reliable delivery path.",
    strategy: "Narrow one service promise.",
    building: "Ship one concrete sales or delivery asset.",
    ownership: "Build a direct prospect and client channel.",
    network: "Install a deliberate introduction loop.",
    economy: "Identify the service with the strongest value-to-cost relationship.",
    focus: "Concentrate on one offer and one pipeline action.",
    forces: "Ground positioning in buyer evidence.",
  },
  community: {
    leverage: "Launch one member-led ritual.",
    systems: "Install consistent onboarding and follow-up.",
    strategy: "Organize around one recurring member outcome.",
    building: "Run one member-facing experiment.",
    ownership: "Secure direct access to member relationships.",
    network: "Create a member-to-member value loop.",
    economy: "Tie one paid promise to a recurring member outcome.",
    focus: "Center the sprint on one member outcome.",
    forces: "Let member evidence govern the next decision.",
  },
  product: {
    leverage: "Remove one repeated manual operation.",
    systems: "Tighten the evidence-to-release loop.",
    strategy: "Define one target user and core job.",
    building: "Ship one small instrumented release.",
    ownership: "Secure customer identity, access, and core data.",
    network: "Add a product-native invitation loop.",
    economy: "Choose the unit-economic constraint to move first.",
    focus: "Commit to one product question and release objective.",
    forces: "Let user behavior set the roadmap priority.",
  },
};

export function projectBriefContext(brief = "") {
  const value = String(brief).trim();
  const matches = PROJECT_INTENTS.filter((item) => item.pattern.test(value));
  const priority = ["launch", "product", "commercial", "participation", "operations"];
  const intent = priority.map((key) => matches.find((item) => item.key === key)).find(Boolean) || GENERAL_CONTEXT;
  return { ...intent, brief: value };
}

export function recommendedSprintContext(brief = "", { model = "creator", primaryModule = "focus" } = {}) {
  const context = projectBriefContext(brief);
  const focus = SPRINT_DIRECTIONS[model]?.[primaryModule]
    || MODULE_FOCUSES[primaryModule]
    || MODULE_FOCUSES.focus;
  return {
    ...context,
    category: context.label,
    focus,
  };
}
