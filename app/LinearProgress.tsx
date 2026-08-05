"use client";

import { useEffect, useState } from "react";

const pages = [
  ["opening-space", "We live in 3D"],
  ["opening-flat", "A flat record"],
  ["opening-field", "A surface becomes a field"],
  ["opening-gaussian", "Gaussian Splatting"],
  ["representations", "Three ways to represent a scene"],
  ["story", "Photo"],
  ["video", "Video"],
  ["3dgs", "3DGS"],
  ["4dgs", "4DGS"],
  ["timeline", "From pixels to Gaussian worlds"],
  ["applications", "Where spatial capture could go"],
  ["ending", "One last question"],
] as const;

export function LinearProgress() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPage = (id: string, index: number) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const openingIndex = pages.slice(0, 4).findIndex(([pageId]) => pageId === id);
    const openingSequence = document.querySelector<HTMLElement>(".opening-sequence");
    const targetTop = openingIndex >= 0 && openingSequence
      ? openingSequence.offsetTop + openingIndex * window.innerHeight
      : window.scrollY + target.getBoundingClientRect().top;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setActiveIndex(index);
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new CustomEvent("spatial:navigate", { detail: { id, index } }));
    window.scrollTo({
      top: targetTop,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const ratios = new Map<Element, number>();
    const elements = pages
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
      let nextIndex = 0;
      let bestRatio = 0;
      elements.forEach((element) => {
        const ratio = ratios.get(element) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          nextIndex = pages.findIndex(([id]) => id === element.id);
        }
      });
      if (bestRatio > 0.2 && nextIndex >= 0) setActiveIndex(nextIndex);
    }, { threshold: [0, 0.2, 0.45, 0.7, 1] });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="linear-progress" aria-label={`Page ${activeIndex + 1} of ${pages.length}: ${pages[activeIndex][1]}`}>
      <div className="linear-page-number" aria-hidden="true">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <i>/</i>
        <b>{String(pages.length).padStart(2, "0")}</b>
      </div>
      {pages.map(([id, label], index) => (
        <button
          className={index === activeIndex ? "is-active" : ""}
          type="button"
          onClick={() => goToPage(id, index)}
          aria-label={`Go to page ${index + 1}: ${label}`}
          aria-current={index === activeIndex ? "page" : undefined}
          title={label}
          key={id}
        >
          <i aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
