import AsciiVeil from "./AsciiVeil";

// The tunnel: 19th-century engraving, TUNNL ultramarine duotone,
// slow breathe + drifting ASCII veil. fig. 01.
export default function EngravingHero() {
  return (
    <>
      <div className="frame">
        <div className="stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tunnl-panorama-stairs-blue.png"
            alt="Engraved arch opening onto a temple — the tunnel"
            className="engraving"
          />
          <AsciiVeil />
        </div>
      </div>
      <div className="caption">
        <span>fig. 01 — the tunnel</span>
        <span>ink on paper</span>
      </div>
    </>
  );
}
