"use client";

/* eslint-disable @next/next/no-img-element -- exact archival and research images are intentionally preserved */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { keyboardTargetIsInteractive, sectionOwnsViewportCenter, spatialKeyDirection } from "./spatialKeyboard";

type TimelineState = "idle" | "playing" | "complete" | "reversing";

const milestones = [
  {
    year: "1965",
    label: "Pixel",
    title: "An image becomes discrete samples.",
    body: "Mariner 4 transmitted a 200 × 200 digital image—one brightness value per pixel.",
    source: "NASA / JPL",
  },
  {
    year: "1989",
    label: "Splatting",
    title: "A volume sample leaves a footprint.",
    body: "Westover projected volume samples onto the image plane instead of first building polygons.",
    source: "Westover · Volume Visualization",
  },
  {
    year: "2000",
    label: "QSplat",
    title: "Millions of points become interactive.",
    body: "QSplat combined splat rendering with hierarchy, visibility culling and level of detail.",
    source: "Stanford · SIGGRAPH 2000",
  },
  {
    year: "2023",
    label: "3DGS",
    title: "Gaussians become the scene.",
    body: "Kerbl and collaborators optimized anisotropic 3D Gaussians for photoreal, real-time novel views.",
    source: "Inria · SIGGRAPH 2023",
  },
  {
    year: "2025",
    label: "Marble + Spark",
    title: "Gaussian worlds reach the open web.",
    body: "Marble opened world creation in 2025; Spark now streams a 40M-splat San Francisco scene in the browser.",
    source: "World Labs · Coit Tower / Vincent Woo",
  },
] as const;

function deterministic(index: number) {
  const value = Math.sin(index * 91.173 + 17.71) * 43758.5453;
  return value - Math.floor(value);
}

function stableNumber(value: number) {
  return Number(value.toFixed(4));
}

const bustPoints = Array.from({ length: 154 }, (_, index) => {
  const head = index < 84;
  const local = head ? index : index - 84;
  const row = head ? Math.floor(local / 12) : Math.floor(local / 14);
  const column = head ? local % 12 : local % 14;
  const y = head ? 15 + row * 6.3 : 62 + row * 6.1;
  const normalizedY = head ? (y - 37) / 24 : (y - 76) / 21;
  const width = head
    ? 17 * Math.sqrt(Math.max(0.18, 1 - normalizedY * normalizedY))
    : 19 + row * 5.1;
  const columns = head ? 12 : 14;
  const x = 50 + ((column / (columns - 1)) * 2 - 1) * width + (deterministic(index) - 0.5) * 2.4;
  return {
    x: stableNumber(x),
    y: stableNumber(y + (deterministic(index + 300) - 0.5) * 2),
    size: stableNumber(2.2 + deterministic(index + 600) * 4.8),
    opacity: stableNumber(0.38 + deterministic(index + 900) * 0.58),
  };
});

function PixelVisual() {
  return (
    <div className="timeline-visual pixel-origin-visual">
      <img src="/media/timeline/mariner4-hand-colored.jpg" alt="The first Mariner 4 digital image of Mars, reconstructed from numbered strips and hand colored in 1965" />
      <div className="timeline-pixel-grid" aria-hidden="true" />
      <small>200 × 200 samples</small>
    </div>
  );
}

function SplattingVisual() {
  return (
    <div className="timeline-visual splatting-origin-visual" aria-label="Explanatory diagram of volume samples projected as soft footprints">
      <div className="volume-column" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((index) => <i key={index} />)}
      </div>
      <div className="projection-rays" aria-hidden="true"><i /><i /><i /></div>
      <div className="projection-plane" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((index) => <i key={index} />)}
      </div>
      <small>sample → footprint</small>
    </div>
  );
}

