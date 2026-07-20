import test from "node:test";
import assert from "node:assert/strict";
import {
  MODULES,
  QUESTIONS,
  MODEL_BRANCHES,
  UNIVERSAL_QUESTIONS,
  FOLLOW_UPS,
  WORK_QUESTION,
  buildFallbackMemo,
  classify,
  computeScores,
  scoreBand,
  weakestModules,
} from "../lib/engine.js";
import { buildProtocol, dayIsAdvanced, nextActionableDay, protocolProgress } from "../lib/protocol.js";
import { courseCorrectionMode, interventionKey, METHOD_VERSION, TUNNL_METHOD } from "../lib/methodology.js";
import { allInterventionTracks, suggestedResultFor } from "../lib/interventions.js";
import { vaultFor } from "../lib/vault.js";
import { previewWorkspaceForReading } from "../lib/clientData.js";
import { projectBriefContext, recommendedSprintContext } from "../lib/projectBrief.js";

const scoredQuestions = QUESTIONS.filter((question) => !question.context);

test("the diagnostic returns bounded scores for every module", () => {
  const answers = scoredQuestions.map((question) => ({ w: question.options[0].w }));
  const scores = computeScores(answers);
  assert.deepEqual(Object.keys(scores), MODULES.map((module) => module.key));
  Object.values(scores).forEach((score) => assert.ok(score >= 0 && score <= 92));
});

test("score language stays clear and non-alarmist", () => {
  assert.equal(scoreBand(80), "Strong");
  assert.equal(scoreBand(60), "Working");
  assert.equal(scoreBand(40), "Needs attention");
  assert.equal(scoreBand(20), "Start here");
});

test("a reading produces exactly three ordered priorities", () => {
  const answers = scoredQuestions.map((question) => ({ w: question.options.at(-1).w }));
  const scores = computeScores(answers);
  const weak = weakestModules(scores, 3);
  const memo = buildFallbackMemo(classify(scores), weak, {
    twelve_month_destination: "paying product",
    self_diagnosed_blocker: "Knowledge",
  });
  assert.equal(memo.priorities.length, 3);
  assert.deepEqual(memo.priorities.map((priority) => priority.module), weak);
});

test("the Plan contains 14 sequenced, personalized days", () => {
  const memo = buildFallbackMemo("BUILDER", ["strategy", "building", "focus"], {
    twelve_month_destination: "paying product",
  });
  const days = buildProtocol(memo, {
    twelve_month_destination: "paying product",
    focusProject: "a paid design workshop",
    audience: "independent designers",
    targetMetric: "Paid customers",
    baselineValue: "0",
    targetValue: "1",
  });
  assert.equal(days.length, 14);
  assert.equal(days[0].type, "kickoff");
  assert.equal(days.at(-1).type, "close");
  assert.equal(days.some((day) => day.context?.startsWith("Apply this to")), false);
  assert.doesNotMatch(JSON.stringify(days), /Sprint Target|movement means|Paid customers starts at/);
  assert.match(days.at(-1).doneWhen, /strongest result/);
  assert.ok(days.filter((day) => day.type === "action").every((day) => day.sprintFocus === "a paid design workshop"));
});

test("progress counts only completed days from the current sprint", () => {
  const progress = protocolProgress({ 1: true, 2: true, 3: false, 99: true }, Array.from({ length: 14 }, (_, index) => ({ day: index + 1 })));
  assert.deepEqual(progress, { done: 2, total: 14, pct: 14 });
});

test("waiting tests advance the Plan without counting as complete", () => {
  const days = Array.from({ length: 4 }, (_, index) => ({ day: index + 1 }));
  const checked = { 1: true };
  const evidence = { 2: { status: "waiting" } };
  assert.equal(dayIsAdvanced(2, checked, evidence), true);
  assert.equal(nextActionableDay(days, checked, evidence).day, 3);
  assert.deepEqual(protocolProgress(checked, days), { done: 1, total: 4, pct: 25 });
});

