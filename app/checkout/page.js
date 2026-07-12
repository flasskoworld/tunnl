"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, weakestModules } from "../../lib/engine";

export default function Checkout() {
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tunnl-result");
      if (raw) setResult(JSON.parse(raw));
    } catch (e) {}
    setLoaded(true);
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
        body: JSON.stringify({ email, result }),
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

  if (!loaded) return <main className="shell" />;

  if (result === null) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Starter</div>
          <div className="rule" />
          <div style={{ padding: "26px 0" }}>
            <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>Start with your reading.</h1>
            <p className="copy soft">Starter is built from your diagnostic. Complete it first so your plan begins with your actual priorities.</p>
          </div>
          <Link href="/diagnostic" className="btn">Take the diagnostic</Link>
        </div>
      </main>
    );
  }

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
            Starter
          </h1>
          <p className="copy soft" style={{ marginBottom: 0 }}>
            A focused 14-day operating sprint built from your own reading.
          </p>
        </div>

        {canceled && (
          <div className="risk" style={{ marginTop: 24 }}>
            <p>Checkout was canceled. Nothing was charged.</p>
          </div>
        )}

        {/* Keep the purchase concrete and easy to review before checkout. */}
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
            <p><strong>Your 14-Day Plan</strong> — one focused move per day, with time estimates, clear completion standards, and recovery when life interrupts.</p>
          </div>
          <div className="rule" />
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">iii</span>
            <p><strong>Decision Tools</strong> — focused worksheets for positioning, money, ownership, attention, systems, and the choices behind your plan.</p>
          </div>
          <div className="rule" />
          <div className="note" style={{ padding: "14px 2px" }}>
            <span className="numeral">iv</span>
            <p><strong>Your Sprint Report</strong> — a dated before-and-after record of your starting point, completed work, reflections, and next commitment.</p>
          </div>
        </div>

        <div className="verdict-box" style={{ marginBottom: 30 }}>
          <div className="q-module" style={{ color: "var(--ink)" }}>Price</div>
          <p style={{ fontStyle: "normal" }}>$49 — one time. No subscription.</p>
        </div>

        <div className="eyebrow">Your account</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, lineHeight: 1.7 }}>
          This creates your TUNNL account — no password. Your reading and Starter work
          are saved to this email and restored when you sign in.
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

        {error && (
          <div className="risk" style={{ marginBottom: 20 }}>
            <p>{error}</p>
          </div>
        )}

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn full"
            disabled={loading}
            onClick={buy}
            style={{ opacity: loading ? 0.4 : 1, cursor: loading ? "default" : "pointer" }}
          >
            {loading ? "Opening checkout…" : "Start my 14-Day Plan — $49"}
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