function QSplatVisual() {
  return (
    <div className="timeline-visual qsplat-origin-visual" aria-label="Explanatory multiresolution bust formed from splats">
      <div className="qsplat-bust" aria-hidden="true">
        {bustPoints.map((point, index) => (
          <i
            key={index}
            style={{
              "--point-x": `${point.x}%`,
              "--point-y": `${point.y}%`,
              "--point-size": `${point.size}px`,
              "--point-opacity": `${point.opacity}`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="qsplat-lod" aria-hidden="true"><span>LOD 0</span><i /><i /><i /><b>LOD 3</b></div>
      <small>coarse → refined</small>
    </div>
  );
}

function ThreeDGSVisual() {
  return (
    <div className="timeline-visual image-origin-visual">
      <img src="/media/timeline/inria-bicycle-3dgs.jpg" alt="Official Inria 3D Gaussian Splatting rendering of the bicycle scene" />
      <small>real-time novel view</small>
    </div>
  );
}

function WorldLabsVisual() {
  return (
    <div className="timeline-visual image-origin-visual worldlabs-origin-visual">
      <video muted loop autoPlay playsInline preload="auto" aria-label="World Labs Spark 2.0 rendering of the 40-million-splat Coit Tower model in San Francisco">
        <source src="/media/timeline/worldlabs-coit-tower.mp4" type="video/mp4" />
      </video>
      <small>Coit Tower · 40M splats</small>
    </div>
  );
}

const visuals = [<PixelVisual key="pixel" />, <SplattingVisual key="splatting" />, <QSplatVisual key="qsplat" />, <ThreeDGSVisual key="3dgs" />, <WorldLabsVisual key="worldlabs" />];

export function OriginsTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(false);
  const wheelTotalRef = useRef(0);
  const hoverIntentRef = useRef<number | null>(null);
  const hoverExitRef = useRef<number | null>(null);
  const [state, setState] = useState<TimelineState>("idle");
  const [focusedMilestone, setFocusedMilestone] = useState<number | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".timeline-milestone");
      const markers = gsap.utils.toArray<HTMLElement>(".timeline-marker");
      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.inOut" },
        onStart: () => setState(timeline.reversed() ? "reversing" : "playing"),
        onComplete: () => setState("complete"),
        onReverseComplete: () => setState("idle"),
      });
      timeline.timeScale(0.82);

      gsap.set(".timeline-progress-line", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".timeline-signal", { xPercent: -50, opacity: 0 });
      gsap.set(cards, { opacity: 0, y: 30, scale: 0.985 });
      gsap.set(markers, { scale: 0, opacity: 0 });
      gsap.set(".qsplat-bust", { opacity: 0, scale: 0.94 });
      gsap.set(".timeline-next-handoff", { opacity: 0, y: 18 });

      timeline
        .to(".timeline-progress-line", { scaleX: 1, duration: 6.2, ease: "none" }, 0.15)
        .to(".timeline-signal", { opacity: 1, duration: 0.24 }, 0.08)
        .to(".timeline-signal", { left: "95%", duration: 6.2, ease: "power1.inOut" }, 0.15);

      cards.forEach((card, index) => {
        const at = 0.45 + index * 1.15;
        timeline
          .to(markers[index], { scale: 1, opacity: 1, duration: 0.34, ease: "back.out(2.2)" }, at)
          .to(card, { opacity: 1, y: 0, scale: 1, duration: 0.72 }, at + 0.04)
          .fromTo(card.querySelector(".timeline-visual"), { opacity: 0.3, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.72 }, at + 0.08)
          .to(card.querySelector(".timeline-year"), { color: "#f5f5f7", duration: 0.3 }, at + 0.32);

        if (index === 0) {
          timeline.fromTo(".timeline-pixel-grid", { opacity: 0 }, { opacity: 0.66, duration: 0.66 }, at + 0.28);
        }
        if (index === 1) {
          timeline.fromTo(".volume-column i", { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.9, stagger: 0.06, duration: 0.28 }, at + 0.2)
            .fromTo(".projection-plane i", { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.88, stagger: 0.05, duration: 0.3 }, at + 0.52);
        }
        if (index === 2) {
          timeline.to(".qsplat-bust", { opacity: 1, scale: 1, duration: 0.72 }, at + 0.18);
        }
      });

      timeline
        .to(cards, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.04 }, 6.22)
        .to(".timeline-next-handoff", { opacity: 1, y: 0, duration: 0.48 }, 6.38)
        .to(".timeline-signal", { opacity: 0, scale: 2.4, duration: 0.44 }, 6.34);

      animationRef.current = timeline;
      if (reducedMotion) {
        timeline.progress(1).pause();
        setState("complete");
      }
    }, section);

    return () => {
      animationRef.current = null;
      context.revert();
    };
  }, []);

  useEffect(() => () => {
    if (hoverIntentRef.current !== null) window.clearTimeout(hoverIntentRef.current);
    if (hoverExitRef.current !== null) window.clearTimeout(hoverExitRef.current);
  }, []);

  useEffect(() => {
    if (state === "complete") return;
    if (hoverIntentRef.current !== null) window.clearTimeout(hoverIntentRef.current);
    if (hoverExitRef.current !== null) window.clearTimeout(hoverExitRef.current);
    hoverIntentRef.current = null;
    hoverExitRef.current = null;
    setFocusedMilestone(null);
  }, [state]);

  const requestMilestoneFocus = (index: number) => {
    if (state !== "complete") return;
    if (hoverExitRef.current !== null) window.clearTimeout(hoverExitRef.current);
    if (hoverIntentRef.current !== null) window.clearTimeout(hoverIntentRef.current);
    hoverExitRef.current = null;
    hoverIntentRef.current = window.setTimeout(() => {
      setFocusedMilestone(index);
      hoverIntentRef.current = null;
    }, 85);
  };

  const releaseMilestoneFocus = () => {
    if (hoverIntentRef.current !== null) window.clearTimeout(hoverIntentRef.current);
    if (hoverExitRef.current !== null) window.clearTimeout(hoverExitRef.current);
    hoverIntentRef.current = null;
    hoverExitRef.current = window.setTimeout(() => {
      setFocusedMilestone(null);
      hoverExitRef.current = null;
    }, 140);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.intersectionRatio >= 0.2;
      const timeline = animationRef.current;
      if (activeRef.current && timeline && timeline.progress() <= 0.001 && !timeline.isActive()) {
        setState("playing");
        timeline.play();
      }
    }, { threshold: [0, 0.2, 0.46, 0.7] });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const playForward = () => {
      const timeline = animationRef.current;
      if (!timeline || timeline.progress() >= 0.999) return false;
      setState("playing");
      timeline.play();
      return true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!sectionOwnsViewportCenter(sectionRef.current) || keyboardTargetIsInteractive(event.target)) return;
      const direction = spatialKeyDirection(event);
      if (direction === 0) return;
      const timeline = animationRef.current;
      if (!timeline) return;
      const progress = timeline.progress();
      const boundarySection = direction === 1
        ? document.getElementById("applications")
        : document.getElementById("4dgs");
      const canMove = direction === 1 ? progress < 0.999 : progress > 0.001;
      if (!canMove && !boundarySection) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (direction === 1 && canMove) {
        playForward();
      } else if (direction === -1 && canMove) {
        setState("reversing");
        timeline.reverse();
      } else {
        boundarySection?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!activeRef.current || event.deltaY === 0) return;
      const timeline = animationRef.current;
      if (!timeline) return;
      const direction = event.deltaY > 0 ? 1 : -1;
      const canAnimate = direction === 1 ? timeline.progress() < 0.999 : timeline.progress() > 0.001;
      if (!canAnimate) return;
      event.preventDefault();
      if (timeline.isActive()) return;
      if (Math.sign(wheelTotalRef.current) !== Math.sign(event.deltaY)) wheelTotalRef.current = 0;
      wheelTotalRef.current += event.deltaY;
      if (Math.abs(wheelTotalRef.current) < 44) return;
      wheelTotalRef.current = 0;
      if (direction === 1) {
        setState("playing");
        timeline.play();
      } else {
        setState("reversing");
        timeline.reverse();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  const toggle = () => {
    const timeline = animationRef.current;
    if (!timeline) return;
    if (timeline.progress() >= 0.999) {
      document.getElementById("applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setState("playing");
      timeline.play();
    }
  };

  return (
    <section className="history-timeline" id="timeline" ref={sectionRef} data-state={state} aria-label="Timeline from pixels to browser-based Gaussian worlds">
      <div className="timeline-heading">
        <p>From samples to spatial fields</p>
        <h2>Six decades.<br />One continuous idea.</h2>
      </div>

      <div className="timeline-rail" aria-hidden="true">
        <i className="timeline-base-line" />
        <i className="timeline-progress-line" />
        <b className="timeline-signal" />
      </div>

      <div
        className={`timeline-grid${focusedMilestone !== null ? " has-hover-focus" : ""}`}
        onPointerLeave={releaseMilestoneFocus}
      >
        {milestones.map((milestone, index) => (
          <article
            className={`timeline-milestone${focusedMilestone === index ? " is-hovered" : ""}`}
            tabIndex={0}
            onPointerEnter={() => requestMilestoneFocus(index)}
            onPointerLeave={releaseMilestoneFocus}
            onFocus={() => setFocusedMilestone(index)}
            onBlur={releaseMilestoneFocus}
            aria-label={`${milestone.year}: ${milestone.title}`}
            key={milestone.year}
          >
            {visuals[index]}
            <i className="timeline-marker" aria-hidden="true" />
            <div className="timeline-milestone-copy">
              <div><b className="timeline-year">{milestone.year}</b><span>{milestone.label}</span></div>
              <h3>{milestone.title}</h3>
              <p>{milestone.body}</p>
              <small>{milestone.source}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="timeline-next-handoff" aria-hidden="true"><span>Next</span><i /><b>Where spatial capture could go</b></div>
      <button className="timeline-play-control" type="button" onClick={toggle} aria-label={`${state === "complete" ? "Continue after" : "Play"} the history of Gaussian Splatting timeline`}>
        <kbd>Space</kbd>
        <span>{state === "complete" ? "Space to continue · scroll ↑ to rewind" : state === "playing" ? "Playing automatically…" : state === "reversing" ? "Rewinding…" : "Autoplay on arrival"}</span>
      </button>
    </section>
  );
}
