"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buildProtocol, protocolProgress } from "../../lib/protocol";
import { loadAccountWorkspace, saveWorkspace, track } from "../../lib/clientData";

function ProtocolInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking | denied | ready
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState({});
  const [openDay, setOpenDay] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [review, setReview] = useState({ strongestResult: "", unresolved: "", nextCommitment: "" });

  useEffect(() => {
    (async () => {
      const sessionId = params.get("session_id");

      // Freshly returned from Stripe — confirm this specific session first.
      if (sessionId) {
        try {
          const res = await fetch(`/api/verify-purchase?session_id=${sessionId}`);
          const data = await res.json();
          if (data.paid) {
            try { localStorage.setItem("tunnl-starter-unlocked", "true"); } catch (e) {}
          }
        } catch (e) {}
      }

      // Server session is the source of truth — not just localStorage,
      // so the same account unlocks on any device once signed in.
      const previewingStarter =
        process.env.NODE_ENV === "development" &&
        (params.get("preview") === "starter" ||
          localStorage.getItem("tunnl-dev-starter-preview") === "true");
      if (previewingStarter) localStorage.setItem("tunnl-dev-starter-preview", "true");
      let unlocked = previewingStarter;
      let accountData = null;
      if (previewingStarter) {
        try {
          const previewWorkspace = localStorage.getItem("tunnl-dev-workspace");
          if (previewWorkspace) accountData = { workspace: JSON.parse(previewWorkspace), readings: [] };
        } catch (e) {}
      }
      if (!previewingStarter) {
        try {
          const meRes = await fetch("/api/me");
          const me = await meRes.json();
          unlocked = !!me.unlocked;
          if (unlocked) accountData = await loadAccountWorkspace();
        } catch (e) {}
      }

      if (!unlocked) {
        setStatus("denied");
        return;
      }
      if (!previewingStarter && accountData && !accountData.workspace?.protocol_start_date) {
        window.location.href = "/account";
        return;
      }

      try {
        const raw = localStorage.getItem("tunnl-result");
        const saved = accountData?.readings?.[0]?.result || (raw ? JSON.parse(raw) : null);
        setResult(saved);
        if (saved?.memo) {
          const savedSetup = accountData?.workspace?.setup || {};
          const savedStart = accountData?.workspace?.protocol_start_date || new Date().toISOString().slice(0, 10);
          setStartDate(savedStart);
          setReview(accountData?.workspace?.completion_review || { strongestResult: "", unresolved: "", nextCommitment: "" });
          const built = buildProtocol(saved.memo, { ...saved.profile, ...savedSetup });
          setDays(built);
          const rawChecked = localStorage.getItem("tunnl-protocol-checked");
          setChecked(accountData?.workspace?.protocol_checked || (rawChecked ? JSON.parse(rawChecked) : {}));
          const rawNotes = localStorage.getItem("tunnl-protocol-notes");
          setNotes(accountData?.workspace?.protocol_notes || (rawNotes ? JSON.parse(rawNotes) : {}));
        }
      } catch (e) {}
      setStatus("ready");
    })();
  }, [params]);

  const toggle = (day) => {
    if (day === 14) return;
    const next = { ...checked, [day]: !checked[day] };
    setChecked(next);
    try {
      localStorage.setItem("tunnl-protocol-checked", JSON.stringify(next));
    } catch (e) {}
    saveWorkspace({ protocol_checked: next });
    if (next[day]) track("plan_day_completed", { day });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (scheduledDay < 14 || !checked[13]) return;
    const nextChecked = { ...checked, 14: true };
    const ok = await saveWorkspace({ completion_review: review, protocol_checked: nextChecked });
    if (!ok) return;
    setChecked(nextChecked);
    track("sprint_completed", { daysCompleted: 14 });
  };

  const updateNote = (day, value) => {
    const next = { ...notes, [day]: value };
    setNotes(next);
    try {
      localStorage.setItem("tunnl-protocol-notes", JSON.stringify(next));
    } catch (e) {}
  };

  const persistNotes = () => saveWorkspace({ protocol_notes: notes });

  const openToday = (day) => {
    setOpenDay(day);
    window.setTimeout(() => {
      document.getElementById(`protocol-day-${day}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  if (status === "checking") {
    return (
      <main className="shell" style={{ alignItems: "center" }}>
        <div className="eyebrow">Verifying purchase…</div>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Your 14-Day Plan</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            Your 14-Day Plan is included with Starter.
          </p>
          <Link href="/checkout" className="btn">Start my 14-Day Plan — $49</Link>
        </div>
      </main>
    );
  }

  const progress = protocolProgress(checked, days);
  const nextDay = days.find((day) => !checked[day.day]) || days[days.length - 1];
  const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const today = new Date();
  const scheduledDay = Math.max(0, Math.min(14, Math.floor((today - start) / 86400000) + 1));
  const missedDays = nextDay ? Math.max(0, scheduledDay - nextDay.day) : 0;
  const dateForDay = (day) => {
    const date = new Date(start);
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const recoverSchedule = async () => {
    if (!nextDay) return;
    const shifted = new Date();
    shifted.setDate(shifted.getDate() - (nextDay.day - 1));
    const value = shifted.toISOString().slice(0, 10);
    if (await saveWorkspace({ protocol_start_date: value })) setStartDate(value);
  };

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Your 14-Day Plan</div>
          <span className="num">№ 002</span>
        </div>
        <div className="rule" />

        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Commissioned</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            Your 14-Day Plan
          </h1>
          <p className="copy soft">
            One focused move at a time, built from your reading.
          </p>
        </div>

        {nextDay && (
          <section className="today-move">
            <div className="today-meta">
              <span>Next move · Day {nextDay.day}</span>
              <span>{nextDay.minutes} min</span>
            </div>
            <h2>{nextDay.title}</h2>
            <p>{nextDay.detail}</p>
            <button className="btn" onClick={() => openToday(nextDay.day)}>Open today&apos;s move</button>
            {missedDays > 0 && <div className="recovery-note">Life interrupted the schedule. Nothing is lost.<button onClick={recoverSchedule}>Continue from today</button></div>}
          </section>
        )}

        <div className="protocol-progress">
          <div className="protocol-progress-copy">
            <span>Plan progress</span>
            <strong>{progress.done} of {progress.total}</strong>
          </div>
          <div className="protocol-progress-track"><span style={{ width: `${progress.pct}%` }} /></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {days.map((d) => {
            const isChecked = !!checked[d.day];
            const open = openDay === d.day;
            const canComplete = d.day <= scheduledDay && (d.day === 1 || checked[d.day - 1]);
            const kindLabel = { kickoff: "Kickoff", action: "Move", integration: "Integration", close: "Close" }[d.type];
            return (
              <div id={`protocol-day-${d.day}`} key={d.day} className={`priority${open ? " open" : ""}`}>
                <button
                  className="priority-head"
                  onClick={() => setOpenDay(open ? null : d.day)}
                  style={{ gap: 14 }}
                >
                  <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); if (canComplete) toggle(d.day); }}
                      style={{
                        width: 20, height: 20, border: "1px solid var(--ink)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, flexShrink: 0, background: isChecked ? "var(--ink)" : "transparent",
                        color: "var(--paper)", cursor: canComplete ? "pointer" : "default", opacity: canComplete ? 1 : 0.35,
                      }}
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                    <span className="title" style={{ fontSize: 20 }}>
                      Day {d.day} — {kindLabel}
                    </span>
                    <span className="day-date">{dateForDay(d.day)}</span>
                  </span>
                  <span className="state">{open ? "Close —" : "Open +"}</span>
                </button>
                {open && (
                  <div className="priority-body">
                    <p style={{ fontSize: 14, lineHeight: 1.8, fontFamily: "var(--serif)", color: "var(--ink)", marginBottom: 10 }}>
                      {d.title}
                    </p>
                    <p className="diag" style={{ marginBottom: 0 }}>{d.detail}</p>
                    {d.context && <p className="day-context">{d.context}</p>}
                    <div className="day-specs">
                      <div><span>Time</span><strong>{d.minutes} minutes</strong></div>
                      <div><span>Why now</span><p>{d.why}</p></div>
                      <div><span>Done when</span><p>{d.doneWhen}</p></div>
                      <div><span>Notice</span><p>{d.reflection}</p></div>
                    </div>
                    <label className="day-reflection">
                      <span>What changed?</span>
                      <textarea
                        rows={3}
                        value={notes[d.day] || ""}
                        onChange={(event) => updateNote(d.day, event.target.value)}
                        onBlur={persistNotes}
                        placeholder="Write down what changed, what felt difficult, or what you learned."
                      />
                    </label>
                    {d.day === 14 && (
                      <form className="completion-review" onSubmit={submitReview}>
                        <div className="q-module">Complete your sprint</div>
                        <label>What changed most?<textarea required rows={3} value={review.strongestResult} onChange={(event) => setReview({ ...review, strongestResult: event.target.value })} /></label>
                        <label>What is still unresolved?<textarea required rows={3} value={review.unresolved} onChange={(event) => setReview({ ...review, unresolved: event.target.value })} /></label>
                        <label>What will you commit to next?<textarea required rows={3} value={review.nextCommitment} onChange={(event) => setReview({ ...review, nextCommitment: event.target.value })} /></label>
                        <button className="btn" type="submit">Complete sprint</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/account" className="btn full">Starter home</Link>
          <Link href="/vault" className="btn ghost full">Open Decision Tools</Link>
          <Link href="/ledger" className="btn ghost full">View Sprint Report</Link>
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

export default function Protocol() {
  return (
    <Suspense fallback={<main className="shell" />}>
      <ProtocolInner />
    </Suspense>
  );
}
