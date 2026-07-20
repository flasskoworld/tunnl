"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AsciiVeil from "../../components/AsciiVeil";
import {
  MODEL_QUESTION,
  UNIVERSAL_QUESTIONS,
  MODEL_BRANCHES,
  FOLLOW_UPS,
  WORK_QUESTION,
  ARCHETYPES,
  computeScores,
  classify,
  weakestModules,
  buildFallbackMemo,
} from "../../lib/engine";
import { asciiBar } from "../../lib/ascii";
import { syncReading, track } from "../../lib/clientData";

const TOTAL_QUESTIONS = 15;
const MODEL_LABELS = { creator: "Creator", service: "Service", community: "Community", product: "Product" };

export default function Diagnostic() {
  const router = useRouter();
  const [model, setModel] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("model"); // model | quiz | review | loading

  const selectModel = (value) => {
    setModel(value);
    setQuestions([...UNIVERSAL_QUESTIONS, ...MODEL_BRANCHES[value]]);
    setAnswers([]);
    setStep(0);
    setPhase("quiz");
    track("diagnostic_started", { model: value });
  };

  const recordAnswer = (opt) => {
    const question = questions[step];
    const entry = { id: question.id, text: opt.t, w: opt.w || {}, value: opt.v, field: question.field };
    const nextAnswers = [...answers];
    nextAnswers[step] = entry;
    setAnswers(nextAnswers);

    if (step === 11 && questions.length === 12) {
      const weak = weakestModules(computeScores(nextAnswers), 2);
      setQuestions([...questions, ...weak.map((key) => FOLLOW_UPS[key]), WORK_QUESTION]);
      setStep(12);
      return;
    }
    if (step + 1 < questions.length) {
      setStep(step + 1);
      return;
    }
    setPhase("review");
  };

  const updateWrittenAnswer = (value) => {
    const question = questions[step];
    const nextAnswers = [...answers];
    nextAnswers[step] = { id: question.id, text: value, value, field: question.field, w: {} };
    setAnswers(nextAnswers);
  };

  const submitWrittenAnswer = (event) => {
    event.preventDefault();
    const value = answers[step]?.value?.trim();
    if (!value || value.length < 12) return;
    const nextAnswers = [...answers];
    nextAnswers[step] = { ...nextAnswers[step], text: value, value };
    setAnswers(nextAnswers);
    setPhase("review");
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else setPhase("model");
  };

  const editAnswer = (index) => {
    setStep(index);
    setPhase("quiz");
  };

  const finish = async () => {
    setPhase("loading");
    const scores = computeScores(answers);
    const archetype = classify(scores);
    const weak = weakestModules(scores, 3);
    const fields = Object.fromEntries(answers.filter((answer) => answer?.field).map((answer) => [answer.field, answer.value]));
    const profile = {
      business_model: model,
      building: MODEL_LABELS[model].toLowerCase(),
      stage: fields.stage,
      twelve_month_destination: fields.destination,
      weeklyCapacity: fields.weeklyCapacity,
      recentEvidence: fields.recentEvidence,
      self_diagnosed_blocker: fields.blocker,
      focusProject: fields.focusProject,
      archetype: ARCHETYPES[archetype].name,
      scores,
      three_weakest_modules: weak,
      answers: answers.map((answer) => ({ q: answer.id, chose: answer.text })),
    };
    const memo = buildFallbackMemo(archetype, weak, profile);
    const result = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), scores, archetype, profile, memo };
    try { localStorage.setItem("tunnl-result", JSON.stringify(result)); } catch (error) {}
    syncReading(result).catch(() => {});
    track("diagnostic_completed", { archetype, weakest: weak, model });
    router.push("/memo");
  };

  const currentQuestion = phase === "model" ? MODEL_QUESTION : questions[step];
  useEffect(() => {
    if (phase !== "model" && phase !== "quiz") return undefined;
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const index = event.key.toLowerCase().charCodeAt(0) - 97;
      const option = currentQuestion?.options?.[index];
      if (index >= 0 && option) {
        event.preventDefault();
        if (phase === "model") selectModel(option.v);
        else recordAnswer(option);
      }
      if (event.key === "Backspace" && phase === "quiz") {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, currentQuestion, answers, step]);

  if (phase === "loading") {
    return <main className="shell" style={{ alignItems: "center" }}><div style={{ textAlign: "center", maxWidth: 620 }}><div className="frame" style={{ padding: "16px 6px" }}><div className="stage" style={{ minHeight: 140 }}><AsciiVeil width={46} height={13} /></div></div><div className="eyebrow" style={{ marginBottom: 10 }}>Reading the board…</div><div style={{ fontSize: 11 }} className="soft">weighing evidence · comparing patterns · drafting your reading</div></div></main>;
  }

  if (phase === "review") {
    return (
      <main className="shell"><div className="col">
        <div className="top"><div className="eyebrow">TUNNL · Review</div><span className="num">15/15</span></div><div className="rule" />
        <div style={{ padding: "26px 0 8px" }}><div className="q-module">Before the reading</div><h1 className="serif diagnostic-review-title">Review your answers.</h1><p className="copy soft">Correct anything that does not reflect the work as it is today.</p></div>
        <button className="review-answer model-review" onClick={() => setPhase("model")}><span>Model</span><strong>{MODEL_LABELS[model]}</strong><em>Change</em></button>
        <div className="diagnostic-review-list">{questions.map((question, index) => <button className="review-answer" key={question.id} onClick={() => editAnswer(index)}><span>{String(index + 1).padStart(2, "0")} · {question.eyebrow}</span><strong>{answers[index]?.text}</strong><em>Edit</em></button>)}</div>
        <div className="review-actions"><button className="btn" onClick={finish}>Create my reading</button><button className="btn ghost" onClick={() => editAnswer(14)}>Back</button></div>
      </div></main>
    );
  }

  const isModel = phase === "model";
  const pct = isModel ? 0 : Math.round(((step + 1) / TOTAL_QUESTIONS) * 100);
  return (
    <main className="shell"><div className="col">
      <div className="top"><div className="eyebrow">TUNNL · Diagnostic</div><span className="num">{isModel ? "Start" : `${String(step + 1).padStart(2, "0")}/${TOTAL_QUESTIONS}`}</span></div>
      {!isModel && <div className="progress">{asciiBar(pct, 40)}</div>}
      <div className="q-module">{isModel ? "Choose your path" : `Module — ${currentQuestion.eyebrow}`}</div>
      <h2 className="question">{currentQuestion.q}</h2>
      {currentQuestion.textInput ? <form className="diagnostic-written" onSubmit={submitWrittenAnswer}><p>{currentQuestion.prompt}</p><textarea autoFocus maxLength={600} rows={7} value={answers[step]?.value || ""} onChange={(event) => updateWrittenAnswer(event.target.value)} placeholder={currentQuestion.placeholder} /><div className="written-meta"><span>{answers[step]?.value?.length || 0}/600</span><button className="btn" type="submit" disabled={(answers[step]?.value?.trim().length || 0) < 12}>Continue to review</button></div></form> : <div>{currentQuestion.options.map((opt, index) => <button key={opt.t} className={`option${!isModel && answers[step]?.text === opt.t ? " selected" : ""}`} onClick={() => isModel ? selectModel(opt.v) : recordAnswer(opt)}><span className="key">[{String.fromCharCode(97 + index)}]</span><span>{opt.t}</span></button>)}<div className="rule" /></div>}
      {!isModel && <button className="diagnostic-back" onClick={goBack}>← Back</button>}
    </div></main>
  );
}
