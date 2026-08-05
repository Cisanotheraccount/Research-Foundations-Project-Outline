"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { keyboardTargetIsInteractive, sectionOwnsViewportCenter, spatialKeyDirection } from "./spatialKeyboard";

export function EndingQuestion() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
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
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [restart]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      setActive(entry.isIntersecting && entry.intersectionRatio >= 0.45);
    }, { threshold: [0, 0.45, 0.75] });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ending-question" id="ending" ref={sectionRef} data-active={active} aria-labelledby="ending-question-title">
      <div className="ending-spatial-field" aria-hidden="true">
        <i className="ending-plane ending-plane-back" />
        <i className="ending-plane ending-plane-mid" />
        <i className="ending-plane ending-plane-front" />
      </div>

      <div className="ending-question-copy">
        <p>One last question</p>
        <h2 id="ending-question-title">What there for us?</h2>
      </div>

      <button className="ending-restart" type="button" onClick={restart}>
        <span>Return to the beginning</span><i aria-hidden="true" />
      </button>
    </section>
  );
}