test("a new diagnostic gets a clean dev preview workspace", () => {
  const oldWorkspace = {
    setup: { readingId: "old-reading", focusProject: "Launch a paid creator workshop" },
    protocol_checked: { 1: true, 2: true },
    protocol_evidence: { 2: { output: "Old work" } },
  };
  const next = previewWorkspaceForReading(oldWorkspace, {
    id: "new-reading",
    profile: { business_model: "product", focusProject: "Build a client research repository" },
  });
  assert.equal(next.setup.readingId, "new-reading");
  assert.equal(next.setup.projectBrief, "Build a client research repository");
  assert.equal(next.setup.projectIntent, "Product validation");
  assert.equal(next.setup.focusProject, "Test one product assumption with target users and decide what to build next.");
  assert.deepEqual(next.protocol_checked, {});
  assert.deepEqual(next.protocol_evidence, {});
});

test("Tunnl derives a category-level sprint instead of echoing the project brief", () => {
  const service = recommendedSprintContext("providing AI services for others", {
    model: "service",
    primaryModule: "strategy",
  });
  const community = recommendedSprintContext("improve member participation in my private community", {
    model: "community",
    primaryModule: "network",
  });
  assert.equal(service.category, "Offer and revenue");
  assert.equal(service.focus, "Validate one service offer for one best-fit buyer and create a real buying signal.");
  assert.notEqual(service.focus.toLowerCase(), service.brief.toLowerCase());
  assert.equal(community.category, "Audience and participation");
  assert.match(community.focus, /participation loop/i);
  assert.notEqual(service.focus, community.focus);
});

test("an existing dev preview migrates a legacy raw focus without erasing its work", () => {
  const workspace = {
    setup: { readingId: "same-reading", focusProject: "providing AI services for others" },
    protocol_checked: { 1: true },
  };
  const next = previewWorkspaceForReading(workspace, {
    id: "same-reading",
    profile: { business_model: "service", focusProject: "providing AI services for others" },
    memo: { priorities: [{ module: "strategy" }] },
  });
  assert.equal(next.setup.projectBrief, "providing AI services for others");
  assert.equal(next.setup.focusProject, "Validate one service offer for one best-fit buyer and create a real buying signal.");
  assert.deepEqual(next.protocol_checked, { 1: true });
});

test("the written project brief changes the sprint commission", () => {
  const launch = projectBriefContext("Launch a paid workshop for independent designers");
  const product = projectBriefContext("Build a client research repository for service teams");
  assert.equal(launch.label, "Launch");
  assert.equal(product.label, "Product validation");
  assert.notEqual(launch.moves.test, product.moves.test);
});

test("Tunnl suggests an honest result without inventing the baseline", () => {
  const suggestion = suggestedResultFor("service", "strategy");
  assert.equal(suggestion.metric, "Promise recognition");
  assert.match(suggestion.baselinePrompt, /last five inquiries/i);
  assert.match(suggestion.target, /three prospects/i);
  assert.equal(Object.hasOwn(suggestion, "baseline"), false);
});

test("model-specific tracks remove cross-model action mismatches", () => {
  const productOwnership = allInterventionTracks().find((track) => track.id === "product.ownership");
  const serviceNetwork = allInterventionTracks().find((track) => track.id === "service.network");
  assert.doesNotMatch(productOwnership.moves.map((move) => move.detail).join(" "), /followers|email capture/i);
  assert.doesNotMatch(serviceNetwork.moves.map((move) => move.detail).join(" "), /members talk|member space/i);
  assert.match(productOwnership.moves[2].detail, /export|recovery|fallback/i);
  assert.match(serviceNetwork.moves[2].detail, /clients|partners|introduction/i);
});

test("recommended Decision Tools separate guidance from user evidence", () => {
  const tool = vaultFor("network", "product", {
    focusProject: "Test one product assumption with target users and decide what to build next.",
    projectBrief: "Launch a collaborative research workspace",
  });
  assert.match(tool.subtitle, /product-native invitation loop/);
  assert.match(tool.fields[0].label, /qualified users.*existing user/i);
  assert.match(tool.guidance.find((item) => item.label === "Real-world test").value, /accepted invitations/);
  assert.ok(tool.fields.every((field) => field.key));
  assert.equal(tool.focusProject, "Test one product assumption with target users and decide what to build next.");
  assert.equal(tool.projectIntent, "Launch");
  assert.match(tool.fields.find((field) => field.key === "decision").label, /this work/);
});

