"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, scoreBand, boardAverage, weakestModules, ARCHETYPES } from "../../lib/engine";
import { buildProtocol } from "../../lib/protocol";
import { asciiBar } from "../../lib/ascii";
import { loadAccountWorkspace, previewWorkspaceForReading, readingForWorkspace } from "../../lib/clientData";
import { OUTCOME_SIGNALS, TUNNL_METHOD } from "../../lib/methodology";
import { interventionFor } from "../../lib/interventions";
import StarterNav from "../components/StarterNav";

export default function Ledger() {
  const [unlocked, setUnlocked] = useState(null);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [editionNo, setEditionNo] = useState("0001");
  const [workspace, setWorkspace] = useState(null);
  const [readings, setReadings] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (new URLSearchParams(window.location.search).get("preview") === "starter" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");
    if (previewingStarter) {
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setIsPreview(true);
      setUnlocked(true);
      const raw = localStorage.getItem("tunnl-result");
      const localResult = raw ? JSON.parse(raw) : null;
      const storedPreview = JSON.parse(localStorage.getItem("tunnl-dev-workspace") || "{}");
      const previewWorkspace = previewWorkspaceForReading(storedPreview, localResult);
      if (previewWorkspace !== storedPreview) localStorage.setItem("tunnl-dev-workspace", JSON.stringify(previewWorkspace));
      loadLedgerData({ workspace: previewWorkspace, readings: [] });
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const ok = !!data.unlocked;
        setUnlocked(ok);
        try { localStorage.setItem("tunnl-starter-unlocked", ok ? "true" : "false"); } catch (e) {}
        if (ok) {
          loadAccountWorkspace().then((accountData) => loadLedgerData(accountData));
        }
      })
      .catch(() => setUnlocked(false));
  }, []);

  function loadLedgerData(accountData = null) {
    try {
      const raw = localStorage.getItem("tunnl-result");
      const localResult = raw ? JSON.parse(raw) : null;
      const saved = readingForWorkspace(accountData, localResult);
      setWorkspace(accountData?.workspace ? { ...accountData.workspace, benchmarks: accountData.benchmarks || [] } : null);
      setReadings(accountData?.readings || (saved ? [{ result: saved }] : []));
      setResult(saved);
      if (saved?.memo) setDays(buildProtocol(saved.memo, { ...saved.profile, ...(accountData?.workspace?.setup || {}) }, accountData?.workspace?.course_correction || {}));
      const seq = localStorage.getItem("tunnl-edition-seq") || "1";
      setEditionNo(String(accountData?.readings?.length || seq).padStart(4, "0"));
    } catch (e) {}
  }

  if (unlocked === null) return <main className="shell" />;

  if (!unlocked) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Sprint Report</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            Your Sprint Report is included with Starter.
          </p>
          <Link href="/checkout" className="btn">Start my 14-Day Plan — $49</Link>
        </div>
      </main>
    );
  }

  if (!result) return <main className="shell" />;

  const { scores, archetype, memo, date } = result;
  const weak = weakestModules(scores, 3);
  const arch = ARCHETYPES[archetype];
  const avg = boardAverage(scores);
  const sprintReadingId = workspace?.setup?.readingId;
  const baselineIndex = readings.findIndex((reading) => reading.result?.id === sprintReadingId || reading.source_id === sprintReadingId);
  const baseline = baselineIndex >= 0 ? readings[baselineIndex].result : result;
  const latest = baselineIndex > 0 ? readings[0].result : result;
  const review = workspace?.completion_review || {};
  const checkedDays = workspace?.protocol_checked || {};
  const completedCount = Object.entries(checkedDays).filter(([day, done]) => Number(day) >= 1 && Number(day) <= 14 && done).length;
  const reflectionEntries = Object.entries(workspace?.protocol_notes || {}).filter(([, value]) => String(value).trim());
  const evidenceEntries = Object.entries(workspace?.protocol_evidence || {}).filter(([, value]) => value?.output);
  const movementCount = evidenceEntries.filter(([, value]) => ["strong", "some"].includes(value.signal)).length;
  const checkpoint = workspace?.course_correction || {};
  const benchmarks = workspace?.benchmarks || [];
  const hasFollowUp = baselineIndex > 0;
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;
  const primary = memo.priorities[0];
  const primaryTrack = primary.intervention || interventionFor(result.profile?.business_model || "creator", primary.module);
  const sprintComplete = !!checkedDays[14] && !!review.actualValue && !!review.targetStatus;
  const targetStatus = {
    exceeded: "Exceeded the target",
    met: "Met the target",
    moved: "Moved, but did not reach the target",
    unchanged: "Did not move yet",
    unmeasured: "Could not be measured",
  }[review.targetStatus] || "In progress";
  const triedModules = [...new Set(evidenceEntries.map(([, entry]) => entry.module).filter(Boolean))];
  const nextPlanDay = days.find((day) => !checkedDays[day.day]);
  const nextMoveTitle = sprintComplete
    ? review.nextCommitment || primary.nextMove || primaryTrack.nextMove
    : nextPlanDay?.title || "Complete the sprint review";
  const nextMoveDetail = sprintComplete
    ? review.unresolved ? `Still unresolved: ${review.unresolved}` : "The final review turns the evidence into the next commitment."
    : nextPlanDay?.detail || "Finish the review to choose the next move.";
  const recordTitle = sprintComplete ? "Your Sprint Report" : "Your Live Sprint Record";

  return (
    <>
      <div className="no-print" style={{ display: "flex", justifyContent: "center", padding: "20px 20px 0" }}>
        <div style={{ width: "100%", maxWidth: 680, display: "flex", gap: 10, marginBottom: 10 }}>
          {sprintComplete ? <button className="btn" onClick={() => window.print()}>Save final report</button> : <Link href={isPreview ? "/protocol?preview=starter" : "/protocol"} className="btn">Continue today&apos;s move</Link>}
          <Link href={isPreview ? "/account?preview=starter" : "/account"} className="btn ghost">Starter home</Link>
        </div>
      </div>

      <main className="ledger-page">
        <div className="ledger-header">
          <span>TUNNL — {sprintComplete ? "SPRINT REPORT" : "LIVE SPRINT RECORD"}</span>
          <span>№ {editionNo} · {date}</span>
        </div>
        <div className="ledger-rule" />
        <StarterNav current="record" preview={isPreview} />

        <h1 className="ledger-h1">{recordTitle}</h1>
        <p className="ledger-sub">{sprintComplete ? arch.line : `${completedCount} of 14 days complete. This record updates as evidence appears.`}</p>

        <div className="ledger-label">The result, in five questions</div>
        <section className="report-answers">
          <div><span>01 · What was the constraint?</span><strong>{moduleLabel(primary.module)}</strong><p>{primary.diagnosis}</p></div>
          <div><span>02 · What did you try?</span><strong>{evidenceEntries.length ? `${evidenceEntries.length} evidence-producing moves` : "Nothing recorded yet"}</strong><p>{triedModules.length ? triedModules.map(moduleLabel).join(", ") : `Planned: ${memo.priorities.map((priority) => moduleLabel(priority.module)).join(", ")}`}</p></div>
          <div><span>03 · What evidence appeared?</span><strong>{evidenceEntries.length ? `${movementCount} of ${evidenceEntries.length} recorded moves created movement` : "No evidence recorded yet"}</strong><p>{review.strongestResult || evidenceEntries[0]?.[1]?.output || "Evidence will appear here as action days are completed."}</p></div>
          <div><span>04 · Did the result improve?</span><strong>{targetStatus}</strong><p>{workspace?.setup?.targetMetric || "Result watched"} · Started at {workspace?.setup?.baselineValue || "not recorded"} · Now {review.actualValue || "in progress"} · Day 14 goal {workspace?.setup?.targetValue || "not recorded"}</p></div>
          <div><span>05 · What should happen next?</span><strong>{nextMoveTitle}</strong><p>{nextMoveDetail}</p></div>
        </section>

        <button className="report-details-toggle no-print" type="button" onClick={() => setShowDetails((current) => !current)}>{showDetails ? "Hide supporting details" : "View supporting details"}<span>{sprintComplete ? "Full diagnosis and plan" : "Reading, method, and plan"}</span></button>
        <div className={`report-appendix${showDetails ? " open" : ""}`}>
        <div className="ledger-label">Before → After</div>
        <div className="sprint-summary">
          <div><span>Starting average</span><strong>{boardAverage(baseline.scores)}</strong></div>
          <div><span>Follow-up average</span><strong>{hasFollowUp ? boardAverage(latest.scores) : "—"}</strong></div>
          <div><span>Evidence that moved</span><strong>{movementCount}/{evidenceEntries.length || "—"}</strong></div>
        </div>
        <div className="ledger-label">The Tunnl Method · Version 1.1</div>
        <div className="method-report">{TUNNL_METHOD.map((stage, index) => <div key={stage.key}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong><p>{stage.description}</p></div>)}</div>
        {checkpoint.clearestSignal && <><div className="ledger-label" style={{ marginTop: 28 }}>Day 7 Course Correction</div><div className="sprint-review"><div><span>Clearest signal</span><p>{checkpoint.clearestSignal}</p></div><div><span>Decision</span><p>{checkpoint.direction === "change" ? "Change course" : checkpoint.direction === "narrow" ? "Narrow the target" : "Continue"}{checkpoint.revisedConstraint ? ` — ${checkpoint.revisedConstraint}` : ""}</p></div></div></>}
        {(review.strongestResult || review.unresolved || review.nextCommitment) && (
          <div className="sprint-review">
            <div><span>What changed</span><p>{review.strongestResult}</p></div>
            <div><span>Still unresolved</span><p>{review.unresolved}</p></div>
            <div><span>Next commitment</span><p>{review.nextCommitment}</p></div>
          </div>
        )}
        {!hasFollowUp && (
          <p className="ledger-sub">Your completion review is the first “after” record. Run the diagnostic again when you want a score-to-score comparison.</p>
        )}

        {hasFollowUp && (
          <table className="ledger-table">
            <tbody>
              {MODULES.map((module) => {
                const before = baseline.scores[module.key];
                const after = latest.scores[module.key];
                const delta = after - before;
                return <tr key={module.key}><td>{module.label}</td><td className="num">{before}</td><td className="num">{after}</td><td className="band">{delta > 0 ? "+" : ""}{delta}</td></tr>;
              })}
            </tbody>
          </table>
        )}

        {reflectionEntries.length > 0 && (
          <>
            <div className="ledger-label" style={{ marginTop: 28 }}>What Changed Along the Way</div>
            <ol className="ledger-notes">
              {reflectionEntries.map(([day, note]) => <li key={day}><strong>Day {day}:</strong> {note}</li>)}
            </ol>
          </>
        )}

        {evidenceEntries.length > 0 && (
          <><div className="ledger-label" style={{ marginTop: 28 }}>Evidence Record</div><ol className="ledger-notes">{evidenceEntries.map(([day, entry]) => <li key={day}><strong>Day {day} · {OUTCOME_SIGNALS.find((signal) => signal.value === entry.signal)?.label || "Recorded"}:</strong> {entry.output}</li>)}</ol></>
        )}

        <div className="ledger-label" style={{ marginTop: 28 }}>Learning Benchmark</div>
        <p className="ledger-sub">{benchmarks.length ? "Benchmarks compare this sprint with anonymized outcomes from at least ten completed uses of the same move." : "Tunnl is building its first validated benchmark set. Rates appear only after at least ten people complete the same move, so early activity is never presented as proof."}</p>

        <div className="ledger-verdict">
          <div className="ledger-label">The Verdict</div>
          <p className="ledger-verdict-text">"{memo.verdict}"</p>
        </div>

        <div className="ledger-label" style={{ marginTop: 28 }}>Module Scorecard</div>
        <table className="ledger-table">
          <tbody>
            {MODULES.map((m) => {
              const s = scores[m.key];
              const b = scoreBand(s);
              return (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  <td className="mono">{asciiBar(s, 18)}</td>
                  <td className="num">{s}</td>
                  <td className="band">{b}</td>
                </tr>
              );
            })}
            <tr className="ledger-avg-row">
              <td colSpan={2}>Board average</td>
              <td className="num" colSpan={2}>{avg}</td>
            </tr>
          </tbody>
        </table>

        <div className="ledger-label" style={{ marginTop: 28 }}>Field Notes</div>
        <ol className="ledger-notes">
          {memo.memo.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>

        <div className="ledger-pagebreak" />

        <div className="ledger-label">Priorities — Full Diagnosis + 14-Day Actions</div>
        {memo.priorities.map((p, i) => (
          <div className="ledger-priority" key={i}>
            <div className="ledger-priority-title">{i + 1}. {moduleLabel(p.module)}</div>
            <p className="ledger-priority-diag">{p.diagnosis}</p>
            <ul className="ledger-actions">
              {(p.intervention || interventionFor(result.profile?.business_model || "creator", p.module)).moves.map((move, j) => (
                <li key={j}>{move.detail}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="ledger-label" style={{ marginTop: 28 }}>Hidden Risks</div>
        <ul className="ledger-actions">
          {memo.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        <div className="ledger-pagebreak" />

        <div className="ledger-label">Your 14-Day Plan</div>
        <table className="ledger-table">
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td className="num" style={{ width: 40 }}>{String(d.day).padStart(2, "0")}</td>
                <td style={{ width: 90, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em" }}>
                  {d.type}
                </td>
                <td className="ledger-day">
                  <strong>{d.title}</strong>
                  <span>{d.minutes} min · {d.detail}</span>
                  <em>Done when: {d.doneWhen}</em>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="ledger-footer">
          <span>TUNNL — The Tunnel OS</span>
          <span>SE HQ · Ink on paper</span>
        </div>
      </main>
    </>
  );
}
