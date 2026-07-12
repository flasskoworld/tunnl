"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, scoreBand, boardAverage, weakestModules, ARCHETYPES } from "../../lib/engine";
import { buildProtocol } from "../../lib/protocol";
import { asciiBar } from "../../lib/ascii";
import { loadAccountWorkspace } from "../../lib/clientData";

export default function Ledger() {
  const [unlocked, setUnlocked] = useState(null);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [editionNo, setEditionNo] = useState("0001");
  const [workspace, setWorkspace] = useState(null);
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (new URLSearchParams(window.location.search).get("preview") === "starter" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");
    if (previewingStarter) {
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setUnlocked(true);
      const previewWorkspace = JSON.parse(localStorage.getItem("tunnl-dev-workspace") || "{}");
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
      const saved = accountData?.readings?.[0]?.result || (raw ? JSON.parse(raw) : null);
      setWorkspace(accountData?.workspace || null);
      setReadings(accountData?.readings || (saved ? [{ result: saved }] : []));
      setResult(saved);
      if (saved?.memo) setDays(buildProtocol(saved.memo, { ...saved.profile, ...(accountData?.workspace?.setup || {}) }));
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
  const baseline = readings[readings.length - 1]?.result || result;
  const latest = readings[0]?.result || result;
  const review = workspace?.completion_review || {};
  const completedCount = Object.values(workspace?.protocol_checked || {}).filter(Boolean).length;
  const reflectionEntries = Object.entries(workspace?.protocol_notes || {}).filter(([, value]) => String(value).trim());
  const hasFollowUp = readings.length > 1;
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

  return (
    <>
      <div className="no-print" style={{ display: "flex", justifyContent: "center", padding: "20px 20px 0" }}>
        <div style={{ width: "100%", maxWidth: 680, display: "flex", gap: 10, marginBottom: 10 }}>
          <button className="btn" onClick={() => window.print()}>Save as PDF / Print</button>
          <Link href="/protocol" className="btn ghost">Back to Plan</Link>
        </div>
      </div>

      <main className="ledger-page">
        <div className="ledger-header">
          <span>TUNNL — SPRINT REPORT</span>
          <span>№ {editionNo} · {date}</span>
        </div>
        <div className="ledger-rule" />

        <h1 className="ledger-h1">Your Sprint Report</h1>
        <p className="ledger-sub">{arch.line}</p>

        <div className="ledger-label">Before → After</div>
        <div className="sprint-summary">
          <div><span>Starting average</span><strong>{boardAverage(baseline.scores)}</strong></div>
          <div><span>Follow-up average</span><strong>{hasFollowUp ? boardAverage(latest.scores) : "—"}</strong></div>
          <div><span>Moves completed</span><strong>{completedCount}/14</strong></div>
        </div>
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
              {p.actions.map((a, j) => (
                <li key={j}>{a}</li>
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

        <div className="ledger-footer">
          <span>TUNNL — The Tunnel OS</span>
          <span>SE HQ · Ink on paper</span>
        </div>
      </main>
    </>
  );
}
