"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SigninInner() {
  const params = useSearchParams();
  const error = params.get("error");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (e2) {
      setErr(String(e2.message || e2));
    }
    setLoading(false);
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code didn't work");
      window.location.href = "/account";
    } catch (e2) {
      setErr(String(e2.message || e2));
      setVerifying(false);
    }
  };

  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">TUNNL · Sign In</div>
        </div>
        <div className="rule" />
        <div style={{ padding: "26px 0 8px" }}>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 9vw, 56px)", lineHeight: 1, marginBottom: 14 }}>
            Enter the tunnel
          </h1>
          <p className="copy soft">No password. We'll email you a link and a code.</p>
        </div>

        {error === "expired_link" && (
          <div className="risk" style={{ marginBottom: 24 }}>
            <p>That link expired or was already used. Request a new one below.</p>
          </div>
        )}

        {sent ? (
          <>
            <div className="verdict-box" style={{ marginBottom: 24 }}>
              <p style={{ fontStyle: "normal", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.8 }}>
                Check <strong>{email}</strong> — tap the link, or enter the
                6-digit code below. Both expire shortly.
              </p>
            </div>

            <form onSubmit={submitCode} style={{ maxWidth: 400 }}>
              <div className="eyebrow">Enter the code</div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%", fontFamily: "var(--mono)", fontSize: 22,
                  letterSpacing: "8px", textAlign: "center", padding: "14px 16px",
                  background: "transparent", border: "1px solid var(--ink)",
                  color: "var(--ink-deep)", marginBottom: 12,
                }}
              />
              {err && <p style={{ fontSize: 12, color: "var(--ink)", marginBottom: 12 }}>{err}</p>}
              <button className="btn full" disabled={verifying || code.length !== 6} type="submit">
                {verifying ? "Checking…" : "Sign in with code"}
              </button>
            </form>

            <button
              onClick={() => { setSent(false); setCode(""); setErr(null); }}
              style={{
                marginTop: 16, background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "var(--ink-soft)", textDecoration: "underline",
                fontFamily: "var(--mono)",
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <form onSubmit={submit} style={{ maxWidth: 400 }}>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", fontFamily: "var(--mono)", fontSize: 14,
                padding: "14px 16px", background: "transparent",
                border: "1px solid var(--ink)", color: "var(--ink-deep)",
                marginBottom: 12,
              }}
            />
            {err && <p style={{ fontSize: 12, color: "var(--ink)", marginBottom: 12 }}>{err}</p>}
            <button className="btn full" disabled={loading} type="submit">
              {loading ? "Sending…" : "Send link + code"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 30 }}>
          <Link href="/" className="btn ghost">Back home</Link>
        </div>
      </div>
    </main>
  );
}

export default function Signin() {
  return (
    <Suspense fallback={<main className="shell" />}>
      <SigninInner />
    </Suspense>
  );
}
