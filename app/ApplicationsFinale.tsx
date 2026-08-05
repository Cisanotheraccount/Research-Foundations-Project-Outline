"use client";

/* eslint-disable @next/next/no-img-element -- exact credited source imagery is intentionally preserved */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import gsap from "gsap";

type FinaleState = "idle" | "playing" | "complete" | "reversing";

const applications = [
  {
    label: "Everyday environments",
    title: "We already expect places to be explorable.",
    body: "City maps and property tours made navigable 3D familiar. Gaussian capture can make photoreal spatial records far easier to produce.",
    source: "Apple Maps · Real property imagery",
  },
  {
    label: "Volumetric performance",
    title: "Record once. Choose the camera later.",
    body: "Superman (2025) used 4D Gaussian Splatting for the holographic recordings of Superman’s parents—a feature-film first, according to Framestore.",
    source: "Framestore + Infinite Realities · Superman (2025)",
  },
  {
    label: "Rapid field reconstruction",
    title: "When reconstruction takes minutes, location capture changes.",
    body: "FastGS trained a benchmark scene in about 100 seconds. Disaster sites and remote terrain are promising uses—not claims tested by the paper.",
    source: "Nankai University · FastGS · CVPR 2026 Highlight",
  },
  {
    label: "Robotics & SLAM",
    title: "A moving camera can build its own map.",
    body: "SplaTAM tracks the camera and expands a dense Gaussian map online from one unposed RGB-D stream.",
    source: "SplaTAM · CMU + MIT · CVPR 2024",
  },
  {
    label: "Creative tools",
    title: "Reality itself can become a brush.",
    body: "Artists can pick up captured texture and geometry, then paint new spatial scenes with Gaussian splat brushes in real time.",
    source: "U of Toronto + NVIDIA · SIGGRAPH 2025",
  },
  {
    label: "Cultural heritage",
    title: "Fragile artifacts can remain explorable.",
    body: "Gaussian Heritage turns ordinary RGB photographs into segmented 3D replicas that preserve and share individual objects.",
    source: "IIT PAVIS · ECCV 2024 VISART",
  },
] as const;

function EverydayVisual() {
  return (
    <div className="application-visual everyday-visual">
      <figure className="everyday-city">
        <img src="/media/applications/apple-maps-sf-3d.jpg" alt="Apple Maps three-dimensional view of San Francisco" />
        <figcaption>City scale</figcaption>
      </figure>
      <figure className="everyday-property">
        <img src="/media/continuity/nyc-window-photo-1920.webp" alt="A real New York apartment view used as property-scale imagery" />
        <figcaption>Property scale</figcaption>
      </figure>
      <div className="everyday-camera-path" aria-hidden="true"><i /><b /><span /></div>
    </div>
  );
}

function CinemaVisual() {
  return (
    <div className="application-visual cinema-visual" role="group" aria-label="Comparison of the Superman volumetric capture stage and the final hologram shot">
      <figure className="cinema-stage cinema-stage-capture">
        <img src="/media/applications/superman-4dgs-capture-context.jpg" alt="The surrounding camera and calibration array inside Infinite Realities' volumetric capture stage" />
        <figcaption><span>Capture</span><b>192-camera stage</b></figcaption>
      </figure>
      <div className="cinema-transfer" aria-hidden="true"><span>Reframe in post</span><i /></div>
      <figure className="cinema-stage cinema-stage-final">
        <img src="/media/applications/superman-4dgs-final-context.jpg" alt="The final wide Fortress of Solitude shot with the hologram, surrounding crystals, robots, and equipment" />
        <figcaption><span>Final</span><b>Fortress hologram</b></figcaption>
      </figure>
    </div>
  );
}

