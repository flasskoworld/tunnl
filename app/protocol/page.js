"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buildProtocol, protocolProgress } from "../../lib/protocol";

function ProtocolInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking | denied | ready
  const [result, setResult] = useState(null);
  const [days, setDays] = useState([]);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState({});
  const [openDay, setOpenDay] = useState(null);

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
      if (!previewingStarter) {
        try {
          const meRes = await fetch("/api/me");
          const me = await meRes.json();
          unlocked = !!me.unlocked;
          try { localStorage.setItem("tunnl-starter-unlocked", unlocked ? "true" : "false"); } catch (e) {}
        } catch (e) {
          try { unlocked = localStorage.getItem("tunnl-starter-unlocked") === "true"; } catch (e2) {}
        }
      }

      if (!unlocked) {
        setStatus("denied");
        return;
      }

      try {
        const raw = localStorage.getItem("tunnl-result");
        const saved = raw ? JSON.parse(raw) : null;
        setResult(saved);
        if (saved?.memo) {
          const built = buildProtocol(saved.memo, {
            twelve_month_destination: saved.profile?.twelve_month_destination,
          });
          setDays(built);
          const rawChecked = localStorage.getItem("tunnl-protocol-checked");
          setChecked(rawChecked ? JSON.parse(rawChecked) : {});
          const rawNotes = localStorage.getItem("tunnl-protocol-notes");
          setNotes(rawNotes ? JSON.parse(rawNotes) : {});
        }
      } catch (e) {}
      setStatus("ready");
    })();
  }, [params]);

  const toggle = (day) => {
    const next = { ...checked, [day]: !checked[day] };
    setChecked(next);
    try {
      localStorage.setItem("tunnl-protocol-checked", JSON.stringify(next));
    } catch (e) {}
  };

  const updateNote = (day, value) => {
    const next = { ...notes, [day]: value };
    setNotes(next);
    try {
      localStorage.setItem("tunnl-protocol-notes", JSON.stringify(next));
    } catch (e) {}
  };

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
          <div className="eyebrow">TUNNL · The Protocol</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            This is Starter content. Commission the Protocol to unlock your
            14-day sequence.
          </p>
          <Link href="/checkout" className="btn">Commission the Protocol — $49</Link>
        </div>
      </main>
    );
  }

  const progress = protocolProgress(checked, days);
  const nextDay = days.find((day) => !checked[day.day]) || days[days.length - 1];

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · The 14-Day Protocol</div>
          <span className="num">№ 002</span>
        </div>
        <div className="rule" />

        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Commissioned</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            The Protocol
          </h1>
          <p className="copy soft">
            Your memo, re-sequenced into fourteen days. One move at a time.
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
          </section>
        )}

        <div className="protocol-progress">
          <div className="protocol-progress-copy">
            <span>Protocol progress</span>
            <strong>{progress.done} of {progress.total}</strong>
          </div>
          <div className="protocol-progress-track"><span style={{ width: `${progress.pct}%` }} /></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {days.map((d) => {
            const isChecked = !!checked[d.day];
            const open = openDay === d.day;
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
                      onClick={(e) => { e.stopPropagation(); toggle(d.day); }}
                      style={{
                        width: 20, height: 20, border: "1px solid var(--ink)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, flexShrink: 0, background: isChecked ? "var(--ink)" : "transparent",
                        color: "var(--paper)", cursor: "pointer",
                      }}
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                    <span className="title" style={{ fontSize: 20 }}>
                      Day {d.day} — {kindLabel}
                    </span>
                  </span>
                  <span className="state">{open ? "Close —" : "Open +"}</span>
                </button>
                {open && (
                  <div className="priority-body">
                    <p style={{ fontSize: 14, lineHeight: 1.8, fontFamily: "var(--serif)", color: "var(--ink)", marginBottom: 10 }}>
                      {d.title}
                    </p>
                    <p className="diag" style={{ marginBottom: 0 }}>{d.detail}</p>
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
                        placeholder="Write down what changed, what felt difficult, or what you learned."
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/account" className="btn full">Starter home</Link>
          <Link href="/vault" className="btn ghost full">Open the Vault</Link>
          <Link href="/ledger" className="btn ghost full">View the Ledger</Link>
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
