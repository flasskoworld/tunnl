"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AsciiVeil from "../../components/AsciiVeil";
import {
  QUESTIONS,
  BLOCKER_QUESTION,
  ARCHETYPES,
  computeScores,
  classify,
  weakestModules,
  buildFallbackMemo,
} from "../../lib/engine";
import { asciiBar } from "../../lib/ascii";
import { syncReading, track } from "../../lib/clientData";

export default function Diagnostic() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [context, setContext] = useState("");
  const [destination, setDestination] = useState("");
  const [phase, setPhase] = useState("quiz"); // quiz | blocker | loading
  const [pendingAnswers, setPendingAnswers] = useState(null);

  const answer = (opt) => {
    const q = QUESTIONS[step];
    let nextAnswers = answers;
    if (q.context) {
      if (q.field === "destination") setDestination(opt.v);
      else setContext(opt.v);
    } else {
      nextAnswers = [...answers, { id: q.id, text: opt.t, w: opt.w }];
      setAnswers(nextAnswers);
    }
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Hold the answers; the blocker screen fires the engine.
      setPendingAnswers(nextAnswers);
      setPhase("blocker");
    }
  };

  const finish = async (finalAnswers, blocker) => {
    setPhase("loading");
    const scores = computeScores(finalAnswers);
    const archetype = classify(scores);
    const weak = weakestModules(scores, 3);

    const profile = {
      building: context,
      twelve_month_destination: destination,
      self_diagnosed_blocker: blocker,
      archetype: ARCHETYPES[archetype].name,
      scores,
      three_weakest_modules: weak,
      answers: finalAnswers.map((a) => ({ q: a.id, chose: a.text })),
    };

    const memo = buildFallbackMemo(archetype, weak, profile);

    const result = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      scores,
      archetype,
      profile,
      memo,
    };
    try {
      localStorage.setItem(
        "tunnl-result",
        JSON.stringify(result)
      );
    } catch (e) {}
    syncReading(result).catch(() => {});
    track("diagnostic_completed", { archetype, weakest: weak });
    router.push("/memo");
  };

  if (phase === "blocker") {
    return (
      <main className="shell">
        <div className="col">
          <div className="top">
            <div className="eyebrow">TUNNL · Diagnostic</div>
            <span className="num">before the reading</span>
          </div>
          <div className="q-module">The engine is warming up</div>
          <h2 className="question">{BLOCKER_QUESTION.q}</h2>
          <div>
            {BLOCKER_QUESTION.options.map((opt, i) => (
              <button
                key={i}
                className="option"
                onClick={() => finish(pendingAnswers, opt)}
              >
                <span className="key">[{String.fromCharCode(97 + i)}]</span>
                <span>{opt}</span>
              </button>
            ))}
            <div className="rule" />
          </div>
        </div>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="shell" style={{ alignItems: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 620 }}>
          <div className="frame" style={{ padding: "16px 6px" }}>
            <div className="stage" style={{ minHeight: 140 }}>
              <AsciiVeil width={46} height={13} />
            </div>
          </div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Reading the board…
          </div>
          <div style={{ fontSize: 11 }} className="soft">
            scoring modules · classifying position · drafting reading
          </div>
        </div>
      </main>
    );
  }

  const q = QUESTIONS[step];
  const pct = Math.round((step / QUESTIONS.length) * 100);

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Diagnostic</div>
          <span className="num">
            {String(step + 1).padStart(2, "0")}/{QUESTIONS.length}
          </span>
        </div>
        <div className="progress">{asciiBar(pct, 40)}</div>

        <div className="q-module">Module — {q.eyebrow}</div>
        <h2 className="question">{q.q}</h2>

        <div>
          {q.options.map((opt, i) => (
            <button key={i} className="option" onClick={() => answer(opt)}>
              <span className="key">[{String.fromCharCode(97 + i)}]</span>
              <span>{opt.t}</span>
            </button>
          ))}
          <div className="rule" />
        </div>
      </div>
    </main>
  );
}
