"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { buildProtocol, nextActionableDay, protocolProgress } from "../../lib/protocol";
import { loadAccountWorkspace, previewWorkspaceForReading, readingForWorkspace, saveWorkspace, sprintSetupForReading, syncReading, track } from "../../lib/clientData";
import { TUNNL_METHOD } from "../../lib/methodology";
import StarterNav from "../components/StarterNav";

export default function Account() {
  const [me, setMe] = useState(null);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});
  const [workspace, setWorkspace] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [setup, setSetup] = useState({
    projectBrief: "",
    projectIntent: "",
    focusProject: "",
    audience: "",
    targetMetric: "",
    baselineValue: "",
    targetValue: "",
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
      if (localResult?.profile?.focusProject) {
        setSetup((current) => ({
          ...current,
          projectBrief: localResult.profile.projectBrief || "",
          projectIntent: localResult.profile.projectIntent || "",
          focusProject: localResult.profile.focusProject,
        }));
      }
      setChecked(progress ? JSON.parse(progress) : {});
    } catch (e) {}

    if (previewingStarter) {
      setIsPreview(true);
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setMe({ signedIn: true, unlocked: true, email: "starter.preview@tunnl.local" });
      const savedPreview = localStorage.getItem("tunnl-dev-workspace");
      const previewWorkspace = savedPreview ? JSON.parse(savedPreview) : null;
      if (previewMode === "setup") setWorkspace({ protocol_start_date: null, setup: {} });
      else {
        const currentPreview = previewWorkspaceForReading(previewWorkspace || {}, localResult);
        if (currentPreview !== previewWorkspace) localStorage.setItem("tunnl-dev-workspace", JSON.stringify(currentPreview));
        setWorkspace(currentPreview);
        setSetup((current) => ({
          ...current,
          ...(currentPreview.setup || {}),
          projectBrief: currentPreview.setup?.projectBrief || localResult?.profile?.projectBrief || current.projectBrief,
          projectIntent: currentPreview.setup?.projectIntent || localResult?.profile?.projectIntent || current.projectIntent,
          focusProject: currentPreview.setup?.focusProject || localResult?.profile?.focusProject || current.focusProject,
        }));
      }
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
            const restored = readingForWorkspace(accountData, localResult);
            setWorkspace(accountData.workspace);
            setSetup((current) => ({
              ...current,
              ...(accountData.workspace?.setup || {}),
              projectBrief: accountData.workspace?.setup?.projectBrief || restored?.profile?.projectBrief || current.projectBrief,
              projectIntent: accountData.workspace?.setup?.projectIntent || restored?.profile?.projectIntent || current.projectIntent,
              focusProject: accountData.workspace?.setup?.focusProject || restored?.profile?.focusProject || current.focusProject,
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
  const nextDay = days.length
    ? nextActionableDay(days, checked, workspace?.protocol_evidence || {})
    : null;
  const needsSetup = me.unlocked && result && workspace && !workspace.protocol_start_date;
  const sprintCommission = sprintSetupForReading(result);

  const startPlan = async (event) => {
    event.preventDefault();
    if (!sprintCommission) return;
    const { startDate } = setup;
    const { baselinePrompt, constraint, ...details } = sprintCommission;
    const sprintSetup = {
      ...details,
      baselinePrompt,
      primaryConstraint: constraint,
      baselineValue: "",
      successMeasure: `${details.targetMetric}. Starting point captured on Day 1. Day 14 signal: ${details.targetValue}`,
      sprintId: crypto.randomUUID(),
      readingId: result?.id,
    };
    const previewWorkspace = {
      setup: sprintSetup,
      protocol_start_date: startDate,
      protocol_checked: {},
      protocol_notes: {},
      protocol_evidence: {},
      course_correction: {},
      vault_values: {},
      completion_review: {},
    };
    setChecked({});
    try {
      localStorage.setItem("tunnl-protocol-checked", "{}");
      localStorage.setItem("tunnl-protocol-notes", "{}");
      localStorage.setItem("tunnl-vault-values", "{}");
    } catch (error) {}
    if (isPreview) {
      localStorage.setItem("tunnl-dev-workspace", JSON.stringify(previewWorkspace));
      setWorkspace(previewWorkspace);
      track("plan_started", { startDate, preview: true });
      return;
    }
    const ok = await saveWorkspace(previewWorkspace);
    if (!ok) return;
    setWorkspace(previewWorkspace);
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
        {me.unlocked && <StarterNav current="home" preview={isPreview} />}
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Your workspace</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            {needsSetup ? "Your sprint is ready." : me.unlocked ? "Continue the work." : "Your reading is ready."}
          </h1>
          <p className="copy soft">
            {needsSetup ? "Tunnl built this plan from your answers, current work, and strongest constraint." : me.unlocked ? "Your Starter workspace is ready." : "Your free reading is ready."}
          </p>
        </div>

        {needsSetup && sprintCommission ? (
          <form className="plan-setup" onSubmit={startPlan}>
            <div className="q-module">Your 14-Day Sprint</div>
            <h2>A focused plan, built from your reading.</h2>
            <p>The direction is already set. Day 1 records your honest starting point, then each move builds toward one observable result.</p>
            {sprintCommission.projectBrief && <div className="sprint-source"><strong>{sprintCommission.projectIntent}</strong><span>{sprintCommission.projectBrief}</span></div>}
            <dl className="sprint-commission">
              <div><dt>Constraint to move</dt><dd>{sprintCommission.constraint}</dd></div>
              <div><dt>14-day focus</dt><dd>{sprintCommission.focusProject}</dd></div>
              <div><dt>Evidence to watch</dt><dd>{sprintCommission.targetMetric}</dd></div>
              <div><dt>Day 1 starting point</dt><dd>{sprintCommission.baselinePrompt}</dd></div>
              <div><dt>Day 14 success signal</dt><dd>{sprintCommission.targetValue}</dd></div>
              <div><dt>Time plan</dt><dd>Built for {sprintCommission.weeklyCapacity} each week</dd></div>
            </dl>
            <label className="sprint-start-date">When do you want to begin?<input required type="date" value={setup.startDate} onChange={(event) => setSetup({ ...setup, startDate: event.target.value })} /></label>
            <button className="btn" type="submit">Begin my 14-Day Plan</button>
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

            <div className="eyebrow">Starter workspace</div>
            <nav className="ecosystem-grid" aria-label="Starter workspace">
              <Link href="/protocol?preview=starter"><span>01</span><strong>14-Day Plan</strong><p>Your focused daily path from insight to evidence.</p></Link>
              <Link href="/vault?preview=starter"><span>02</span><strong>Decision Tools</strong><p>Guided worksheets for the choices behind the work.</p></Link>
              <Link href={isPreview ? "/memo?preview=starter" : "/memo"}><span>03</span><strong>Reading</strong><p>Your diagnosis, strengths, and three priorities.</p></Link>
              <Link href="/ledger?preview=starter"><span>04</span><strong>{checked[14] ? "Sprint Report" : "Live Sprint Record"}</strong><p>Your starting point, completed work, and what changed.</p></Link>
            </nav>
            <section className="method-home">
              <div className="q-module">How Tunnl works</div>
              <h2>One method. A clearer record of progress.</h2>
              <div className="method-strip">{TUNNL_METHOD.map((stage, index) => <div key={stage.key}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong></div>)}</div>
              <p>Every sprint follows the same five stages, while the priorities, moves, and midpoint adjustment respond to your work.</p>
            </section>
          </>
        ) : (
          <div className="memo-actions"><Link href="/checkout" className="btn full">Start my 14-Day Plan · $49</Link><Link href="/memo" className="btn ghost full">Back to the reading</Link></div>
        )}

        <button className="account-signout" onClick={signOut}>Sign out</button>
      </div>
    </main>
  );
}
