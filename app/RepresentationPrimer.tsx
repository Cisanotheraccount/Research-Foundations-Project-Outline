"use client";

/* eslint-disable @next/next/no-img-element -- these are the user's own exact capture frames */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { keyboardTargetIsInteractive, sectionOwnsViewportCenter, spatialKeyDirection } from "./spatialKeyboard";

type PrimerState = "idle" | "playing" | "ready" | "complete" | "reversing";

const stepLabels = ["step-01", "step-02", "step-03"] as const;

const captureFrames = [
  "/media/record-evolution/continental-rooftop-view-01.jpg",
  "/media/record-evolution/continental-rooftop-view-02.jpg",
  "/media/record-evolution/continental-rooftop-view-03.jpg",
] as const;

const methods = [
  {
    id: "photogrammetry",
    index: "01",
    name: "Photogrammetry",
    formula: "Photos → mesh → texture",
    title: "A surface is reconstructed.",
    detail: "Geometry first. Image detail is projected back onto the mesh.",
  },
  {
    id: "nerf",
    index: "02",
    name: "NeRF",
    formula: "Photos → neural network → rendered image",
    title: "A view is predicted.",
    detail: "The scene lives inside a neural function, sampled along camera rays.",
  },
  {
    id: "gaussian",
    index: "03",
    name: "Gaussian Splatting",
    formula: "Photos → millions of Gaussians → rendered image",
    title: "The scene becomes explicit.",
    detail: "Oriented, translucent ellipsoids are projected directly to the screen.",
  },
] as const;

function PhotoStack() {
  return (
    <div className="primer-photo-stack" aria-label="The same three rooftop photographs used as input">
      {captureFrames.map((source, index) => (
        <figure key={source}>
          <img src={source} alt={`Rooftop capture photograph ${index + 1}`} />
        </figure>
      ))}
      <span>Photos</span>
    </div>
  );
}

function MeshDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const relief = [
      [0.02, -0.01, -0.04, -0.02, 0.01, 0.035],
      [0.03, -0.015, -0.1, -0.07, -0.015, 0.025],
      [0.04, 0.005, -0.06, -0.11, -0.035, 0.03],
      [0.02, -0.015, -0.025, -0.045, 0.005, 0.035],
    ];

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#111315");
      background.addColorStop(1, "#050607");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const rows = relief.length;
      const columns = relief[0].length;
      const points = relief.map((row, rowIndex) => {
        const depth = rowIndex / (rows - 1);
        const planeWidth = width * (0.58 + depth * 0.36);
        const centerX = width * (0.48 + depth * 0.02);
        return row.map((lift, columnIndex) => ({
          x: centerX + (columnIndex / (columns - 1) - 0.5) * planeWidth,
          y: height * (0.18 + depth * 0.67 + lift),
        }));
      });

      const paintFace = (vertices: Array<{ x: number; y: number }>, shade: number) => {
        context.beginPath();
        context.moveTo(vertices[0].x, vertices[0].y);
        vertices.slice(1).forEach((vertex) => context.lineTo(vertex.x, vertex.y));
        context.closePath();
        context.fillStyle = `hsl(195 7% ${shade}%)`;
        context.fill();
        context.strokeStyle = "rgba(226,232,234,.72)";
        context.lineWidth = 0.85;
        context.stroke();
      };

      for (let row = 0; row < rows - 1; row += 1) {
        for (let column = 0; column < columns - 1; column += 1) {
          const topLeft = points[row][column];
          const topRight = points[row][column + 1];
          const bottomLeft = points[row + 1][column];
          const bottomRight = points[row + 1][column + 1];
          const baseShade = 22 + row * 5 + ((column * 7) % 13);
          if ((row + column) % 2 === 0) {
            paintFace([topLeft, topRight, bottomRight], baseShade + 8);
            paintFace([topLeft, bottomRight, bottomLeft], baseShade);
          } else {
            paintFace([topLeft, topRight, bottomLeft], baseShade);
            paintFace([topRight, bottomRight, bottomLeft], baseShade + 8);
          }
        }
      }

      context.fillStyle = "#f5f5f7";
      points.flat().forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 1.65, 0, Math.PI * 2);
        context.fill();
      });
    };

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    draw();
    return () => resizeObserver.disconnect();
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

