"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MODULES,
  ARCHETYPES,
  boardAverage,
  scoreBand,
  weakestModules,
} from "../../lib/engine";
import { asciiBar } from "../../lib/ascii";
import { buildProtocol } from "../../lib/protocol";
import { interventionFor } from "../../lib/interventions";

const STRENGTH_COPY = {
  leverage: "You already look for force multipliers instead of treating effort as the only input.",
  systems: "You have repeatable structure to build on. The next gain comes from tightening it, not starting over.",
  strategy: "You can see the board beyond the next task. That perspective is an asset when it becomes a choice.",
  building: "You have evidence of motion. Shipping is already part of how you operate.",
  ownership: "You are thinking beyond access toward assets, control, and durable upside.",
  network: "You understand that distribution and relationships can compound the work.",
  economy: "You have a usable relationship with money, runway, and the economics of your decisions.",
  focus: "You can hold a direction long enough for the work to accumulate.",
  forces: "You notice incentives and hidden constraints that other builders often miss.",
};

export default function Memo() {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(0);
  const [missing, setMissing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tunnl-result");
      if (raw) setResult(JSON.parse(raw));
      else setMissing(true);
    } catch (e) {
      setMissing(true);
    }
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      localStorage.getItem("tunnl-dev-starter-preview") === "true";
    if (previewingStarter) {
      setUnlocked(true);
      return;
    }
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => {
        setUnlocked(Boolean(data.unlocked));
        localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false");
      })
      .catch(() => setUnlocked(false));
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

  const { scores, archetype, memo, date } = result;
  const weak = weakestModules(scores, 3);
  const strengths = [...MODULES]
    .sort((a, b) => scores[b.key] - scores[a.key])
    .slice(0, 2);
  const average = boardAverage(scores);
  const arch = ARCHETYPES[archetype];
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;
  const starterPreview = buildProtocol(memo, result.profile).slice(0, 3);

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

        <div className="eyebrow">Module scorecard</div>
        <div className="scorecard">
          {MODULES.map((m) => {
            const score = scores[m.key];
            const band = scoreBand(score);
            const flagged = band !== "Strong";
            return (
              <div key={m.key} className="score-row">
                <span className="label" style={{ fontWeight: flagged ? 500 : 400 }}>
                  {m.label}
                </span>
                <span className="bar" style={{ opacity: flagged ? 1 : 0.75 }}>
                  {asciiBar(score)}
                </span>
                <span className="val">{score}</span>
                <span className={`band-chip ${band.toLowerCase().replaceAll(" ", "-")}`}>{band}</span>
              </div>
            );
          })}
          <div className="board-average">
            <span>Board average</span>
            <strong>{average}</strong>
          </div>
          <p className="score-note">
            A directional snapshot from your answers. Look for the pattern: where momentum is working and where focused attention can create the biggest change.
          </p>
        </div>

        <div className="eyebrow">What is already working</div>
        <div className="strength-grid">
          {strengths.map((strength, index) => (
            <div className="strength-signal" key={strength.key}>
              <div className="strength-topline">
                <span>Signal {String(index + 1).padStart(2, "0")}</span>
                <strong>{scores[strength.key]}</strong>
              </div>
              <h2>{strength.label}</h2>
              <p>{STRENGTH_COPY[strength.key]}</p>
            </div>
          ))}
        </div>
        <p className="strength-note">
          These are relative strengths from your answers, not compliments added after the fact. Build the next move on them.
        </p>

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
            const locked = i > 0 && !unlocked;
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
                    {(p.intervention || interventionFor(result.profile?.business_model || "creator", p.module)).moves.map((move, j) => (
                      <div key={j} className="action">
                        <span className="arrow">→</span>
                        <span>{move.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
                {locked && (
                  <Link href="/checkout" className="locked-note locked-link">
                    Full diagnosis + 14-day plan unlocks at Starter — $49 →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {!unlocked && (
          <section className="starter-offer">
            <div className="starter-kicker">Starter · One-time · $49</div>
            <h2>Your reading found the constraint. Starter helps you move it.</h2>
            <p className="starter-lede">
              Turn this reading into a focused 14-day sequence built around your three priority constraints and your stated destination.
            </p>
            <div className="starter-preview">
              <div className="starter-preview-label">Your first three days</div>
              {starterPreview.map((day) => <div className="starter-preview-day" key={day.day}><span>{String(day.day).padStart(2, "0")}</span><div><strong>{day.title}</strong><p>{day.detail}</p><em>{day.minutes} minutes</em></div></div>)}
            </div>
            <div className="starter-outcomes">
              <div><span>01</span><strong>Your 14-Day Plan</strong><p>One focused move per day, shaped around your three priority constraints.</p></div>
              <div><span>02</span><strong>Decision Tools</strong><p>Focused worksheets for the choices behind the work.</p></div>
              <div><span>03</span><strong>Sprint Report</strong><p>A clear before-and-after record of what you changed.</p></div>
            </div>
            <Link href="/checkout" className="btn starter-cta">Create my 14-Day Plan · $49</Link>
            <div className="starter-assurance">No subscription. Your reading stays available after purchase.</div>
          </section>
        )}

        <div className="eyebrow">Hidden risks</div>
        <div style={{ marginBottom: 46 }}>
          {memo.risks.map((r, i) => (
            <div key={i} className="risk">
              <span style={{ fontSize: 12, flexShrink: 0 }}>▲</span>
              <p>{r}</p>
            </div>
          ))}
        </div>

        <div className="eyebrow">Where TUNNL is going</div>
        <div className="ladder">
          {[
            { name: "Starter", desc: "$49 once · 14-Day Plan, Decision Tools, and Sprint Report", lead: true },
            { name: "Builder", desc: "Coming soon · ongoing guidance and progress intelligence", soon: true },
            { name: "Sovereign", desc: "Coming later · the board for teams and communities", soon: true },
          ].map((t) => (
            <div key={t.name} className={`tier${t.lead ? " lead" : ""}`}>
              {t.soon && <div className="tier-status">Coming soon</div>}
              <div className="name">{t.name}</div>
              <div className="desc">{t.desc}</div>
            </div>
          ))}
        </div>

        {unlocked ? (
          <div className="memo-actions">
            <Link href="/protocol" className="btn full">Open the 14-Day Plan</Link>
            <Link href="/vault" className="btn ghost full">Open Decision Tools</Link>
            <Link href="/ledger" className="btn ghost full">View Sprint Report</Link>
          </div>
        ) : (
          <div className="memo-actions">
            <Link href="/checkout" className="btn full">Start my 14-Day Plan — $49</Link>
            <Link href="/signin" className="signin-link">
              Already commissioned on another device? Sign in
            </Link>
          </div>
        )}

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
