"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { buildProtocol, protocolProgress } from "../../lib/protocol";

export default function Account() {
  const [me, setMe] = useState(null);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (new URLSearchParams(window.location.search).get("preview") === "starter" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");

    if (previewingStarter) {
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setMe({ signedIn: true, unlocked: true, email: "starter.preview@tunnl.local" });
    } else {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        try {
          localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false");
        } catch (e) {}
      });
    }
    try {
      const saved = localStorage.getItem("tunnl-result");
      const progress = localStorage.getItem("tunnl-protocol-checked");
      setResult(saved ? JSON.parse(saved) : null);
      setChecked(progress ? JSON.parse(progress) : {});
    } catch (e) {}
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem("tunnl-starter-unlocked");
      localStorage.removeItem("tunnl-dev-starter-preview");
    } catch (e) {}
    window.location.href = "/";
  };

  if (!me) return <main className="shell" />;

  if (!me.signedIn) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Account</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>You're not signed in.</p>
          <Link href="/signin" className="btn">Sign in</Link>
        </div>
      </main>
    );
  }

  const days = result?.memo
    ? buildProtocol(result.memo, { twelve_month_destination: result.profile?.twelve_month_destination })
    : [];
  const progress = protocolProgress(checked, days);
  const nextDay = days.find((day) => !checked[day.day]);

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Starter Home</div>
          <span className="num">{me.email}</span>
        </div>
        <div className="rule" />
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Your operating system</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            {me.unlocked ? "Continue the work." : "Your reading is ready."}
          </h1>
          <p className="copy soft">
            {me.unlocked ? "The Protocol is commissioned. Full access." : "Free tier — the Protocol isn't commissioned yet."}
          </p>
        </div>

        {me.unlocked ? (
          <>
            {nextDay ? (
              <section className="account-resume">
                <div className="today-meta"><span>Up next · Day {nextDay.day}</span><span>{nextDay.minutes} min</span></div>
                <h2>{nextDay.title}</h2>
                <p>{nextDay.detail}</p>
                <Link href="/protocol?preview=starter" className="btn">Continue the Protocol</Link>
                <div className="account-progress">{progress.done} of {progress.total} moves complete</div>
              </section>
            ) : result ? (
              <section className="account-resume"><h2>Protocol complete.</h2><p>Your Ledger now holds the full record of the work.</p><Link href="/ledger?preview=starter" className="btn">Open the Ledger</Link></section>
            ) : (
              <section className="account-resume"><h2>Bring your reading into Starter.</h2><p>Run the diagnostic on this device to generate your Protocol and priority tools.</p><Link href="/diagnostic" className="btn">Run the diagnostic</Link></section>
            )}

            <div className="eyebrow">Starter ecosystem</div>
            <nav className="ecosystem-grid" aria-label="Starter ecosystem">
              <Link href="/protocol?preview=starter"><span>01</span><strong>Protocol</strong><p>Your sequenced 14-day implementation path.</p></Link>
              <Link href="/vault?preview=starter"><span>02</span><strong>Vault</strong><p>Worksheets for the decisions behind the work.</p></Link>
              <Link href="/memo"><span>03</span><strong>Reading</strong><p>Your diagnosis, strengths, and three priorities.</p></Link>
              <Link href="/ledger?preview=starter"><span>04</span><strong>Ledger</strong><p>Your numbered, print-ready record.</p></Link>
            </nav>
          </>
        ) : (
          <div className="memo-actions"><Link href="/checkout" className="btn full">Commission the Protocol — $49</Link><Link href="/memo" className="btn ghost full">Back to the memo</Link></div>
        )}

        <button className="account-signout" onClick={signOut}>Sign out</button>
      </div>
    </main>
  );
}
