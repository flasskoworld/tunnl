"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES } from "../../lib/engine";
import { vaultFor } from "../../lib/vault";

export default function Vault() {
  const [unlocked, setUnlocked] = useState(null); // null = checking
  const [openModule, setOpenModule] = useState(null);
  const [values, setValues] = useState({});

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setUnlocked(!!data.unlocked);
        try { localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false"); } catch (e) {}
      })
      .catch(() => {
        try { setUnlocked(localStorage.getItem("tunnl-starter-unlocked") === "true"); } catch (e) { setUnlocked(false); }
      });
    try {
      const raw = localStorage.getItem("tunnl-vault-values");
      if (raw) setValues(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const setField = (moduleKey, idx, val) => {
    const next = { ...values, [`${moduleKey}:${idx}`]: val };
    setValues(next);
    try {
      localStorage.setItem("tunnl-vault-values", JSON.stringify(next));
    } catch (e) {}
  };

  if (unlocked === null) return <main className="shell" />;

  if (!unlocked) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · The Vault</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            The Vault is Starter content — nine worksheets, one per module.
          </p>
          <Link href="/checkout" className="btn">Commission the Protocol — $49</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · The Vault</div>
          <span className="num">№ 003</span>
        </div>
        <div className="rule" />
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Nine worksheets</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            The Vault
          </h1>
          <p className="copy soft">One worksheet per module. Fill what applies to your reading.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {MODULES.map((m) => {
            const v = vaultFor(m.key);
            if (!v) return null;
            const open = openModule === m.key;
            return (
              <div key={m.key} className={`priority${open ? " open" : ""}`}>
                <button className="priority-head" onClick={() => setOpenModule(open ? null : m.key)}>
                  <span className="title">{v.title}</span>
                  <span className="state">{open ? "Close —" : "Open +"}</span>
                </button>
                {open && (
                  <div className="priority-body">
                    <p className="diag">{v.subtitle}</p>
                    {v.fields.map((f, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11.5, color: "var(--ink)", marginBottom: 6, lineHeight: 1.5 }}>
                          {f.label}
                        </div>
                        {f.type === "textarea" || f.type === "list" ? (
                          <textarea
                            rows={f.rows || 3}
                            value={values[`${m.key}:${i}`] || ""}
                            onChange={(e) => setField(m.key, i, e.target.value)}
                            style={{
                              width: "100%", fontFamily: "var(--mono)", fontSize: 12.5,
                              lineHeight: 1.6, padding: 10, background: "var(--paper)",
                              border: "1px solid var(--ink)", color: "var(--ink-deep)", resize: "vertical",
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={values[`${m.key}:${i}`] || ""}
                            onChange={(e) => setField(m.key, i, e.target.value)}
                            style={{
                              width: "100%", fontFamily: "var(--mono)", fontSize: 12.5,
                              padding: 10, background: "var(--paper)",
                              border: "1px solid var(--ink)", color: "var(--ink-deep)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/protocol" className="btn ghost full">Back to the Protocol</Link>
          <Link href="/ledger" className="btn ghost full">View the Ledger</Link>
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
