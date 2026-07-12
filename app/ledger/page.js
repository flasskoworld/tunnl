"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, scoreBand, boardAverage, weakestModules, ARCHETYPES } from "../../lib/engine";
import { buildProtocol } from "../../lib/protocol";
import { asciiBar } from "../../lib/ascii";

export default function Ledger() {
  const [unlocked, setUnlocked] = useState(null);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [editionNo, setEditionNo] = useState("0001");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const ok = !!data.unlocked;
        setUnlocked(ok);
        try { localStorage.setItem("tunnl-starter-unlocked", ok ? "true" : "false"); } catch (e) {}
        if (ok) loadLedgerData();
      })
      .catch(() => {
        let ok = false;
        try { ok = localStorage.getItem("tunnl-starter-unlocked") === "true"; } catch (e) {}
        setUnlocked(ok);
        if (ok) loadLedgerData();
      });
  }, []);

  function loadLedgerData() {
    try {
      const raw = localStorage.getItem("tunnl-result");
      const saved = raw ? JSON.parse(raw) : null;
      setResult(saved);
      if (saved?.memo) setDays(buildProtocol(saved.memo, {}));
      const seq = localStorage.getItem("tunnl-edition-seq") || "1";
      setEditionNo(String(seq).padStart(4, "0"));
    } catch (e) {}
  }

  if (unlocked === null) return <main className="shell" />;

  if (!unlocked) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · The Ledger</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            The Ledger export is Starter content — your memo and protocol as
            a numbered, print-ready document.
          </p>
          <Link href="/checkout" className="btn">Commission the Protocol — $49</Link>
        </div>
      </main>
    );
  }

  if (!result) return <main className="shell" />;

  const { scores, archetype, memo, date } = result;
  const weak = weakestModules(scores, 3);
  const arch = ARCHETYPES[archetype];
  const avg = boardAverage(scores);
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

  return (
    <>
      <div className="no-print" style={{ display: "flex", justifyContent: "center", padding: "20px 20px 0" }}>
        <div style={{ width: "100%", maxWidth: 680, display: "flex", gap: 10, marginBottom: 10 }}>
          <button className="btn" onClick={() => window.print()}>Save as PDF / Print</button>
          <Link href="/protocol" className="btn ghost">Back to Protocol</Link>
        </div>
      </div>

      <main className="ledger-page">
        <div className="ledger-header">
          <span>TUNNL — THE LEDGER</span>
          <span>№ {editionNo} · {date}</span>
        </div>
        <div className="ledger-rule" />

        <h1 className="ledger-h1">{arch.name}</h1>
        <p className="ledger-sub">{arch.line}</p>

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
                  <td className="band">{b !== "Holding" ? b : ""}</td>
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

        <div className="ledger-label">The 14-Day Protocol</div>
        <table className="ledger-table">
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td className="num" style={{ width: 40 }}>{String(d.day).padStart(2, "0")}</td>
                <td style={{ width: 90, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em" }}>
                  {d.type}
                </td>
                <td>{d.title}</td>
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
