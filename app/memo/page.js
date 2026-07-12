"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, ARCHETYPES, weakestModules } from "../../lib/engine";
import { asciiBar } from "../../lib/ascii";

export default function Memo() {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(0);
  const [missing, setMissing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tunnl-result");
      if (raw) setResult(JSON.parse(raw));
      else setMissing(true);
    } catch (e) {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Operating Memo</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            No memo on file yet. Run the diagnostic first.
          </p>
          <Link href="/diagnostic" className="btn">
            Enter the tunnel
          </Link>
        </div>
      </main>
    );
  }

  if (!result) return <main className="shell" />;

  const { scores, archetype, memo, profile, aiEnhanced, date } = result;
  const weak = weakestModules(scores, 3);
  const arch = ARCHETYPES[archetype];
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

  const personalize = async () => {
    setEnhancing(true);
    setEnhanceError("");
    try {
      const res = await fetch("/api/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const personalizedMemo = await res.json();
      if (!res.ok || personalizedMemo.error) throw new Error("engine unavailable");

      const nextResult = { ...result, memo: personalizedMemo, aiEnhanced: true };
      localStorage.setItem("tunnl-result", JSON.stringify(nextResult));
      setResult(nextResult);
    } catch (e) {
      setEnhanceError("The live engine is unavailable. Your original reading is unchanged.");
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Operating Memo</div>
          <span className="num">{date}</span>
        </div>
        <div className="rule" />

        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Position classified</div>
          <h1
            className="serif"
            style={{ fontSize: "clamp(44px, 11vw, 72px)", lineHeight: 1, marginBottom: 14 }}
          >
            {arch.name}
          </h1>
          <p className="copy soft">{arch.line}</p>
        </div>

        <div className="verdict-box">
          <div className="q-module" style={{ color: "var(--ink)" }}>
            The verdict
          </div>
          <p>“{memo.verdict}”</p>
        </div>

        <div className="engine-option">
          <div>
            <div className="q-module">
              {aiEnhanced ? "AI-personalized reading" : "Optional live reading"}
            </div>
            <p className="soft">
              {aiEnhanced
                ? "This edition was rewritten around your answers and destination."
                : "Your reading is complete. You can optionally send your answers to Anthropic for a more tailored interpretation."}
            </p>
          </div>
          {!aiEnhanced && (
            <button className="btn ghost" onClick={personalize} disabled={enhancing}>
              {enhancing ? "Reading the board..." : "Personalize with AI"}
            </button>
          )}
          {enhanceError && <p className="engine-error">{enhanceError}</p>}
        </div>

        <div className="eyebrow">Module scorecard</div>
        <div className="scorecard">
          {MODULES.map((m) => {
            const isWeak = weak.includes(m.key);
            return (
              <div key={m.key} className="score-row">
                <span className="label" style={{ fontWeight: isWeak ? 500 : 400 }}>
                  {m.label}
                </span>
                <span className="bar" style={{ opacity: isWeak ? 1 : 0.75 }}>
                  {asciiBar(scores[m.key])}
                </span>
                <span className="val">{scores[m.key]}</span>
                {isWeak && <span className="gap-chip">Gap</span>}
              </div>
            );
          })}
        </div>

        <div className="eyebrow">Field notes</div>
        <div style={{ marginBottom: 40 }}>
          <div className="rule" />
          {memo.memo.map((line, i) => (
            <div key={i}>
              <div className="note">
                <span className="numeral">{["i", "ii", "iii", "iv", "v"][i] || i + 1}</span>
                <p>{line}</p>
              </div>
              <div className="rule" />
            </div>
          ))}
        </div>

        <div className="eyebrow">Where to point the tunnel</div>
        <div style={{ marginBottom: 40 }}>
          {memo.priorities.map((p, i) => {
            const locked = i > 0; // Free tier: first deep dive open
            const open = expanded === i && !locked;
            return (
              <div key={i} className={`priority${open ? " open" : ""}`}>
                <button
                  className="priority-head"
                  onClick={() => !locked && setExpanded(open ? -1 : i)}
                  style={{ cursor: locked ? "default" : "pointer" }}
                >
                  <span className="title">
                    {i + 1}. {moduleLabel(p.module)}
                  </span>
                  <span className="state" style={{ color: locked ? "var(--ink-soft)" : "var(--ink)" }}>
                    {locked ? "▚ Starter" : open ? "Close —" : "Open +"}
                  </span>
                </button>
                {open && (
                  <div className="priority-body">
                    <p className="diag">{p.diagnosis}</p>
                    {p.actions.map((a, j) => (
                      <div key={j} className="action">
                        <span className="arrow">→</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
                {locked && (
                  <div className="locked-note">
                    Full diagnosis + 14-day plan unlocks at Starter.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="eyebrow">Hidden risks</div>
        <div style={{ marginBottom: 46 }}>
          {memo.risks.map((r, i) => (
            <div key={i} className="risk">
              <span style={{ fontSize: 12, flexShrink: 0 }}>▲</span>
              <p>{r}</p>
            </div>
          ))}
        </div>

        <div className="eyebrow">The ladder</div>
        <div className="ladder">
          {[
            { name: "Free", desc: "Scorecard + one deep dive", lead: true },
            { name: "Starter", desc: "Full plan + templates" },
            { name: "Builder", desc: "AI coaching + dashboards" },
            { name: "Operator", desc: "Team analytics + playbooks" },
          ].map((t) => (
            <div key={t.name} className={`tier${t.lead ? " lead" : ""}`}>
              <div className="name">{t.name}</div>
              <div className="desc">{t.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/diagnostic" className="btn ghost full">
            Re-run the diagnostic
          </Link>
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
