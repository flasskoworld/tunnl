// ASCII craft utilities — the digitized layer of the TUNNL aesthetic.

// Sparse drifting character field, laid over the engraving as a veil.
export function buildVeil(w, h, seed) {
  const chars = " .:-=+*#";
  let out = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n =
        Math.abs(Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453) % 1;
      out += n > 0.82 ? chars[Math.floor(n * 97) % chars.length] : " ";
    }
    out += "\n";
  }
  return out;
}

// Solid/empty block bar for the scorecard: ████████░░░░
export function asciiBar(value, width = 22) {
  const filled = Math.round((value / 100) * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}
