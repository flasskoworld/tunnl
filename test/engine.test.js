import test from "node:test";
import assert from "node:assert/strict";
import {
  MODULES,
  QUESTIONS,
  MODEL_BRANCHES,
  UNIVERSAL_QUESTIONS,
  FOLLOW_UPS,
  buildFallbackMemo,
  classify,
  computeScores,
  scoreBand,
  weakestModules,
} from "../lib/engine.js";
import { buildProtocol, protocolProgress } from "../lib/protocol.js";
import { courseCorrectionMode, interventionKey, METHOD_VERSION, TUNNL_METHOD } from "../lib/methodology.js";
import { allInterventionTracks } from "../lib/interventions.js";
import { prefillVaultValues, vaultFor } from "../lib/vault.js";

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
  assert.match(days[1].context, /paid design workshop/);
  assert.match(days.at(-1).doneWhen, /Paid customers/);
});

test("progress counts only completed days from the current sprint", () => {
  const progress = protocolProgress({ 1: true, 2: true, 3: false, 99: true }, Array.from({ length: 14 }, (_, index) => ({ day: index + 1 })));
  assert.deepEqual(progress, { done: 2, total: 14, pct: 14 });
});

test("model-specific tracks remove cross-model action mismatches", () => {
  const productOwnership = allInterventionTracks().find((track) => track.id === "product.ownership");
  const serviceNetwork = allInterventionTracks().find((track) => track.id === "service.network");
  assert.doesNotMatch(productOwnership.moves.map((move) => move.detail).join(" "), /followers|email capture/i);
  assert.doesNotMatch(serviceNetwork.moves.map((move) => move.detail).join(" "), /members talk|member space/i);
  assert.match(productOwnership.moves[2].detail, /export|recovery|fallback/i);
  assert.match(serviceNetwork.moves[2].detail, /clients|partners|introduction/i);
});

test("recommended Decision Tools inherit and prefill the intervention", () => {
  const result = buildFallbackMemo("OPERATOR", ["network", "strategy", "building"], { business_model: "product" });
  const wrapped = { profile: { business_model: "product" }, memo: result };
  const tool = vaultFor("network", "product");
  const values = prefillVaultValues(wrapped, { targetMetric: "Activated users", baselineValue: "2", targetValue: "8" });
  assert.match(tool.subtitle, /product-native invitation loop/);
  assert.match(values["network:1"], /Activated users: 2 -> 8/);
  assert.match(values["network:4"], /accepted invitations/);
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
    const full = [...base, ...weak.map((key) => FOLLOW_UPS[key])];
    assert.equal(full.length, 15);
    assert.equal(new Set(full.map((question) => question.id)).size, 15);
  });
});

test("the reading combines model, stage, evidence, and constraint context", () => {
  const memo = buildFallbackMemo("BUILDER", ["strategy", "building", "focus"], {
    business_model: "service",
    stage: "early revenue",
    recentEvidence: "market signal",
    self_diagnosed_blocker: "Audience",
    twelve_month_destination: "paying product",
  });
  assert.match(memo.memo[1], /service business is at early revenue/);
  assert.match(memo.priorities[0].diagnosis, /service business/);
  assert.equal(memo.priorities[0].intervention.model, "service");
  assert.equal(memo.priorities[0].intervention.module, "strategy");
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
