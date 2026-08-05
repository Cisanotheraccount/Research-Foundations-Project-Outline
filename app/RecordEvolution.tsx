"use client";

/* eslint-disable @next/next/no-img-element -- responsive source sets and exact derived frames are intentional here */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { GaussianPrimitiveWebGL } from "./GaussianPrimitiveWebGL";
import { keyboardTargetIsInteractive, sectionOwnsViewportCenter, spatialKeyDirection } from "./spatialKeyboard";

type RecordChapterId = "photo" | "video" | "3dgs" | "4dgs";
type ChapterState = "idle" | "playing" | "complete" | "reversing";

type Chapter = {
  id: RecordChapterId;
  eyebrow: string;
  title: string;
  statement: string;
  credit: string;
};

const chapters: Chapter[] = [
  {
    id: "photo",
    eyebrow: "Photo · A 2D record",
    title: "A photograph samples light on a plane.",
    statement: "Brightness and color are preserved—one pixel at a time.",
    credit: "Real NYC video frame · Caleb Oquendo / Pexels",
  },
  {
    id: "video",
    eyebrow: "Video · 2D + time",
    title: "A video is a sequence of photographs.",
    statement: "Played continuously, still images become a two-dimensional record plus time.",
    credit: "Seven sequential frames · Same Pexels camera movement",
  },
  {
    id: "3dgs",
    eyebrow: "3DGS · A spatial field",
    title: "A recording becomes a place you can move through.",
    statement: "Optimized Gaussians carry position, scale, rotation, color and opacity.",
    credit: "Capture footage and stills · Continental Rooftop · 2026",
  },
  {
    id: "4dgs",
    eyebrow: "4DGS · A field through time",
    title: "3D + time: space becomes a sequence of states.",
    statement: "A dynamic field records not only where something is—but when.",
    credit: "Official 4DGS result · CVPR 2024 · CC BY-SA 4.0",
  },
];

const mediaRoot = "/media/record-evolution";
const continuityRoot = "/media/continuity";

