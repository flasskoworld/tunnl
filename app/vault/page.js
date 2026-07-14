"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, weakestModules } from "../../lib/engine";
import { prefillVaultValues, vaultFor } from "../../lib/vault";
import { loadAccountWorkspace, readingForWorkspace, saveWorkspace } from "../../lib/clientData";

export default function Vault() {
  const [unlocked, setUnlocked] = useState(null); // null = checking
  const [openModule, setOpenModule] = useState(null);
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [sourceDay, setSourceDay] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTool = params.get("tool");
    if (requestedTool && vaultFor(requestedTool)) setOpenModule(requestedTool);
    setSourceDay(params.get("day") || "");
    let localResult = null;
    let localValues = {};
    try {
      const savedValues = localStorage.getItem("tunnl-vault-values");
      localValues = savedValues ? JSON.parse(savedValues) : {};
      const savedResult = localStorage.getItem("tunnl-result");
      localResult = savedResult ? JSON.parse(savedResult) : null;
    } catch (error) {}
    const applyData = (selectedResult, setup = {}, savedValues = {}) => {
      setResult(selectedResult);
      setValues({ ...prefillVaultValues(selectedResult, setup), ...savedValues });
    };
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (params.get("preview") === "starter" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");
    if (previewingStarter) {
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setUnlocked(true);
      const previewWorkspace = JSON.parse(localStorage.getItem("tunnl-dev-workspace") || "{}");
      applyData(localResult, previewWorkspace.setup, localValues);
    } else {
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          setUnlocked(!!data.unlocked);
          if (data.unlocked) {
            loadAccountWorkspace().then((accountData) => {
              const selectedResult = readingForWorkspace(accountData, localResult);
              applyData(selectedResult, accountData?.workspace?.setup, accountData?.workspace?.vault_values || localValues);
            });
          }
        })
        .catch(() => setUnlocked(false));
    }
  }, []);

  const setField = (moduleKey, idx, val) => {
    const next = { ...values, [`${moduleKey}:${idx}`]: val };
    setValues(next);
    try {
      localStorage.setItem("tunnl-vault-values", JSON.stringify(next));
    } catch (e) {}
  };

  const persistValues = async () => {
    setSaveStatus("Saving...");
    const ok = await saveWorkspace({ vault_values: values });
    setSaveStatus(ok ? "Saved" : "Could not save. Check the connection and try again.");
  };

  if (unlocked === null) return <main className="shell" />;

  if (!unlocked) {
    return (
      <main className="shell">
        <div className="col">
          <div className="eyebrow">TUNNL · Decision Tools</div>
          <div className="rule" />
          <p className="copy" style={{ margin: "26px 0" }}>
            Decision Tools are included with Starter.
          </p>
          <Link href="/checkout" className="btn">Start my 14-Day Plan — $49</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Decision Tools</div>
          <span className="num">№ 003</span>
        </div>
        <div className="rule" />
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Built for the choices behind the work</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            Decision Tools
          </h1>
          <p className="copy soft">Start with the three tools recommended by your reading. The rest are here when you need them.</p>
        </div>

        {sourceDay && openModule && <div className="tool-from-day"><span>Day {sourceDay}</span><p>This tool is connected to today&apos;s move and has been prefilled from your Sprint Target where possible.</p></div>}
        {saveStatus && <div className={`save-status${saveStatus === "Saved" ? " saved" : ""}`}>{saveStatus}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {[...MODULES].sort((a, b) => {
            const weak = result ? weakestModules(result.scores, 3) : [];
            return (weak.includes(b.key) ? 1 : 0) - (weak.includes(a.key) ? 1 : 0);
          }).map((m) => {
            const v = vaultFor(m.key, result?.profile?.business_model);
            if (!v) return null;
            const open = openModule === m.key;
            return (
              <div key={m.key} className={`priority${open ? " open" : ""}`}>
                <button className="priority-head" onClick={() => setOpenModule(open ? null : m.key)}>
                  <span className="title">{v.title}{result && weakestModules(result.scores, 3).includes(m.key) ? " · Recommended" : ""}</span>
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
                            onBlur={persistValues}
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
                            onBlur={persistValues}
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
          <Link href="/protocol" className="btn ghost full">Back to the 14-Day Plan</Link>
          <Link href="/ledger" className="btn ghost full">View Sprint Report</Link>
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
