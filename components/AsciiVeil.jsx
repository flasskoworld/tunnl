"use client";
import { useState, useEffect, useRef } from "react";
import { buildVeil } from "../lib/ascii";

export default function AsciiVeil({ width = 44, height = 30 }) {
  const [seed, setSeed] = useState(1);
  const reduced = useRef(false);

  useEffect(() => {
    try {
      reduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch (e) {}
    if (reduced.current) return;
    const id = setInterval(() => setSeed((s) => s + 0.7), 350);
    return () => clearInterval(id);
  }, []);

  return (
    <pre aria-hidden="true" className="veil">
      {buildVeil(width, height, seed)}
    </pre>
  );
}