function ResponsivePicture({ name, alt, className = "" }: { name: string; alt: string; className?: string }) {
  return (
    <picture className={className}>
      <source media="(max-width: 720px)" srcSet={`${mediaRoot}/${name}-960.avif`} type="image/avif" />
      <source media="(max-width: 720px)" srcSet={`${mediaRoot}/${name}-960.webp`} type="image/webp" />
      <source srcSet={`${mediaRoot}/${name}-1920.avif`} type="image/avif" />
      <img src={`${mediaRoot}/${name}-1920.webp`} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
}

function PhotoVisual() {
  return (
    <div className="photo-visual record-media-stage">
      <div className="photo-plane">
        <picture>
          <source media="(max-width: 720px)" srcSet={`${continuityRoot}/nyc-window-photo-960.webp`} type="image/webp" />
          <img src={`${continuityRoot}/nyc-window-photo-1920.webp`} alt="A real video frame of the Empire State Building seen through a Manhattan window" />
        </picture>
        <div className="photo-grid" aria-hidden="true" />
        <div className="photo-scan" aria-hidden="true" />
      </div>
      <div className="pixel-sample">
        <figure className="pixel-sample-image">
          <img src={`${continuityRoot}/nyc-window-pixel-detail-48.png`} alt="A 48 by 48 pixel crop enlarged with nearest-neighbor rendering from the same New York video frame" />
        </figure>
        <div><b>ONE SAMPLE</b><span>Brightness</span><span>RGB color</span></div>
      </div>
      <div className="plane-edge-label">x · y · no depth</div>
    </div>
  );
}

function VideoVisual() {
  return (
    <div className="video-visual record-media-stage">
      <video className="video-source" muted loop autoPlay playsInline preload="metadata" poster={`${continuityRoot}/nyc-window-photo-1920.webp`}>
        <source src={`${continuityRoot}/nyc-window.mp4`} type="video/mp4" />
      </video>
      <div className="video-frame-camera" aria-label="Seven flat photographs arranged along a three-dimensional time axis">
        <div className="video-frame-world">
          {[1, 2, 3, 4, 5, 6, 7].map((number) => (
            <figure className="video-frame" key={number}>
              <img src={`${continuityRoot}/nyc-window-frame-0${number}.webp`} alt={`New York video frame ${number}`} loading="lazy" decoding="async" />
              <figcaption>0{number}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="video-verdict">Images in sequence · 2D + time</div>
    </div>
  );
}

function GaussianVisual({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  return (
    <div className="gs-visual record-media-stage">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster={`${mediaRoot}/continental-rooftop-capture-poster.jpg`}
        aria-label="Personal capture footage recorded for the Continental Rooftop Gaussian Splatting project"
      >
        <source src={`${mediaRoot}/continental-rooftop-capture-loop.mp4`} type="video/mp4" />
      </video>
      <div className="gs-view-strip">
        {[
          ["continental-rooftop-view-01.jpg", "Capture 01"],
          ["continental-rooftop-view-02.jpg", "Capture 02"],
          ["continental-rooftop-view-03.jpg", "Capture 03"],
        ].map(([file, label]) => (
          <figure className="gs-view-card" key={label}>
            <img
              src={`${mediaRoot}/${file}`}
              alt={`${label} from the Continental Rooftop Gaussian Splatting capture path`}
              loading="lazy"
              decoding="async"
            />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="gaussian-primitive-demo" aria-label="An anisotropic Gaussian primitive">
        <GaussianPrimitiveWebGL />
        {[
          ["Position", "position"], ["Scale", "scale"], ["Rotation", "rotation"], ["Color", "color"], ["Opacity", "opacity"],
        ].map(([label, className]) => <span className={`primitive-label ${className}`} key={label}>{label}</span>)}
      </div>
      <div className="gs-verdict">Free viewpoint · Photoreal spatial field</div>
    </div>
  );
}

function FourDVisual({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  const frames = [
    ["s09-time-t-2", "t−2"],
    ["s09-time-t-1", "t−1"],
    ["s09-time-t0", "t0"],
    ["s09-time-tplus1", "t+1"],
    ["s09-time-tplus2", "t+2"],
  ];
  return (
    <div className="four-d-visual record-media-stage">
      <video ref={videoRef} muted loop playsInline preload="metadata" aria-hidden="true">
        <source src={`${mediaRoot}/cvpr2024-4dgs-standup-time.mp4`} type="video/mp4" />
      </video>
      <img className="tesseract-metaphor" src={`${mediaRoot}/s09-interstellar-tesseract.jpg`} alt="The tesseract scene from Interstellar, used as a visual metaphor for moving through time" loading="lazy" decoding="async" />
      <div className="time-stack">
        {frames.map(([name, label]) => (
          <figure className="time-frame" key={label}>
            <ResponsivePicture name={name} alt={`Official 4DGS reconstruction at ${label}`} />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="four-d-axis"><span>SPACE</span><i /><b>TIME</b></div>
      <div className="film-credit">Visual metaphor — <i>Interstellar</i> (2014)</div>
    </div>
  );
}

export function RecordEvolution() {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const timelineRefs = useRef<Array<gsap.core.Timeline>>([]);
  const video3DRef = useRef<HTMLVideoElement>(null);
  const video4DRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(-1);
  const wheelTotalRef = useRef(0);
  const [states, setStates] = useState<ChapterState[]>(chapters.map(() => "idle"));
  const [reducedMotion] = useState(() => typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const updateState = (index: number, state: ChapterState) => {
    setStates((current) => current.map((value, itemIndex) => itemIndex === index ? state : value));
  };

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contexts: gsap.Context[] = [];

    sectionRefs.current.forEach((section, index) => {
      if (!section) return;
      const visual = section.querySelector(".record-media-stage");
      if (!visual) return;
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.inOut" },
          onStart: () => updateState(index, timeline.reversed() ? "reversing" : "playing"),
          onComplete: () => updateState(index, "complete"),
          onReverseComplete: () => updateState(index, "idle"),
        });
        timeline.timeScale(0.82);

        if (index === 0) {
          timeline
            .set(".photo-grid", { opacity: 0 })
            .set(".photo-scan", { opacity: 0, xPercent: -130 })
            .set(".pixel-sample", { opacity: 0, scale: 0.58, xPercent: 24 })
            .set(".plane-edge-label", { opacity: 0, y: 12 })
            .to(".photo-grid", { opacity: 0.36, duration: 0.55 }, 0.3)
            .to(".photo-scan", { opacity: 1, xPercent: 135, duration: 1.05, ease: "power2.inOut" }, 0.28)
            .to(".photo-scan", { opacity: 0, duration: 0.2 }, 1.18)
            .to(".pixel-sample", { opacity: 1, scale: 1, xPercent: 0, duration: 0.82 }, 1.18)
            .to(".photo-plane", { rotationY: -12, rotationX: 2, xPercent: -7, duration: 0.72 }, 1.82)
            .to(".plane-edge-label", { opacity: 1, y: 0, duration: 0.38 }, 2.18);
        }

        if (index === 1) {
          const frames = gsap.utils.toArray<HTMLElement>(".video-frame");
          const depthStep = Math.min(112, Math.max(68, window.innerWidth * 0.055));
          timeline
            .set(frames, {
              opacity: 0,
              x: 0,
              y: 0,
              z: 0,
              scale: 0.9,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              transformOrigin: "center center",
            })
            .set(".video-frame-world", { scale: 0.88, transformOrigin: "50% 50%" })
            .set(".video-verdict", { opacity: 0, y: 12 })
            .set(".video-source", { opacity: 1, scale: 1 })
            .to(".video-source", { scale: 1.035, duration: 0.58 }, 0.04)
            .to(".video-source", { opacity: 0.08, filter: "blur(12px) brightness(.42)", duration: 0.58 }, 0.54)
            .to(frames, {
              opacity: 1,
              duration: 0.62,
              stagger: 0.07,
            }, 0.6)
            .to(frames, {
              z: (itemIndex) => (itemIndex - 3) * depthStep,
              scale: 0.9,
              duration: 1.08,
              stagger: 0.055,
              ease: "power4.inOut",
            }, 1.12)
            .to(".video-frame-world", { scale: 1, duration: 0.92, ease: "power3.out" }, 1.18)
            .to(frames, { filter: "brightness(.72)", duration: 0.24 }, 2.12)
            .to(frames, { filter: "brightness(1.08)", duration: 0.14, stagger: 0.09 }, 2.18)
            .to(frames, { filter: "brightness(.78)", duration: 0.18, stagger: 0.09 }, 2.31)
            .to(".video-verdict", { opacity: 1, y: 0, duration: 0.42 }, 2.72);
        }

        if (index === 2) {
          const cards = gsap.utils.toArray<HTMLElement>(".gs-view-card");
          const labels = gsap.utils.toArray<HTMLElement>(".primitive-label");
          timeline
            .set(".gs-visual > video", { opacity: 0, scale: 0.88, clipPath: "inset(14% 18% 14% 18% round 22px)" })
            .set(cards, { opacity: 0, y: 42, scale: 0.82 })
            .set(".gaussian-primitive-demo", { opacity: 0, scale: 0.82, y: 22 })
            .set(labels, { opacity: 0, scale: 0.74 })
            .set(".gs-verdict", { opacity: 0, y: 12 })
            .to(".gs-visual > video", { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.9 }, 0.1)
            .to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14 }, 1.02)
            .to(cards, { opacity: 0.18, scale: 0.86, duration: 0.46, stagger: 0.05 }, 2.08)
            .to(".gs-visual > video", { opacity: 0.28, filter: "blur(7px)", duration: 0.5 }, 2.08)
            .to(".gaussian-primitive-demo", { opacity: 1, scale: 1, y: 0, duration: 0.82 }, 2.12)
            .to(labels, { opacity: 1, scale: 1, duration: 0.34, stagger: 0.12 }, 2.62)
            .to(".gs-verdict", { opacity: 1, y: 0, duration: 0.42 }, 3.42)
            .to(".gs-visual > video", { opacity: 0.44, filter: "blur(3.5px)", duration: 0.55 }, 3.45);
        }

        if (index === 3) {
          const frames = gsap.utils.toArray<HTMLElement>(".time-frame");
          timeline
            .set(frames, { opacity: 0, x: 0, y: 0, scale: 0.74, rotationY: 0 })
            .set(frames[2], { opacity: 1, scale: 1 })
            .set(".four-d-axis", { opacity: 0, scaleX: 0.55 })
            .set(".tesseract-metaphor", { opacity: 0, scale: 1.06 })
            .set(".film-credit", { opacity: 0, y: 10 })
            .to(frames, {
              opacity: (itemIndex) => itemIndex === 2 ? 1 : 0.72,
              x: (itemIndex) => (itemIndex - 2) * 112,
              y: (itemIndex) => Math.abs(itemIndex - 2) * 18,
              scale: (itemIndex) => 1 - Math.abs(itemIndex - 2) * 0.11,
              rotationY: (itemIndex) => (itemIndex - 2) * -8,
              duration: 1.05,
              stagger: 0.08,
            }, 0.18)
            .to(".four-d-axis", { opacity: 1, scaleX: 1, duration: 0.48 }, 0.88)
            .to(frames, { opacity: 0.32, duration: 0.28 }, 1.62)
            .to(frames[0], { opacity: 1, scale: 1.04, duration: 0.32 }, 1.7)
            .to(frames[0], { opacity: 0.32, scale: 0.78, duration: 0.28 }, 2.02)
            .to(frames[1], { opacity: 1, scale: 1.04, duration: 0.32 }, 1.98)
            .to(frames[1], { opacity: 0.32, scale: 0.89, duration: 0.28 }, 2.3)
            .to(frames[2], { opacity: 1, scale: 1.04, duration: 0.32 }, 2.26)
            .to(frames[2], { opacity: 0.32, scale: 1, duration: 0.28 }, 2.58)
            .to(frames[3], { opacity: 1, scale: 1.04, duration: 0.32 }, 2.54)
            .to(frames[3], { opacity: 0.32, scale: 0.89, duration: 0.28 }, 2.86)
            .to(frames[4], { opacity: 1, scale: 1.04, duration: 0.32 }, 2.82)
            .to(".tesseract-metaphor", { opacity: 0.14, scale: 1, duration: 0.72 }, 3.02)
            .to(".film-credit", { opacity: 1, y: 0, duration: 0.4 }, 3.36);
        }

        timelineRefs.current[index] = timeline;
        if (mediaQuery.matches) {
          timeline.progress(1).pause();
          updateState(index, "complete");
        }
      }, section);
      contexts.push(context);
    });

    return () => contexts.forEach((context) => context.revert());
  }, []);

  useEffect(() => {
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
      let bestIndex = -1;
      let bestRatio = 0;
      sectionRefs.current.forEach((section, index) => {
        const ratio = section ? ratios.get(section) ?? 0 : 0;
        if (ratio > bestRatio) {
          bestIndex = index;
          bestRatio = ratio;
        }
      });
      const nextIndex = bestRatio >= 0.42 ? bestIndex : -1;
      activeRef.current = nextIndex;
      const nextTimeline = nextIndex >= 0 ? timelineRefs.current[nextIndex] : null;
      if (nextTimeline && nextTimeline.progress() <= 0.001 && !nextTimeline.isActive()) {
        updateState(nextIndex, "playing");
        nextTimeline.play();
      }
      if (nextIndex === 2 && bestRatio > 0.25) void video3DRef.current?.play().catch(() => undefined);
      else video3DRef.current?.pause();
      if (nextIndex === 3 && bestRatio > 0.25) void video4DRef.current?.play().catch(() => undefined);
      else video4DRef.current?.pause();
    }, { threshold: [0, 0.25, 0.42, 0.6, 0.8] });
    sectionRefs.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const activeTimeline = () => timelineRefs.current[activeRef.current];

    const move = (direction: 1 | -1) => {
      const timeline = activeTimeline();
      if (!timeline) return false;
      const progress = timeline.progress();
      if (direction === 1 && progress < 0.999) {
        updateState(activeRef.current, "playing");
        timeline.play();
        return true;
      }
      if (direction === -1 && progress > 0.001) {
        updateState(activeRef.current, "reversing");
        timeline.reverse();
        return true;
      }
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      if (activeRef.current < 0 || event.deltaY === 0) return;
      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const timeline = activeTimeline();
      if (!timeline) return;
      const canMove = direction === 1 ? timeline.progress() < 0.999 : timeline.progress() > 0.001;
      if (!canMove) return;
      event.preventDefault();
      if (Math.sign(wheelTotalRef.current) !== Math.sign(event.deltaY)) wheelTotalRef.current = 0;
      wheelTotalRef.current += event.deltaY;
      if (Math.abs(wheelTotalRef.current) < 44) return;
      wheelTotalRef.current = 0;
      move(direction);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (keyboardTargetIsInteractive(event.target)) return;
      const index = sectionRefs.current.findIndex((section) => sectionOwnsViewportCenter(section));
      const direction = spatialKeyDirection(event);
      if (index < 0 || direction === 0) return;
      activeRef.current = index;
      const timeline = activeTimeline();
      if (!timeline) return;
      const progress = timeline.progress();
      const canMove = direction === 1 ? progress < 0.999 : progress > 0.001;
      const boundarySection = direction === 1
        ? sectionRefs.current[index + 1] ?? (index === chapters.length - 1 ? document.getElementById("timeline") : null)
        : sectionRefs.current[index - 1] ?? (index === 0 ? document.getElementById("representations") : null);
      if (!canMove && !boundarySection) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (move(direction)) return;
      boundarySection?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reducedMotion]);

  const toggleChapter = (index: number) => {
    const timeline = timelineRefs.current[index];
    if (!timeline) return;
    if (timeline.progress() >= 0.999) {
      const nextSection = sectionRefs.current[index + 1]
        ?? (index === chapters.length - 1 ? document.getElementById("timeline") : null);
      nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    timeline.play();
  };

  return (
    <section className="record-evolution" id="record-evolution" aria-label="From two-dimensional records to four-dimensional fields">
      {chapters.map((chapter, index) => (
        <article
          className="record-chapter"
          id={chapter.id === "photo" ? "story" : chapter.id}
          key={chapter.id}
          ref={(element) => { sectionRefs.current[index] = element; }}
          data-state={states[index]}
        >
          <div className="record-chapter-copy">
            <p>{chapter.eyebrow}</p>
            <h2>{chapter.title}</h2>
            <span>{chapter.statement}</span>
          </div>
          <div className="record-chapter-visual">
            {chapter.id === "photo" && <PhotoVisual />}
            {chapter.id === "video" && <VideoVisual />}
            {chapter.id === "3dgs" && <GaussianVisual videoRef={video3DRef} />}
            {chapter.id === "4dgs" && <FourDVisual videoRef={video4DRef} />}
            <small className="record-credit">{chapter.credit}</small>
          </div>
          <button className="chapter-play-control" type="button" onClick={() => toggleChapter(index)} aria-label={`${states[index] === "complete" ? "Continue after" : "Play"} ${chapter.eyebrow} animation`}>
            <kbd>Space</kbd><span>{states[index] === "complete" ? "Space to continue · scroll ↑ to reverse" : states[index] === "reversing" ? "Reversing…" : states[index] === "playing" ? "Playing automatically…" : "Autoplay on arrival"}</span>
          </button>
        </article>
      ))}

    </section>
  );
}