function MeshRepresentation() {
  return (
    <div className="primer-representation primer-mesh" aria-label="A triangular mesh made from vertices, edges, and faces">
      <div className="primer-mesh-specimen">
        <MeshDiagram />
      </div>
      <div className="primer-mesh-anatomy" aria-hidden="true">
        <span><i className="mesh-vertex" />Vertices</span>
        <span><i className="mesh-edge" />Edges</span>
        <span><i className="mesh-face" />Faces</span>
      </div>
      <span>Triangular mesh</span>
    </div>
  );
}

function NeuralRepresentation() {
  return (
    <div className="primer-representation primer-network" aria-label="A neural network representing a NeRF scene">
      <div className="network-rays" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      {[4, 6, 6, 4].map((count, layerIndex) => (
        <div className="network-layer" key={layerIndex}>
          {Array.from({ length: count }, (_, nodeIndex) => <i key={nodeIndex} />)}
        </div>
      ))}
      <span>Neural network</span>
    </div>
  );
}

function GaussianRepresentation() {
  const splats = Array.from({ length: 42 }, (_, index) => {
    const x = 7 + ((index * 29) % 88);
    const y = 8 + ((index * 47) % 78);
    const width = 13 + ((index * 11) % 24);
    const height = 5 + ((index * 7) % 10);
    const rotation = -72 + ((index * 37) % 144);
    const opacity = 0.28 + ((index * 13) % 52) / 100;
    const tone = index % 4;
    return { x, y, width, height, rotation, opacity, tone };
  });

  return (
    <div className="primer-representation primer-gaussians" aria-label="Many anisotropic Gaussian ellipsoids representing a scene">
      <img src={captureFrames[0]} alt="The rooftop beneath a conceptual field of anisotropic Gaussian ellipsoids" />
      <div className="primer-splat-field" aria-hidden="true">
        {splats.map((splat, index) => (
          <i
            key={index}
            data-tone={splat.tone}
            style={{
              "--splat-x": `${splat.x}%`,
              "--splat-y": `${splat.y}%`,
              "--splat-width": `${splat.width}px`,
              "--splat-height": `${splat.height}px`,
              "--splat-rotation": `${splat.rotation}deg`,
              "--splat-opacity": splat.opacity,
            } as CSSProperties}
          />
        ))}
      </div>
      <span>Millions of Gaussians</span>
    </div>
  );
}

function RenderedResult({ type }: { type: "texture" | "render" | "gaussian" }) {
  const isGaussian = type === "gaussian";

  return (
    <figure className={`primer-result primer-result-${type}`}>
      <img
        src={isGaussian ? "/media/representation-primer/gaussian-rendered-image.png" : captureFrames[1]}
        alt={
          type === "texture"
            ? "A textured rooftop surface model"
            : isGaussian
              ? "A Gaussian Splatting rendered spatial field supplied by the presenter"
              : "A rendered rooftop image"
        }
      />
      <figcaption>{type === "texture" ? "Mesh + texture" : "Rendered image"}</figcaption>
    </figure>
  );
}

