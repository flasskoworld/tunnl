"use client";

import { useEffect, useState } from "react";

const STATUS_LABELS = {
  exceeded: "Exceeded the sprint target",
  met: "Reached the sprint target",
  moved: "Created measurable movement",
  unchanged: "Produced a clear next decision",
  unmeasured: "Produced usable evidence",
};

export default function OutcomeEvidence() {
  const [outcomes, setOutcomes] = useState([]);

  useEffect(() => {
    fetch("/api/outcomes")
      .then((response) => response.json())
      .then((data) => setOutcomes(Array.isArray(data.outcomes) ? data.outcomes : []))
      .catch(() => setOutcomes([]));
  }, []);

  if (!outcomes.length) return null;

  return (
    <section className="home-evidence" aria-labelledby="outcome-evidence-title">
      <div className="home-section-head">
        <span>Evidence from completed sprints</span>
        <h2 id="outcome-evidence-title">What changed after the reading.</h2>
      </div>
      <div className="home-evidence-grid">
        {outcomes.map((outcome) => (
          <article key={outcome.id}>
            <p>&ldquo;{outcome.outcome_text}&rdquo;</p>
            <footer>
              <strong>{outcome.attribution}</strong>
              <span>{STATUS_LABELS[outcome.result_status] || outcome.project_intent || "Completed a Tunnl sprint"}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
