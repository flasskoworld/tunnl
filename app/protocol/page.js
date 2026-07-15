"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MODULES } from "../../lib/engine";
import { buildProtocol, protocolProgress } from "../../lib/protocol";
import { loadAccountWorkspace, readingForWorkspace, saveWorkspace, track } from "../../lib/clientData";
import { OUTCOME_SIGNALS, TUNNL_METHOD } from "../../lib/methodology";
import { vaultFor } from "../../lib/vault";

function ProtocolInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking | denied | ready
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState({});
  const [openDay, setOpenDay] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [review, setReview] = useState({ actualValue: "", targetStatus: "", strongestResult: "", unresolved: "", nextCommitment: "" });
  const [evidence, setEvidence] = useState({});
  const [checkpoint, setCheckpoint] = useState({ clearestSignal: "", friction: "", direction: "continue", revisedConstraint: "", revisedModule: "" });
  const [planProfile, setPlanProfile] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [completionMessage, setCompletionMessage] = useState({});

  useEffect(() => {
    (async () => {
      const sessionId = params.get("session_id");

      // Freshly returned from Stripe — confirm this specific session first.
      if (sessionId) {
        try {
          const res = await fetch(`/api/verify-purchase?session_id=${sessionId}`);
          const data = await res.json();
          if (data.paid) {
            try { localStorage.setItem("tunnl-starter-unlocked", "true"); } catch (e) {}
          }
        } catch (e) {}
      }

      // Server session is the source of truth — not just localStorage,
      // so the same account unlocks on any device once signed in.
      const previewingStarter =
        process.env.NODE_ENV === "development" &&
        (params.get("preview") === "starter" ||
          localStorage.getItem("tunnl-dev-starter-preview") === "true");
      if (previewingStarter) localStorage.setItem("tunnl-dev-starter-preview", "true");
      setIsPreview(previewingStarter);
      let unlocked = previewingStarter;
      let accountData = null;
      if (previewingStarter) {
        try {
          const previewWorkspace = localStorage.getItem("tunnl-dev-workspace");
          if (previewWorkspace) accountData = { workspace: JSON.parse(previewWorkspace), readings: [] };
        } catch (e) {}
      }
      if (!previewingStarter) {
        try {
          const meRes = await fetch("/api/me");
          const me = await meRes.json();
          unlocked = !!me.unlocked;
          if (unlocked) accountData = await loadAccountWorkspace();
        } catch (e) {}
      }

      if (!unlocked) {
        setStatus("denied");
        return;
      }
      if (!previewingStarter && accountData && !accountData.workspace?.protocol_start_date) {
        window.location.href = "/account";
        return;
      }

      try {
        const raw = localStorage.getItem("tunnl-result");
        const localResult = raw ? JSON.parse(raw) : null;
        const saved = readingForWorkspace(accountData, localResult);
        setResult(saved);
        if (saved?.memo) {
          const savedSetup = accountData?.workspace?.setup || {};
          const combinedProfile = { ...saved.profile, ...savedSetup };
          setPlanProfile(combinedProfile);
          const savedStart = accountData?.workspace?.protocol_start_date || new Date().toISOString().slice(0, 10);
          setStartDate(savedStart);
          setReview(accountData?.workspace?.completion_review || { actualValue: "", targetStatus: "", strongestResult: "", unresolved: "", nextCommitment: "" });
          const savedCheckpoint = accountData?.workspace?.course_correction || {};
          setCheckpoint((current) => ({ ...current, ...savedCheckpoint }));
          setEvidence(accountData?.workspace?.protocol_evidence || {});
          const built = buildProtocol(saved.memo, combinedProfile, savedCheckpoint);
          setDays(built);
          const rawChecked = localStorage.getItem("tunnl-protocol-checked");
          setChecked(accountData?.workspace?.protocol_checked || (rawChecked ? JSON.parse(rawChecked) : {}));
          const rawNotes = localStorage.getItem("tunnl-protocol-notes");
          setNotes(accountData?.workspace?.protocol_notes || (rawNotes ? JSON.parse(rawNotes) : {}));
        }
      } catch (e) {}
      setStatus("ready");
    })();
  }, [params]);

  const toggle = async (day) => {
    if (day === 14) return;
    const planDay = days.find((item) => item.day === day);
    if (planDay?.type === "action" && (!evidence[day]?.output?.trim() || !evidence[day]?.signal)) {
      setOpenDay(day);
      setCompletionMessage({ [day]: "Add what you produced and choose an outcome signal first." });
      return;
    }
    if (planDay?.type === "checkpoint" && (
      !checkpoint.clearestSignal.trim() || !checkpoint.friction || !checkpoint.direction ||
      (checkpoint.direction === "change" && (!checkpoint.revisedConstraint.trim() || !checkpoint.revisedModule))
    )) {
      setOpenDay(day);
      setCompletionMessage({ [day]: "Complete and save the midpoint review first." });
      return;
    }
    const next = { ...checked, [day]: !checked[day] };
    if (!(await saveWorkspace({ protocol_checked: next }))) {
      setCompletionMessage({ [day]: "This change could not be saved. Check the connection and try again." });
      return;
    }
    setChecked(next);
    try {
      localStorage.setItem("tunnl-protocol-checked", JSON.stringify(next));
    } catch (e) {}
    setCompletionMessage({});
    if (next[day]) track("plan_day_completed", { day });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (scheduledDay < 14 || !checked[13]) return;
    const nextChecked = { ...checked, 14: true };
    const ok = await saveWorkspace({ completion_review: review, protocol_checked: nextChecked });
    if (!ok) return;
    setChecked(nextChecked);
    track("sprint_completed", { daysCompleted: 14 });
  };

  const updateNote = (day, value) => {
    const next = { ...notes, [day]: value };
    setNotes(next);
    try {
      localStorage.setItem("tunnl-protocol-notes", JSON.stringify(next));
    } catch (e) {}
  };

  const persistNotes = async (day) => {
    if (!(await saveWorkspace({ protocol_notes: notes }))) {
      setCompletionMessage({ [day]: "This note could not be saved. Check the connection and try again." });
    }
  };

  const updateEvidence = (day, field, value) => {
    const planDay = days.find((item) => item.day === day);
    setEvidence((current) => ({
      ...current,
      [day]: {
        ...(current[day] || {}),
        [field]: value,
        module: planDay?.module,
        interventionId: planDay?.interventionId,
        methodVersion: planDay?.methodVersion,
      },
    }));
  };

  const persistEvidence = async (next = evidence, day = null) => {
    const ok = await saveWorkspace({ protocol_evidence: next });
    if (!ok && day) setCompletionMessage({ [day]: "This evidence could not be saved. Check the connection and try again." });
    return ok;
  };

  const saveCheckpoint = async (event) => {
    event.preventDefault();
    if (!checkpoint.clearestSignal.trim() || !checkpoint.friction || !checkpoint.direction) return;
    if (checkpoint.direction === "change" && (!checkpoint.revisedConstraint.trim() || !checkpoint.revisedModule)) return;
    if (!(await saveWorkspace({ course_correction: checkpoint }))) return;
    setDays(buildProtocol(result.memo, planProfile, checkpoint));
    track("course_correction_completed", { direction: checkpoint.direction, friction: checkpoint.friction });
  };

  const openToday = (day) => {
    setOpenDay(day);
    window.setTimeout(() => {
      document.getElementById(`protocol-day-${day}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  if (status === "checking") {
    return (
      <main className="shell" style={{ alignItems: "center" }}>
        <div className="eyebrow">Verifying purchase…</div>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Your 14-Day Plan</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            Your 14-Day Plan is included with Starter.
          </p>
          <Link href="/checkout" className="btn">Start my 14-Day Plan — $49</Link>
        </div>
      </main>
    );
  }

  const progress = protocolProgress(checked, days);
  const nextDay = days.find((day) => !checked[day.day]) || days[days.length - 1];
  const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const today = new Date();
  const scheduledDay = Math.max(0, Math.min(14, Math.floor((today - start) / 86400000) + 1));
  const missedDays = nextDay ? Math.max(0, scheduledDay - nextDay.day) : 0;
  const dateForDay = (day) => {
    const date = new Date(start);
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const recoverSchedule = async () => {
    if (!nextDay) return;
    const shifted = new Date();
    shifted.setDate(shifted.getDate() - (nextDay.day - 1));
    const value = shifted.toISOString().slice(0, 10);
    if (await saveWorkspace({ protocol_start_date: value })) setStartDate(value);
  };

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Your 14-Day Plan</div>
          <span className="num">№ 002</span>
        </div>
        <div className="rule" />

        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Commissioned</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            Your 14-Day Plan
          </h1>
          <p className="copy soft">
            One focused move at a time, built from your reading.
          </p>
        </div>

        {nextDay && (
          <section className="today-move">
            <div className="today-meta">
              <span>Next move · Day {nextDay.day}</span>
              <span>{nextDay.minutes} min</span>
            </div>
            <h2>{nextDay.title}</h2>
            <p>{nextDay.detail}</p>
            <button className="btn" onClick={() => openToday(nextDay.day)}>Open today&apos;s move</button>
            {missedDays > 0 && <div className="recovery-note">Life interrupted the schedule. Nothing is lost.<button onClick={recoverSchedule}>Continue from today</button></div>}
          </section>
        )}

        <div className="protocol-progress">
          <div className="protocol-progress-copy">
            <span>Plan progress</span>
            <strong>{progress.done} of {progress.total}</strong>
          </div>
          <div className="protocol-progress-track"><span style={{ width: `${progress.pct}%` }} /></div>
        </div>

        <div className="method-strip" aria-label="The Tunnl Method">
          {TUNNL_METHOD.map((stage, index) => <div key={stage.key}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong></div>)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {days.map((d) => {
            const isChecked = !!checked[d.day];
            const open = openDay === d.day;
            const onSchedule = isPreview || d.day <= scheduledDay;
            const inSequence = d.day === 1 || checked[d.day - 1];
            const canComplete = d.day < 14 && onSchedule && inSequence;
            const canToggle = isChecked || canComplete;
            const kindLabel = { kickoff: "Kickoff", action: "Move", checkpoint: "Course Correction", integration: "Integration", close: "Close" }[d.type];
            return (
              <div id={`protocol-day-${d.day}`} key={d.day} className={`priority${open ? " open" : ""}`}>
                <div className="priority-head" style={{ gap: 14 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <input
                      className="plan-checkbox"
                      type="checkbox"
                      checked={isChecked}
                      disabled={!canToggle}
                      aria-label={`Mark Day ${d.day} complete`}
                      title={d.day === 14 ? "Complete the Day 14 review to finish the sprint." : !onSchedule ? "This day opens on its scheduled date." : !inSequence ? "Complete the previous day first." : ""}
                      onChange={() => toggle(d.day)}
                    />
                    <span className="title" style={{ fontSize: 20 }}>
                      Day {d.day} — {kindLabel}
                    </span>
                    <span className="day-date">{dateForDay(d.day)}</span>
                  </span>
                  <button className="day-open" type="button" onClick={() => setOpenDay(open ? null : d.day)} aria-expanded={open}>{open ? "Close —" : "Open +"}</button>
                </div>
                {completionMessage[d.day] && <p className="completion-message">{completionMessage[d.day]}</p>}
                {open && (
                  <div className="priority-body">
                    <p style={{ fontSize: 14, lineHeight: 1.8, fontFamily: "var(--serif)", color: "var(--ink)", marginBottom: 10 }}>
                      {d.title}
                    </p>
                    <p className="diag" style={{ marginBottom: 0 }}>{d.detail}</p>
                    <div className="day-specs">
                      <div><span>Time</span><strong>{d.minutes} minutes</strong></div>
                      <div><span>Hypothesis</span><p>{d.why}</p></div>
                      <div><span>Done when</span><p>{d.doneWhen}</p></div>
                      <div><span>Notice</span><p>{d.reflection}</p></div>
                    </div>
                    {d.type === "action" && <div className="intervention-signals"><div><span>Starting evidence</span><p>{d.baselinePrompt}</p></div><div><span>Pass signal</span><p>{d.passSignal}</p></div><div><span>If it fails</span><p>{d.failSignal}</p></div></div>}
                    {d.type === "action" && d.toolKey && <div className="day-tool-link"><span>Today&apos;s move uses {vaultFor(d.toolKey)?.title || "a Decision Tool"}.</span><Link className="btn ghost" href={isPreview ? `/vault?preview=starter&tool=${d.toolKey}&day=${d.day}` : `/vault?tool=${d.toolKey}&day=${d.day}`}>Open it</Link></div>}
                    {d.type === "action" && (
                      <div className="evidence-capture">
                        <div className="q-module">Evidence of movement</div>
                        <label>
                          What did you produce or learn?
                          <textarea required rows={3} value={evidence[d.day]?.output || ""} onChange={(event) => updateEvidence(d.day, "output", event.target.value)} onBlur={() => persistEvidence(evidence, d.day)} placeholder="A shipped page, customer response, decision, number, or rejected assumption." />
                        </label>
                        <label>
                          What kind of evidence is it?
                          <select value={evidence[d.day]?.type || "artifact"} onChange={(event) => { updateEvidence(d.day, "type", event.target.value); }} onBlur={() => persistEvidence(evidence, d.day)}>
                            <option value="artifact">Something shipped</option><option value="customer">Customer signal</option><option value="decision">Decision made</option><option value="metric">Measured result</option><option value="learning">Assumption tested</option>
                          </select>
                        </label>
                        <fieldset><legend>Did it create movement?</legend><div className="signal-options">{OUTCOME_SIGNALS.map((signal) => <button type="button" className={evidence[d.day]?.signal === signal.value ? "selected" : ""} key={signal.value} onClick={() => { const next = { ...evidence, [d.day]: { ...(evidence[d.day] || {}), signal: signal.value, type: evidence[d.day]?.type || "artifact", module: d.module, interventionId: d.interventionId, methodVersion: d.methodVersion } }; setEvidence(next); persistEvidence(next, d.day); }}>{signal.label}</button>)}</div></fieldset>
                        <p className="evidence-help">Add an output and signal before marking this move complete.</p>
                      </div>
                    )}
                    {d.type === "checkpoint" && (
                      <form className="course-correction" onSubmit={saveCheckpoint}>
                        <div className="q-module">Midpoint review</div>
                        <h3>Shape the second half around what you know now.</h3>
                        <label>What is the clearest signal so far?<textarea required rows={3} value={checkpoint.clearestSignal} onChange={(event) => setCheckpoint({ ...checkpoint, clearestSignal: event.target.value })} placeholder="What did a person, number, or shipped result reveal?" /></label>
                        <label>What created the most friction?<select required value={checkpoint.friction} onChange={(event) => setCheckpoint({ ...checkpoint, friction: event.target.value })}><option value="">Choose one</option><option value="scope">The scope was too large</option><option value="time">I did not protect the time</option><option value="clarity">The target was unclear</option><option value="audience">I need stronger audience evidence</option><option value="execution">Execution was harder than expected</option><option value="none">No major friction</option></select></label>
                        <fieldset><legend>What should happen next?</legend><div className="direction-options"><button type="button" className={checkpoint.direction === "continue" ? "selected" : ""} onClick={() => setCheckpoint({ ...checkpoint, direction: "continue" })}><strong>Continue</strong><span>The signal supports the plan.</span></button><button type="button" className={checkpoint.direction === "narrow" ? "selected" : ""} onClick={() => setCheckpoint({ ...checkpoint, direction: "narrow" })}><strong>Narrow</strong><span>Make the target smaller.</span></button><button type="button" className={checkpoint.direction === "change" ? "selected" : ""} onClick={() => setCheckpoint({ ...checkpoint, direction: "change" })}><strong>Change course</strong><span>The evidence points elsewhere.</span></button></div></fieldset>
                        {checkpoint.direction === "change" && <><label>Which area is now the primary constraint?<select required value={checkpoint.revisedModule} onChange={(event) => setCheckpoint({ ...checkpoint, revisedModule: event.target.value })}><option value="">Choose one</option>{MODULES.map((module) => <option value={module.key} key={module.key}>{module.label}</option>)}</select></label><label>What is the revised constraint?<input required value={checkpoint.revisedConstraint} onChange={(event) => setCheckpoint({ ...checkpoint, revisedConstraint: event.target.value })} placeholder="The more accurate problem to solve next" /></label></>}
                        <button className="btn" type="submit">Update the second half</button>
                      </form>
                    )}
                    {d.type !== "checkpoint" && <label className="day-reflection">
                      <span>What changed?</span>
                      <textarea
                        rows={3}
                        value={notes[d.day] || ""}
                        onChange={(event) => updateNote(d.day, event.target.value)}
                        onBlur={() => persistNotes(d.day)}
                        placeholder="Write down what changed, what felt difficult, or what you learned."
                      />
                    </label>}
                    {d.day === 14 && (
                      <form className="completion-review" onSubmit={submitReview}>
                        <div className="q-module">Complete your sprint</div>
                        <label>Where did {planProfile.targetMetric || "your measure"} finish?<input required value={review.actualValue} onChange={(event) => setReview({ ...review, actualValue: event.target.value })} placeholder={planProfile.targetValue || "The finishing value"} /></label>
                        <label>Did the Sprint Target move?<select required value={review.targetStatus} onChange={(event) => setReview({ ...review, targetStatus: event.target.value })}><option value="">Choose one</option><option value="exceeded">Exceeded the target</option><option value="met">Met the target</option><option value="moved">Moved, but did not reach the target</option><option value="unchanged">Did not move yet</option><option value="unmeasured">Could not be measured</option></select></label>
                        <label>What changed most?<textarea required rows={3} value={review.strongestResult} onChange={(event) => setReview({ ...review, strongestResult: event.target.value })} /></label>
                        <label>What is still unresolved?<textarea required rows={3} value={review.unresolved} onChange={(event) => setReview({ ...review, unresolved: event.target.value })} /></label>
                        <label>What will you commit to next?<textarea required rows={3} value={review.nextCommitment} onChange={(event) => setReview({ ...review, nextCommitment: event.target.value })} /></label>
                        <button className="btn" type="submit">Complete sprint</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/account" className="btn full">Starter home</Link>
          <Link href="/vault" className="btn ghost full">Open Decision Tools</Link>
          <Link href="/ledger" className="btn ghost full">View Sprint Report</Link>
          <Link href="/memo" className="btn ghost full">Back to the memo</Link>
        </div>

        <div style={{ marginTop: 52 }}>
          <div className="rule" />
          <div className="footer">
            <span>TUNNL — The Tunnel OS</span>
            <span>SE HQ</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Protocol() {
  return (
    <Suspense fallback={<main className="shell" />}>
      <ProtocolInner />
    </Suspense>
  );
}
