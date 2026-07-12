"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { buildProtocol, protocolProgress } from "../../lib/protocol";
import { loadAccountWorkspace, saveWorkspace, syncReading, track } from "../../lib/clientData";

export default function Account() {
  const [me, setMe] = useState(null);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});
  const [workspace, setWorkspace] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [setup, setSetup] = useState({
    focusProject: "",
    audience: "",
    successMeasure: "",
    weeklyCapacity: "4 hours",
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (previewMode === "starter" || previewMode === "setup" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");

    let localResult = null;
    try {
      const saved = localStorage.getItem("tunnl-result");
      localResult = saved ? JSON.parse(saved) : null;
      const progress = localStorage.getItem("tunnl-protocol-checked");
      setResult(localResult);
      setChecked(progress ? JSON.parse(progress) : {});
    } catch (e) {}

    if (previewingStarter) {
      setIsPreview(true);
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setMe({ signedIn: true, unlocked: true, email: "starter.preview@tunnl.local" });
      const savedPreview = localStorage.getItem("tunnl-dev-workspace");
      const previewWorkspace = savedPreview ? JSON.parse(savedPreview) : null;
      if (previewMode === "setup") setWorkspace({ protocol_start_date: null, setup: {} });
      else if (previewWorkspace) setWorkspace(previewWorkspace);
    } else {
    fetch("/api/me")
      .then((r) => r.json())
      .then(async (data) => {
        setMe(data);
        try {
          localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false");
        } catch (e) {}
        if (data.signedIn) {
          if (localResult) await syncReading(localResult).catch(() => false);
          loadAccountWorkspace().then((accountData) => {
            if (!accountData) return;
            const restored = accountData.readings?.[0]?.result || localResult;
            setWorkspace(accountData.workspace);
            setSetup((current) => ({
              ...current,
              ...(accountData.workspace?.setup || {}),
              startDate: accountData.workspace?.protocol_start_date || current.startDate,
            }));
            setResult(restored);
            setChecked(accountData.workspace?.protocol_checked || {});
            try {
              if (restored) localStorage.setItem("tunnl-result", JSON.stringify(restored));
              localStorage.setItem("tunnl-protocol-checked", JSON.stringify(accountData.workspace?.protocol_checked || {}));
              localStorage.setItem("tunnl-protocol-notes", JSON.stringify(accountData.workspace?.protocol_notes || {}));
              localStorage.setItem("tunnl-vault-values", JSON.stringify(accountData.workspace?.vault_values || {}));
            } catch (e) {}
          });
        }
      })
      .catch(() => setMe({ signedIn: false, unlocked: false }));
    }
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem("tunnl-starter-unlocked");
      localStorage.removeItem("tunnl-dev-starter-preview");
      localStorage.removeItem("tunnl-dev-workspace");
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
    ? buildProtocol(result.memo, { ...result.profile, ...(workspace?.setup || {}) })
    : [];
  const progress = protocolProgress(checked, days);
  const nextDay = days.find((day) => !checked[day.day]);
  const needsSetup = me.unlocked && workspace && !workspace.protocol_start_date;

  const startPlan = async (event) => {
    event.preventDefault();
    const { startDate, ...details } = setup;
    const previewWorkspace = { setup: details, protocol_start_date: startDate };
    if (isPreview) {
      localStorage.setItem("tunnl-dev-workspace", JSON.stringify(previewWorkspace));
      setWorkspace(previewWorkspace);
      track("plan_started", { startDate, preview: true });
      return;
    }
    const ok = await saveWorkspace(previewWorkspace);
    if (!ok) return;
    setWorkspace((current) => ({ ...current, setup: details, protocol_start_date: startDate }));
    track("plan_started", { startDate });
  };

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
            {needsSetup ? "Set your direction." : me.unlocked ? "Continue the work." : "Your reading is ready."}
          </h1>
          <p className="copy soft">
            {needsSetup ? "A few details will shape the plan around your real work." : me.unlocked ? "Your Starter workspace is ready." : "Your free reading is ready."}
          </p>
        </div>

        {needsSetup ? (
          <form className="plan-setup" onSubmit={startPlan}>
            <div className="q-module">Set up your sprint</div>
            <h2>Make the next 14 days specific.</h2>
            <p>Five details turn your reading into a plan you can actually use.</p>
            <label>What are you moving forward?<input required value={setup.focusProject} onChange={(event) => setSetup({ ...setup, focusProject: event.target.value })} placeholder="Launch my first paid workshop" /></label>
            <label>Who is it for?<input required value={setup.audience} onChange={(event) => setSetup({ ...setup, audience: event.target.value })} placeholder="Independent designers building an audience" /></label>
            <label>What would meaningful progress look like?<input required value={setup.successMeasure} onChange={(event) => setSetup({ ...setup, successMeasure: event.target.value })} placeholder="Ten qualified conversations and one paid customer" /></label>
            <label>Time available each week<select value={setup.weeklyCapacity} onChange={(event) => setSetup({ ...setup, weeklyCapacity: event.target.value })}><option>2 hours</option><option>4 hours</option><option>6 hours</option><option>8+ hours</option></select></label>
            <label>Start date<input required type="date" value={setup.startDate} onChange={(event) => setSetup({ ...setup, startDate: event.target.value })} /></label>
            <button className="btn" type="submit">Create my 14-Day Plan</button>
          </form>
        ) : me.unlocked ? (
          <>
            {nextDay ? (
              <section className="account-resume">
                <div className="today-meta"><span>Up next · Day {nextDay.day}</span><span>{nextDay.minutes} min</span></div>
                <h2>{nextDay.title}</h2>
                <p>{nextDay.detail}</p>
                <Link href="/protocol?preview=starter" className="btn">Continue the Plan</Link>
                <div className="account-progress">{progress.done} of {progress.total} moves complete</div>
              </section>
            ) : result ? (
              <section className="account-resume"><h2>Sprint complete.</h2><p>Your Sprint Report holds the full record of the work.</p><Link href="/ledger?preview=starter" className="btn">Open Sprint Report</Link></section>
            ) : (
              <section className="account-resume"><h2>Bring your reading into Starter.</h2><p>Run the diagnostic to create your 14-Day Plan and recommended Decision Tools.</p><Link href="/diagnostic" className="btn">Run the diagnostic</Link></section>
            )}

            <div className="eyebrow">Starter ecosystem</div>
            <nav className="ecosystem-grid" aria-label="Starter ecosystem">
              <Link href="/protocol?preview=starter"><span>01</span><strong>14-Day Plan</strong><p>Your focused daily path from insight to evidence.</p></Link>
              <Link href="/vault?preview=starter"><span>02</span><strong>Decision Tools</strong><p>Guided worksheets for the choices behind the work.</p></Link>
              <Link href="/memo"><span>03</span><strong>Reading</strong><p>Your diagnosis, strengths, and three priorities.</p></Link>
              <Link href="/ledger?preview=starter"><span>04</span><strong>Sprint Report</strong><p>Your starting point, completed work, and what changed.</p></Link>
            </nav>
          </>
        ) : (
          <div className="memo-actions"><Link href="/checkout" className="btn full">Start my 14-Day Plan — $49</Link><Link href="/memo" className="btn ghost full">Back to the reading</Link></div>
        )}

        <button className="account-signout" onClick={signOut}>Sign out</button>
      </div>
    </main>
  );
}