function RapidFieldVisual({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  return (
    <div className="application-visual rapid-field-visual">
      <video ref={videoRef} muted loop playsInline preload="metadata" poster="/media/applications/fastgs-result.png" aria-label="Official FastGS video of the Tanks and Temples train scene">
        <source src="/media/applications/fastgs-train.mp4" type="video/mp4" />
      </video>
      <div className="field-scan-grid" aria-hidden="true" />
      <div className="fastgs-counter"><span>TRAINING</span><b>0</b><i>SECONDS</i></div>
      <div className="field-use-cases" aria-label="Potential applications inferred from faster reconstruction">
        <span>Emergency site</span><i />
        <span>Remote terrain</span><i />
        <small>Potential application · inference</small>
      </div>
    </div>
  );
}

function RoboticsVisual({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  return (
    <div className="application-visual robotics-visual">
      <video ref={videoRef} muted loop playsInline preload="metadata" poster="/media/applications/splatam-collage-poster.jpg" aria-label="Official SplaTAM online Gaussian mapping results">
        <source src="/media/applications/splatam-collage.mp4" type="video/mp4" />
      </video>
      <div className="robotics-route" aria-hidden="true"><i /><i /><i /><i /><b /></div>
      <div className="robotics-status"><span>Track</span><i /><span>Map</span><i /><span>Render</span></div>
    </div>
  );
}

function CreativeVisual() {
  return (
    <div className="application-visual creative-visual">
      <img src="/media/applications/painting-with-splats.jpg" alt="A captured garden remixed with trees, flowers, birds and a path using 3D Gaussian splat brushes" />
      <div className="creative-label creative-brush"><span>Captured brush</span><b>Reality</b></div>
      <div className="creative-label creative-result"><span>Painted world</span><b>Remix</b></div>
    </div>
  );
}

function HeritageVisual() {
  return (
    <div className="application-visual heritage-visual">
      <img src="/media/applications/gaussian-heritage.jpg" alt="A cultural heritage sculpture reconstructed and separated into explorable Gaussian objects" />
      <div className="heritage-sequence" aria-hidden="true">
        <span>Photographs</span><i />
        <span>3D replica</span><i />
        <span>Object</span>
      </div>
    </div>
  );
}

export function ApplicationsFinale() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roboticsVideoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(false);
  const wheelTotalRef = useRef(0);
  const [state, setState] = useState<FinaleState>("idle");

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const video = videoRef.current;
    const roboticsVideo = roboticsVideoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".application-card");
      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.inOut" },
        onStart: () => {
          setState(timeline.reversed() ? "reversing" : "playing");
          void video?.play().catch(() => undefined);
          void roboticsVideo?.play().catch(() => undefined);
        },
        onComplete: () => setState("complete"),
        onReverseComplete: () => {
          setState("idle");
          video?.pause();
          roboticsVideo?.pause();
        },
      });
      timeline.timeScale(0.82);

      gsap.set(cards, { opacity: 0, y: 52, rotationX: -8, filter: "blur(10px)" });
      gsap.set(".everyday-city", { xPercent: 24, rotationY: -12, opacity: 0 });
      gsap.set(".everyday-property", { xPercent: -22, rotationY: 10, opacity: 0 });
      gsap.set(".everyday-camera-path", { opacity: 0, scale: 0.8 });
      gsap.set(".cinema-stage-capture", { xPercent: -12, scale: 1.06, opacity: 0, filter: "saturate(.5) brightness(.46) blur(5px)" });
      gsap.set(".cinema-stage-final", { xPercent: 12, scale: 1.06, opacity: 0, filter: "saturate(.55) brightness(.5) blur(5px)" });
      gsap.set(".cinema-transfer", { opacity: 0, scale: 0.82 });
      gsap.set(".rapid-field-visual video", { scale: 1.08, filter: "brightness(.48) saturate(.55) blur(5px)" });
      gsap.set(".field-scan-grid", { opacity: 0, backgroundPosition: "0 0" });
      gsap.set(".fastgs-counter", { opacity: 0, y: 14 });
      gsap.set(".field-use-cases", { opacity: 0, y: 12 });
      gsap.set(".robotics-visual video", { scale: 1.08, filter: "brightness(.48) saturate(.52) blur(5px)" });
      gsap.set(".robotics-route", { opacity: 0, scale: 0.84 });
      gsap.set(".robotics-status", { opacity: 0, y: 10 });
      gsap.set(".creative-visual img", { scale: 1.08, filter: "brightness(.5) saturate(.55) blur(5px)" });
      gsap.set(".creative-label", { opacity: 0, y: 12 });
      gsap.set(".heritage-visual img", { scale: 1.08, filter: "brightness(.48) saturate(.5) blur(5px)" });
      gsap.set(".heritage-sequence", { opacity: 0, y: 10 });

      timeline
        .to(cards[0], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 0.34)
        .to(".everyday-city", { xPercent: 0, rotationY: 0, opacity: 1, duration: 0.72 }, 0.52)
        .to(".everyday-property", { xPercent: 0, rotationY: 0, opacity: 1, duration: 0.72 }, 0.7)
        .to(".everyday-camera-path", { opacity: 1, scale: 1, duration: 0.5 }, 1.02)
        .to(cards[1], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 2.12)
        .to(".cinema-stage-capture", { xPercent: 0, scale: 1, opacity: 1, filter: "saturate(.82) brightness(1) blur(0px)", duration: 0.78 }, 2.28)
        .to(".cinema-transfer", { opacity: 1, scale: 1, duration: 0.42 }, 2.68)
        .to(".cinema-stage-final", { xPercent: 0, scale: 1, opacity: 1, filter: "saturate(.82) brightness(1) blur(0px)", duration: 0.82 }, 2.88)
        .to(cards[2], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 4.22)
        .to(".rapid-field-visual video", { scale: 1, filter: "brightness(.78) saturate(.72) blur(0px)", duration: 0.82 }, 4.36)
        .to(".field-scan-grid", { opacity: 0.58, backgroundPosition: "28px 18px", duration: 0.72 }, 4.58)
        .to(".fastgs-counter", { opacity: 1, y: 0, duration: 0.38 }, 4.72)
        .to(".fastgs-counter b", { textContent: 100, snap: { textContent: 1 }, duration: 1.22, ease: "power2.out" }, 4.78)
        .to(".field-use-cases", { opacity: 1, y: 0, duration: 0.5 }, 5.5)
        .to(cards[3], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 6.2)
        .to(".robotics-visual video", { scale: 1, filter: "brightness(.82) saturate(.76) blur(0px)", duration: 0.86 }, 6.34)
        .to(".robotics-route", { opacity: 1, scale: 1, duration: 0.54 }, 6.7)
        .to(".robotics-status", { opacity: 1, y: 0, duration: 0.44 }, 7.04)
        .to(cards[4], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 7.78)
        .to(".creative-visual img", { scale: 1, filter: "brightness(.78) saturate(.82) blur(0px)", duration: 0.86 }, 7.94)
        .to(".creative-brush", { opacity: 1, y: 0, duration: 0.42 }, 8.34)
        .to(".creative-result", { opacity: 1, y: 0, duration: 0.42 }, 8.62)
        .to(cards[5], { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: 0.72 }, 9.28)
        .to(".heritage-visual img", { scale: 1, filter: "brightness(.8) saturate(.72) blur(0px)", duration: 0.86 }, 9.44)
        .to(".heritage-sequence", { opacity: 1, y: 0, duration: 0.5 }, 9.94)
        .to(cards, { opacity: 1, scale: 1, duration: 0.46, stagger: 0.04 }, 10.62);

      animationRef.current = timeline;
      if (reducedMotion) {
        timeline.progress(1).pause();
        setState("complete");
      }
    }, section);

    return () => {
      animationRef.current = null;
      video?.pause();
      roboticsVideo?.pause();
      context.revert();
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.intersectionRatio >= 0.2;
      if (!activeRef.current) {
        videoRef.current?.pause();
        roboticsVideoRef.current?.pause();
      }
      const timeline = animationRef.current;
      if (activeRef.current && timeline && timeline.progress() <= 0.001 && !timeline.isActive()) {
        setState("playing");
        void videoRef.current?.play().catch(() => undefined);
        void roboticsVideoRef.current?.play().catch(() => undefined);
        timeline.play();
      }
    }, { threshold: [0, 0.2, 0.46, 0.7] });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const targetIsEditable = (target: EventTarget | null) => target instanceof HTMLElement
      && target.matches("button, input, textarea, select, [contenteditable='true']");

    const move = (direction: 1 | -1) => {
      const timeline = animationRef.current;
      if (!timeline) return false;
      if (direction === 1 && timeline.progress() < 0.999) {
        setState("playing");
        timeline.play();
        return true;
      }
      if (direction === -1 && timeline.progress() > 0.001) {
        setState("reversing");
        timeline.reverse();
        return true;
      }
      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " || !activeRef.current || targetIsEditable(event.target)) return;
      if (move(1)) {
        event.preventDefault();
        return;
      }
      if ((animationRef.current?.progress() ?? 0) >= 0.999) {
        event.preventDefault();
        document.getElementById("ending")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!activeRef.current || event.deltaY === 0) return;
      const timeline = animationRef.current;
      if (!timeline) return;
      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const canMove = direction === 1 ? timeline.progress() < 0.999 : timeline.progress() > 0.001;
      if (!canMove) return;
      event.preventDefault();
      if (timeline.isActive()) return;
      if (Math.sign(wheelTotalRef.current) !== Math.sign(event.deltaY)) wheelTotalRef.current = 0;
      wheelTotalRef.current += event.deltaY;
      if (Math.abs(wheelTotalRef.current) < 44) return;
      wheelTotalRef.current = 0;
      move(direction);
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
      document.getElementById("ending")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setState("playing");
      timeline.play();
    }
  };

  return (
    <section className="applications-finale" id="applications" ref={sectionRef} data-state={state} aria-label="Applications and future possibilities for Gaussian Splatting">
      <div className="applications-heading">
        <p>From representation to use</p>
        <h2>Record first.<br />Decide later.</h2>
      </div>

      <div className="applications-grid">
        {applications.map((application, index) => (
          <article className="application-card" key={application.label}>
            {index === 0 && <EverydayVisual />}
            {index === 1 && <CinemaVisual />}
            {index === 2 && <RapidFieldVisual videoRef={videoRef} />}
            {index === 3 && <RoboticsVisual videoRef={roboticsVideoRef} />}
            {index === 4 && <CreativeVisual />}
            {index === 5 && <HeritageVisual />}
            <div className="application-copy">
              <span>0{index + 1} · {application.label}</span>
              <h3>{application.title}</h3>
              <p>{application.body}</p>
              <small>{application.source}</small>
            </div>
          </article>
        ))}
      </div>

      <button className="applications-play-control" type="button" onClick={toggle} aria-label={`${state === "complete" ? "Continue from" : "Play"} the applications finale`}>
        <kbd>Space</kbd>
        <span>{state === "complete" ? "Continue to the final question" : state === "playing" ? "Playing automatically…" : state === "reversing" ? "Rewinding…" : "Autoplay on arrival"}</span>
      </button>
    </section>
  );
}
