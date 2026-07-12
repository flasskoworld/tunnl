"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Account() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        try {
          localStorage.setItem("tunnl-starter-unlocked", data.unlocked ? "true" : "false");
        } catch (e) {}
      });
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem("tunnl-starter-unlocked");
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

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Account</div>
        </div>
        <div className="rule" />
        <div style={{ padding: "26px 0 8px" }}>
          <div className="q-module">Signed in as</div>
          <h1 className="serif" style={{ fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1.2, marginBottom: 14, wordBreak: "break-all" }}>
            {me.email}
          </h1>
          <p className="copy soft">
            {me.unlocked ? "The Protocol is commissioned. Full access." : "Free tier — the Protocol isn't commissioned yet."}
          </p>
        </div>

        <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {me.unlocked ? (
            <>
              <Link href="/protocol" className="btn full">Open the 14-Day Protocol</Link>
              <Link href="/vault" className="btn ghost full">Open the Vault</Link>
              <Link href="/ledger" className="btn ghost full">View the Ledger</Link>
            </>
          ) : (
            <Link href="/checkout" className="btn full">Commission the Protocol — $49</Link>
          )}
          <Link href="/memo" className="btn ghost full">Back to the memo</Link>
          <button className="btn ghost full" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </main>
  );
}
