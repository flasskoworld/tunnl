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
      let unlocked = false;
      try {
        const meRes = await fetch("/api/me");
        const me = await meRes.json();
        unlocked = !!me.unlocked;
        try { localStorage.setItem("tunnl-starter-unlocked", unlocked ? "true" : "false"); } catch (e) {}
      } catch (e) {
        try { unlocked = localStorage.getItem("tunnl-starter-unlocked") === "true"; } catch (e2) {}
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
            twelve_month_destination: saved.destination,
          });
          setDays(built);
          const rawChecked = localStorage.getItem("tunnl-protocol-checked");
          setChecked(rawChecked ? JSON.parse(rawChecked) : {});
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

        <div className="scorecard" style={{ marginBottom: 30 }}>
          <div className="board-avg">
            <span>Progress</span>
            <span className="avg-num">{progress.done}/{progress.total}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {days.map((d) => {
            const isChecked = !!checked[d.day];
            const open = openDay === d.day;
            const kindLabel = { kickoff: "Kickoff", action: "Move", integration: "Integration", close: "Close" }[d.type];
            return (
              <div key={d.day} className={`priority${open ? " open" : ""}`}>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
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
