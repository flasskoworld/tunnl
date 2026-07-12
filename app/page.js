import Link from "next/link";
import EngravingHero from "../components/EngravingHero";
import { MODULES } from "../lib/engine";

export default function Home() {
  return (
    <main className="shell">
      <div className="col">
        <div className="top">
          <div className="eyebrow">An SE HQ Instrument</div>
          <span className="num">№ 001</span>
        </div>
        <div className="rule" />

        <h1 className="mark">
          TUNNL<span style={{ fontStyle: "italic" }}>.</span>
        </h1>
        <p className="tagline">An operating system for people who build.</p>

        <EngravingHero />

        <p className="copy">Seventeen questions. Nine modules. One operating memo.</p>
        <p className="copy soft" style={{ marginBottom: 32 }}>
          The engine reads your position, maps your leverage gaps, and tells
          you where to point the tunnel. Not theory — your situation.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
          <Link href="/diagnostic" className="btn">
            Enter the tunnel
          </Link>
        </div>

        <div style={{ marginTop: 52 }}>
          <div className="rule" />
          <div className="module-grid">
            {MODULES.map((m, i) => (
              <div key={m.key}>
                {String(i + 1).padStart(2, "0")} — {m.label}
              </div>
            ))}
          </div>
          <div className="rule" />
        </div>
      </div>
    </main>
  );
}
