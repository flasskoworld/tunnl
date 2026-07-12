"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, weakestModules } from "../../lib/engine";

export default function Checkout() {
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tunnl-result");
      if (raw) setResult(JSON.parse(raw));
    } catch (e) {}
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled")) setCanceled(true);
  }, []);

  const buy = async () => {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email — that's where your account and receipt go.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, readingId: result?.date || "" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Checkout failed to initialize");
      }
    } catch (e) {
      setError(String(e.message || e));
      setLoading(false);
    }
  };

  const weak = result ? weakestModules(result.scores, 3) : [];
  const moduleLabel = (k) => MODULES.find((m) => m.key === k)?.label || k;

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Checkout</div>
          <span className="num">№ 002</span>
        </div>
        <div className="rule" />

        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Commissioning</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            The Protocol
          </h1>
          <p className="copy soft" style={{ marginBottom: 0 }}>
            A one-time commission. Not a subscription, not a paywall unlock —
            a report built from your own reading.
          </p>
        </div>

        {canceled && (
          <div className="risk" style={{ marginTop: 24 }}>
            <p>Checkout was canceled. Nothing was charged.</p>
          </div>
        )}

        {/* Exactly what unlocks — required transparency before a final-sale purchase */}
        <div className="eyebrow" style={{ marginTop: 34 }}>Exactly what unlocks</div>
        <div className="scorecard" style={{ marginBottom: 30 }}>
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">i</span>
            <p>
              <strong>All three priorities</strong>, fully diagnosed with 14-day
              actions each.{" "}
              {weak.length > 0 && (
                <span className="soft">
                  For your reading: {weak.map(moduleLabel).join(" → ")}.
                </span>
              )}
            </p>
          </div>
          <div className="rule" />
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">ii</span>
            <p><strong>The 14-Day Protocol</strong> — your plan re-sequenced into a daily calendar, one move per day, with built-in integration days to check what actually landed.</p>
          </div>
          <div className="rule" />
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">iii</span>
            <p><strong>The Vault</strong> — worksheets for every one of the nine modules: positioning one-liner, enough-number worksheet, kill list, ownership audit, incentive map, and more.</p>
          </div>
          <div className="rule" />
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">iv</span>
            <p><strong>The Ledger</strong> — the complete memo and protocol as a numbered, dated, print-ready document.</p>
          </div>
        </div>

        <div className="verdict-box" style={{ marginBottom: 30 }}>
          <div className="q-module" style={{ color: "var(--ink)" }}>Price</div>
          <p style={{ fontStyle: "normal" }}>$49 — one time. No subscription.</p>
        </div>

        <div className="eyebrow">Your account</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, lineHeight: 1.7 }}>
          This creates your TUNNL account — no password. The Protocol
          follows you across devices from here.
        </p>
        <input
          type="email"
          required
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%", maxWidth: 400, fontFamily: "var(--mono)", fontSize: 14,
            padding: "14px 16px", background: "transparent",
            border: "1px solid var(--ink)", color: "var(--ink-deep)",
            marginBottom: 24,
          }}
        />

        <label
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            fontSize: 12.5,
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            marginBottom: 28,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            style={{ marginTop: 3, accentColor: "var(--ink)" }}
          />
          <span>
            I understand this is a final sale. Digital goods, delivered
            immediately on payment — no refunds. I've reviewed exactly what
            unlocks above.
          </span>
        </label>

        {error && (
          <div className="risk" style={{ marginBottom: 20 }}>
            <p>{error}</p>
          </div>
        )}

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn full"
            disabled={!ack || loading}
            onClick={buy}
            style={{ opacity: !ack || loading ? 0.4 : 1, cursor: !ack || loading ? "default" : "pointer" }}
          >
            {loading ? "Opening checkout…" : "Commission the Protocol — $49"}
          </button>
          <div style={{ fontSize: 10, color: "var(--ink-soft)", textAlign: "center", letterSpacing: "0.08em" }}>
            Card · Apple Pay · Google Pay · PayPal — via Stripe
          </div>
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
