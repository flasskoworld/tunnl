import Link from "next/link";
import EngravingHero from "../components/EngravingHero";
import LandingPortalLink from "../components/LandingPortalLink";
import { MODULES } from "../lib/engine";

export default function Home() {
  return (
    <main className="shell home-shell">
      <div className="col home-col">
        <div className="top">
          <div className="eyebrow">An SE HQ Instrument</div>
          <div className="home-account">
            <Link href="/signin">Sign in</Link>
            <span className="num">№ 001</span>
          </div>
        </div>
        <div className="rule" />

        <div className="home-title">
          <h1 className="mark">
            TUNNL<span style={{ fontStyle: "italic" }}>.</span>
          </h1>
          <p className="tagline">An operating system for people who build.</p>
        </div>

        <div className="home-visual">
          <EngravingHero />
        </div>

        <div className="home-lower">
          <div>
            <p className="copy">Find what&apos;s slowing your work down.</p>
            <p className="copy soft">
              Answer 15 focused questions and get a clear reading of your
              strengths, constraints, and best next move.
            </p>
          </div>
          <LandingPortalLink />
        </div>

        <div className="home-modules">
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
