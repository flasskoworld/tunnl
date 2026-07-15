"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULES, weakestModules } from "../../lib/engine";
import { legacyPrefillVaultValues, vaultFor } from "../../lib/vault";
import { loadAccountWorkspace, readingForWorkspace, saveWorkspace } from "../../lib/clientData";
import StarterNav from "../components/StarterNav";

function ToolCard({ module, model, open, onToggle, setup, values, setField, persistValues }) {
  const tool = vaultFor(module.key, model);
  if (!tool) return null;
  const coreGuidance = tool.guidance?.slice(1, 2) || [];
  const playbook = tool.guidance ? [tool.guidance[0], ...tool.guidance.slice(2)] : [];
  return (
    <div className={`priority${open ? " open" : ""}`}>
      <button className="priority-head" onClick={onToggle}>
        <span className="tool-title"><strong>{tool.title}</strong><small>{tool.subtitle}</small></span>
        <span className="state">{open ? "Close —" : "Open +"}</span>
      </button>
      {open && (
        <div className="priority-body">
          <div className="sprint-target-context"><span>Sprint Target</span><strong>{setup.targetMetric || "Sprint measure"}: {setup.baselineValue || "starting point"} → {setup.targetValue || "Day 14 target"}</strong></div>
          <section className="tool-guidance"><div className="q-module">Tunnl recommends</div>{coreGuidance.map((item) => <div key={item.label}><span>{item.label}</span><p>{item.value}</p></div>)}</section>
          <section className="tool-response">
            <div className="q-module">Your response</div>
            {tool.fields.map((field) => <label key={field.key}><span>{field.label}</span><small>{field.prompt}</small><textarea rows={field.key === "result" ? 4 : 3} value={values[`${module.key}:response:${field.key}`] || ""} onChange={(event) => setField(module.key, field.key, event.target.value)} onBlur={persistValues} placeholder="Write your response here" /></label>)}
            <p>Responses save automatically.</p>
          </section>
          <details className="tool-playbook"><summary>View the full intervention playbook</summary>{playbook.map((item) => <div key={item.label}><span>{item.label}</span><p>{item.value}</p></div>)}</details>
        </div>
      )}
    </div>
  );
}

export default function Vault() {
  const [unlocked, setUnlocked] = useState(null); // null = checking
  const [openModule, setOpenModule] = useState(null);
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [sourceDay, setSourceDay] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [setup, setSetup] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

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
    const applyData = (selectedResult, selectedSetup = {}, savedValues = {}) => {
      const legacyPrefills = legacyPrefillVaultValues(selectedResult, selectedSetup);
      const migrated = Object.fromEntries(Object.entries(savedValues).filter(([key, value]) =>
        key.includes(":response:") || legacyPrefills[key] !== value
      ));
      const priorityKeys = selectedResult ? weakestModules(selectedResult.scores, 3) : [];
      if (requestedTool && !priorityKeys.includes(requestedTool)) setShowLibrary(true);
      setResult(selectedResult);
      setSetup(selectedSetup);
      setValues(migrated);
    };
    const previewingStarter =
      process.env.NODE_ENV === "development" &&
      (params.get("preview") === "starter" ||
        localStorage.getItem("tunnl-dev-starter-preview") === "true");
    if (previewingStarter) {
      localStorage.setItem("tunnl-dev-starter-preview", "true");
      setIsPreview(true);
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

  const setField = (moduleKey, fieldKey, val) => {
    const next = { ...values, [`${moduleKey}:response:${fieldKey}`]: val };
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
        <StarterNav current="tools" preview={isPreview} />
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Make one clear decision</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 60px)", lineHeight: 1, marginBottom: 14 }}>
            Decision Tools
          </h1>
          <p className="copy soft">Start with the tools selected for this sprint. Tunnl provides the recommendation; you record the decision and evidence.</p>
        </div>

        {sourceDay && openModule && <div className="tool-from-day"><span>Day {sourceDay}</span><p>This tool supports today&apos;s move. Your Sprint Target stays visible for context, while the tool records its own starting evidence.</p></div>}
        {saveStatus && <div className={`save-status${saveStatus === "Saved" ? " saved" : ""}`}>{saveStatus}</div>}

        <div className="tool-section-label"><span>For this sprint</span><strong>{result ? weakestModules(result.scores, 3).length : 0} recommended</strong></div>
        <div className="tool-list">
          {MODULES.filter((module) => result && weakestModules(result.scores, 3).includes(module.key)).map((module) => <ToolCard key={module.key} module={module} model={result?.profile?.business_model} open={openModule === module.key} onToggle={() => setOpenModule(openModule === module.key ? null : module.key)} setup={setup} values={values} setField={setField} persistValues={persistValues} />)}
        </div>

        <button className="outline-toggle tool-library-toggle" type="button" onClick={() => setShowLibrary((current) => !current)}>
          {showLibrary ? "Hide additional tools" : "More Decision Tools"}<span>{MODULES.length - (result ? weakestModules(result.scores, 3).length : 0)} available</span>
        </button>
        {showLibrary && <div className="tool-list tool-library">{MODULES.filter((module) => !result || !weakestModules(result.scores, 3).includes(module.key)).map((module) => <ToolCard key={module.key} module={module} model={result?.profile?.business_model} open={openModule === module.key} onToggle={() => setOpenModule(openModule === module.key ? null : module.key)} setup={setup} values={values} setField={setField} persistValues={persistValues} />)}</div>}

        <Link href={isPreview ? "/protocol?preview=starter" : "/protocol"} className="quiet-link">Return to today&apos;s move</Link>

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
