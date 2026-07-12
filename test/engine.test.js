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
    successMeasure: "one paid customer",
  });
  assert.equal(days.length, 14);
  assert.equal(days[0].type, "kickoff");
  assert.equal(days.at(-1).type, "close");
  assert.match(days[1].context, /paid design workshop/);
  assert.match(days.at(-1).doneWhen, /one paid customer/);
});

test("progress counts completed days", () => {
  const progress = protocolProgress({ 1: true, 2: true, 3: false }, Array.from({ length: 14 }));
  assert.deepEqual(progress, { done: 2, total: 14, pct: 14 });
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
  });
  assert.equal(days.length, 14);
  assert.equal(days[6].type, "checkpoint");
  assert.equal(days[6].title, "Course Correction");
  assert.match(days[7].detail, /offer is unclear/);
  assert.equal(days[7].interventionId, interventionKey(8));
});

test("the Tunnl Method is versioned and resolves correction modes", () => {
  assert.equal(METHOD_VERSION, "1.0");
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
  assert.match(memo.priorities[0].actions[0], /For your service business/);
});
