"use client";

export function EndingQuestion() {
  const restart = () => {
    window.history.replaceState(null, "", "#opening-space");
    window.dispatchEvent(new CustomEvent("spatial:navigate", { detail: { id: "opening-space", index: 0 } }));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <section className="ending-question" id="ending" aria-labelledby="ending-question-title">
      <div className="ending-spatial-field" aria-hidden="true">
        <i className="ending-plane ending-plane-back" />
        <i className="ending-plane ending-plane-mid" />
        <i className="ending-plane ending-plane-front" />
        <b />
      </div>

      <div className="ending-question-copy">
        <p>One last question</p>
        <h2 id="ending-question-title">
          If every place can be captured as a world—and every viewpoint chosen later—
          <em>who decides which version becomes our memory?</em>
        </h2>
        <span>A photograph preserves a view. A spatial record preserves the power to choose one.</span>
      </div>

      <button className="ending-restart" type="button" onClick={restart}>
        <span>Return to the beginning</span><i aria-hidden="true" />
      </button>
    </section>
  );
}