test("the Plan respects a smaller weekly time budget", () => {
  const memo = buildFallbackMemo("BUILDER", ["building", "focus", "strategy"], {});
  const compact = buildProtocol(memo, { weeklyCapacity: "2 hours" });
  const standard = buildProtocol(memo, { weeklyCapacity: "4 hours" });
  assert.ok(compact[1].minutes < standard[1].minutes);
  assert.ok(compact[1].minutes >= 10);
});

test("Day 7 adapts the second half without changing the 14-day shape", () => {
  const memo = buildFallbackMemo("BUILDER", ["building", "focus", "strategy"], {});
  const days = buildProtocol(memo, { focusProject: "a creator toolkit" }, {
    direction: "change",
    revisedConstraint: "the offer is unclear",
    revisedModule: "strategy",
  });
  assert.equal(days.length, 14);
  assert.equal(days[6].type, "checkpoint");
  assert.equal(days[6].title, "Course Correction");
  assert.match(days[7].detail, /offer is unclear/);
  assert.equal(days[7].module, "strategy");
  assert.equal(days[7].interventionId, interventionKey("creator.strategy", "decision"));
  assert.ok(days.slice(7, 13).every((day) => day.module === "strategy"));
});

test("the Tunnl Method is versioned and resolves correction modes", () => {
  assert.equal(METHOD_VERSION, "1.1");
  assert.deepEqual(TUNNL_METHOD.map((stage) => stage.key), ["diagnose", "focus", "test", "adjust", "prove"]);
  assert.equal(courseCorrectionMode({ friction: "scope" }), "narrow");
  assert.equal(courseCorrectionMode({ direction: "change" }), "change");
});

test("each business model produces a 15-question adaptive path", () => {
  Object.entries(MODEL_BRANCHES).forEach(([model, branch]) => {
    assert.equal(UNIVERSAL_QUESTIONS.length, 5);
    assert.equal(branch.length, 7, `${model} should have seven model questions`);
    const base = [...UNIVERSAL_QUESTIONS, ...branch];
    const answers = base.map((question) => ({ id: question.id, text: question.options[0].t, w: question.options[0].w }));
    const weak = weakestModules(computeScores(answers), 3);
    const full = [...base, ...weak.slice(0, 2).map((key) => FOLLOW_UPS[key]), WORK_QUESTION];
    assert.equal(full.length, 15);
    assert.equal(new Set(full.map((question) => question.id)).size, 15);
    assert.equal(full.at(-1).textInput, true);
    assert.equal(full.at(-1).context, true);
  });
});

test("the reading combines model, stage, evidence, and constraint context", () => {
  const memo = buildFallbackMemo("BUILDER", ["strategy", "building", "focus"], {
    business_model: "service",
    stage: "early revenue",
    recentEvidence: "market signal",
    self_diagnosed_blocker: "Audience",
    twelve_month_destination: "paying product",
    focusProject: "Launch a paid research workshop for independent designers",
  });
  assert.match(memo.memo[1], /service business is at early revenue/);
  assert.match(memo.priorities[0].diagnosis, /service business/);
  assert.equal(memo.priorities[0].intervention.model, "service");
  assert.equal(memo.priorities[0].intervention.module, "strategy");
  assert.match(memo.memo.join(" "), /paid research workshop/);
});

test("every model and module has a complete evidence-producing intervention", () => {
  const tracks = allInterventionTracks();
  assert.equal(tracks.length, 36);
  tracks.forEach((track) => {
    assert.equal(track.moves.length, 3);
    assert.deepEqual(track.moves.map((move) => move.kind), ["Decision", "Artifact", "Real-world test"]);
    assert.ok(track.hypothesis);
    assert.ok(track.baseline);
    assert.ok(track.passSignal);
    assert.ok(track.failSignal);
    assert.ok(track.nextMove);
    assert.ok(track.toolKey);
  });
});
