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
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tunnl-result");
      if (raw) setResult(JSON.parse(raw));
      else setMissing(true);
    } catch (e) {
      setMissing(true);
    }
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => {
        setUnlocked(Boolean(data.unlocked));
        localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false");
      })
      .catch(() => {
        setUnlocked(localStorage.getItem("tunnl-starter-unlocked") === "true");
      });
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
  const strengths = [...MODULES]
    .sort((a, b) => scores[b.key] - scores[a.key])
    .slice(0, 2);
  const average = boardAverage(scores);
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
              {aiEnhanced ? "Live reading complete" : "The deeper reading · Starter"}
            </div>
            <p className="soft">
              {aiEnhanced
                ? "The board ran a second pass across your answers, tested your stated blocker against the scores, and sharpened the reading around your destination."
                : "The scorecard shows where you stand. Starter runs a live second pass across every answer to expose contradictions, sharpen the verdict, and point the next moves at your twelve-month destination."}
            </p>
          </div>
          {!aiEnhanced && (
            <div className="engine-action">
              {unlocked ? (
                <button className="btn ghost" onClick={personalize} disabled={enhancing}>
                  {enhancing ? "Running the second pass..." : "Run the deeper analysis"}
                </button>
              ) : (
                <Link href="/checkout" className="btn ghost">Unlock the deeper analysis</Link>
              )}
            </div>
          )}
          {enhanceError && <p className="engine-error">{enhanceError}</p>}
        </div>

        <div className="eyebrow">Module scorecard</div>
        <div className="scorecard">
          {MODULES.map((m) => {
            const score = scores[m.key];
            const band = scoreBand(score);
            const flagged = band !== "Holding";
            return (
              <div key={m.key} className="score-row">
                <span className="label" style={{ fontWeight: flagged ? 500 : 400 }}>
                  {m.label}
                </span>
                <span className="bar" style={{ opacity: flagged ? 1 : 0.75 }}>
                  {asciiBar(score)}
                </span>
                <span className="val">{score}</span>
                <span className={`band-chip ${band.toLowerCase()}`}>{band}</span>
              </div>
            );
          })}
          <div className="board-average">
            <span>Board average</span>
            <strong>{average}</strong>
          </div>
          <p className="score-note">
            Calibrated against operators at scale, not against your peers. The board never shows a perfect position.
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
                    {p.actions.map((a, j) => (
                      <div key={j} className="action">
                        <span className="arrow">→</span>
                        <span>{a}</span>
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
            <h2>Knowing the gap is free. Closing it is the Protocol.</h2>
            <p className="starter-lede">
              Turn this reading into a focused 14-day sequence built around your three lowest-leverage points and your stated destination.
            </p>
            <div className="starter-outcomes">
              <div><span>01</span><strong>Deeper reading</strong><p>A live second pass across every answer, contradiction, and priority.</p></div>
              <div><span>02</span><strong>14-Day Protocol</strong><p>One sequenced move per day, with the full three-priority diagnosis.</p></div>
              <div><span>03</span><strong>Tools that stay yours</strong><p>Nine Vault worksheets and a print-ready Ledger for the work ahead.</p></div>
            </div>
            <Link href="/checkout" className="btn starter-cta">Build my Protocol · $49 one time</Link>
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
            { name: "Starter", desc: "$49 once · The Protocol, Vault, and Ledger", lead: true },
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
            <Link href="/protocol" className="btn full">Open the 14-Day Protocol</Link>
            <Link href="/vault" className="btn ghost full">Open the Vault</Link>
            <Link href="/ledger" className="btn ghost full">View the Ledger</Link>
          </div>
        ) : (
          <div className="memo-actions">
            <Link href="/checkout" className="btn full">Commission the Protocol — $49</Link>
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
