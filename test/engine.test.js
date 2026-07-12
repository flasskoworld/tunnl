import test from "node:test";
import assert from "node:assert/strict";
import {
  MODULES,
  QUESTIONS,
  buildFallbackMemo,
  classify,
  computeScores,
  scoreBand,
  weakestModules,
} from "../lib/engine.js";
import { buildProtocol, protocolProgress } from "../lib/protocol.js";

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