export function RepresentationPrimer() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const stepTweenRef = useRef<gsap.core.Tween | null>(null);
  const activeRef = useRef(false);
  const currentStepRef = useRef(-1);
  const transitionRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const wheelTotalRef = useRef(0);
  const [state, setState] = useState<PrimerState>("idle");
  const [activeStep, setActiveStep] = useState(-1);

  const goToStep = useCallback((targetStep: number) => {
    const timeline = timelineRef.current;
    if (!timeline || transitionRef.current || targetStep < 0 || targetStep >= stepLabels.length) return false;

    const previousStep = currentStepRef.current;
    const settle = () => {
      currentStepRef.current = targetStep;
      transitionRef.current = false;
      stepTweenRef.current = null;
      setActiveStep(targetStep);
      setState(targetStep === stepLabels.length - 1 ? "complete" : "ready");
    };

    transitionRef.current = true;
    setState(targetStep < previousStep ? "reversing" : "playing");
    setActiveStep(targetStep);

    if (reducedMotionRef.current) {
      timeline.seek(stepLabels[targetStep]).pause();
      settle();
      return true;
    }

    stepTweenRef.current = timeline.tweenTo(stepLabels[targetStep], {
      ease: "power3.inOut",
      onComplete: settle,
    });
    return true;
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedMotionRef.current = reducedMotion;

    const context = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".primer-method");
      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.inOut" },
      });
      timeline.timeScale(0.78);

      gsap.set(rows, { opacity: 0.14, y: 28, filter: "blur(7px)" });
      gsap.set(".primer-photo-stack figure", { opacity: 0, x: -22, rotationY: -10 });
      gsap.set(".primer-flow", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".primer-representation", { opacity: 0, scale: 0.84, filter: "blur(7px)" });
      gsap.set(".primer-result", { opacity: 0, x: 24, scale: 0.9, filter: "blur(7px)" });
      gsap.set(".primer-method-copy > *", { opacity: 0, y: 10 });
      gsap.set(".network-layer i", { scale: 0, opacity: 0 });
      gsap.set(".network-rays i", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".primer-splat-field i", { scale: 0, opacity: 0 });

      rows.forEach((row, index) => {
        const start = 0.28 + index * 2.32;
        const selector = `.primer-method[data-method="${methods[index].id}"]`;
        timeline
          .to(row, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.58 }, start)
          .to(`${selector} .primer-method-copy > *`, { opacity: 1, y: 0, duration: 0.42, stagger: 0.08 }, start + 0.08)
          .to(`${selector} .primer-photo-stack figure`, { opacity: 1, x: 0, rotationY: 0, duration: 0.5, stagger: 0.1 }, start + 0.18)
          .to(`${selector} .primer-flow-first`, { scaleX: 1, duration: 0.42 }, start + 0.54)
          .to(`${selector} .primer-representation`, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.62 }, start + 0.72)
          .to(`${selector} .primer-flow-second`, { scaleX: 1, duration: 0.42 }, start + 1.16)
          .to(`${selector} .primer-result`, { opacity: 1, x: 0, scale: 1, filter: "blur(0px)", duration: 0.62 }, start + 1.34);

        if (index === 1) {
          timeline
            .to(`${selector} .network-layer i`, { scale: 1, opacity: 1, duration: 0.35, stagger: 0.018 }, start + 0.82)
            .to(`${selector} .network-rays i`, { scaleX: 1, duration: 0.46, stagger: 0.05 }, start + 1.02);
        }
        if (index === 2) {
          timeline.to(`${selector} .primer-splat-field i`, { scale: 1, opacity: (itemIndex) => splatOpacity(itemIndex), duration: 0.42, stagger: 0.012 }, start + 0.82);
        }
        if (index < rows.length - 1) {
          timeline.addLabel(stepLabels[index], start + 2.04);
          timeline.to(row, { opacity: 0.34, duration: 0.4 }, start + 2.32);
        }
      });

      timeline
        .to(rows, { opacity: 1, filter: "blur(0px)", duration: 0.58, stagger: 0.08 }, 7.24)
        .to(".primer-method", { borderColor: "rgba(255,255,255,.24)", duration: 0.5, stagger: 0.08 }, 7.36);
      timeline.addLabel(stepLabels[2], timeline.duration() + 0.04);

      timelineRef.current = timeline;
    }, section);

    return () => {
      stepTweenRef.current?.kill();
      stepTweenRef.current = null;
      transitionRef.current = false;
      timelineRef.current = null;
      context.revert();
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(() => {
      activeRef.current = sectionOwnsViewportCenter(section);
      if (activeRef.current && currentStepRef.current === -1 && !transitionRef.current) {
        goToStep(0);
      }
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.75] });
    observer.observe(section);
    return () => observer.disconnect();
  }, [goToStep]);

  useEffect(() => {
    const move = (direction: 1 | -1) => goToStep(currentStepRef.current + direction);
    const continueToStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const returnToOpening = () => document.getElementById("opening-gaussian")?.scrollIntoView({ behavior: "smooth", block: "start" });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!sectionOwnsViewportCenter(sectionRef.current) || keyboardTargetIsInteractive(event.target)) return;
      const direction = spatialKeyDirection(event);
      if (direction === 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat || transitionRef.current) return;
      if (move(direction)) {
        wheelTotalRef.current = 0;
        return;
      }
      if (direction === 1 && currentStepRef.current === stepLabels.length - 1) {
        continueToStory();
      } else if (direction === -1 && currentStepRef.current === 0) {
        returnToOpening();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!activeRef.current || event.deltaY === 0) return;
      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const currentStep = currentStepRef.current;
      const canMove = direction === 1 ? currentStep < stepLabels.length - 1 : currentStep > 0;
      const canContinue = direction === 1 && currentStep === stepLabels.length - 1;
      if (!canMove && !canContinue) return;

      event.preventDefault();
      if (transitionRef.current) return;
      if (Math.sign(wheelTotalRef.current) !== Math.sign(event.deltaY)) wheelTotalRef.current = 0;
      wheelTotalRef.current += event.deltaY;
      if (Math.abs(wheelTotalRef.current) < 56) return;
      wheelTotalRef.current = 0;

      if (canMove) {
        move(direction);
      } else if (canContinue) {
        continueToStory();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [goToStep]);

  const advance = () => {
    if (transitionRef.current) return;
    if (goToStep(currentStepRef.current + 1)) {
      wheelTotalRef.current = 0;
      return;
    }
    if (currentStepRef.current === stepLabels.length - 1) {
      document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const controlText = state === "playing"
    ? `Revealing ${methods[Math.max(activeStep, 0)].index}…`
    : state === "reversing"
      ? `Returning to ${methods[Math.max(activeStep, 0)].index}…`
      : activeStep < 0
        ? "01 plays on arrival"
        : activeStep < methods.length - 1
          ? `Continue to ${methods[activeStep + 1].index}`
          : "Continue to Photo";

  return (
    <section className="representation-primer" id="representations" ref={sectionRef} data-state={state} aria-labelledby="representation-primer-title">
      <header className="primer-heading">
        <div>
          <p>Before the image appears</p>
          <h2 id="representation-primer-title">Same photographs.<br />Three representations.</h2>
        </div>
        <span>The camera input can be similar. What changes is how the scene exists inside the computer.</span>
      </header>

      <div className="primer-methods">
        {methods.map((method) => (
          <article className="primer-method" data-method={method.id} key={method.id}>
            <div className="primer-method-copy">
              <h3><i>{method.index}</i>{method.name}</h3>
              <p><b>{method.title}</b> {method.detail}</p>
              <small>{method.formula}</small>
            </div>
            <PhotoStack />
            <i className="primer-flow primer-flow-first" aria-hidden="true" />
            {method.id === "photogrammetry" && <MeshRepresentation />}
            {method.id === "nerf" && <NeuralRepresentation />}
            {method.id === "gaussian" && <GaussianRepresentation />}
            <i className="primer-flow primer-flow-second" aria-hidden="true" />
            <RenderedResult
              type={method.id === "photogrammetry" ? "texture" : method.id === "gaussian" ? "gaussian" : "render"}
            />
          </article>
        ))}
      </div>

      <button className="primer-play-control" type="button" onClick={advance} aria-label="Advance the representation comparison one method at a time">
        <kbd>Space</kbd>
        <span>{controlText}</span>
      </button>
    </section>
  );
}

function splatOpacity(index: number) {
  return 0.28 + ((index * 13) % 52) / 100;
}
