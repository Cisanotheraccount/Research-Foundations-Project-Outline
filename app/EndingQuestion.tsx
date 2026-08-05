"use client";

import { useCallback, useEffect, useRef } from "react";
import { keyboardTargetIsInteractive, sectionOwnsViewportCenter, spatialKeyDirection } from "./spatialKeyboard";

export function EndingQuestion() {
  const sectionRef = useRef<HTMLElement>(null);
  const restart = useCallback(() => {
    window.history.replaceState(null, "", "#opening-space");
    window.dispatchEvent(new CustomEvent("spatial:navigate", { detail: { id: "opening-space", index: 0 } }));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!sectionOwnsViewportCenter(sectionRef.current) || keyboardTargetIsInteractive(event.target)) return;
      const direction = spatialKeyDirection(event);
      if (direction === 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (direction === -1) {
        document.getElementById("applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        restart();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [restart]);

  return (
    <section className="ending-question" id="ending" ref={sectionRef} aria-labelledby="ending-question-title">
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
