"use client";

/* eslint-disable @next/next/no-img-element -- this is an authored full-bleed technical visual, not a content image */

import { useEffect, useRef } from "react";

const source = "/media/gaussian-hero/inria-bicycle-3dgs.avif";

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function GaussianFieldHero({ active }: { active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.decoding = "async";
    image.src = source;

    let disposed = false;
    let frame = 0;
    let pointer = 0;
    let splatLayer: HTMLCanvasElement | undefined;

    const drawCutaway = () => {
      if (!splatLayer || disposed) return;
      const width = canvas.width;
      const height = canvas.height;
      const split = width * (0.635 + pointer * 0.045);
      const feather = width * 0.095;

      context.clearRect(0, 0, width, height);
      context.drawImage(splatLayer, pointer * width * 0.008, 0);
      context.globalCompositeOperation = "destination-in";
      const mask = context.createLinearGradient(split - feather, 0, split + feather, 0);
      mask.addColorStop(0, "rgba(0,0,0,0)");
      mask.addColorStop(0.46, "rgba(0,0,0,.18)");
      mask.addColorStop(0.7, "rgba(0,0,0,.82)");
      mask.addColorStop(1, "rgba(0,0,0,1)");
      context.fillStyle = mask;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
    };

    const build = () => {
      if (!image.complete || image.naturalWidth === 0 || disposed) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      const width = Math.max(1, Math.round(host.clientWidth * ratio));
      const height = Math.max(1, Math.round(host.clientHeight * ratio));
      canvas.width = width;
      canvas.height = height;

      const sampler = document.createElement("canvas");
      sampler.width = width;
      sampler.height = height;
      const sampleContext = sampler.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return;

      const imageAspect = image.naturalWidth / image.naturalHeight;
      const canvasAspect = width / height;
      const drawWidth = imageAspect > canvasAspect ? height * imageAspect : width;
      const drawHeight = imageAspect > canvasAspect ? height : width / imageAspect;
      sampleContext.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      const pixels = sampleContext.getImageData(0, 0, width, height).data;

      splatLayer = document.createElement("canvas");
      splatLayer.width = width;
      splatLayer.height = height;
      const splatContext = splatLayer.getContext("2d");
      if (!splatContext) return;

      splatContext.fillStyle = "#030303";
      splatContext.fillRect(0, 0, width, height);

      const random = seededRandom(20230808);
      const spacing = Math.max(13, Math.round(width / 82));
      const columns = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;

      for (let row = -1; row < rows; row += 1) {
        for (let column = -1; column < columns; column += 1) {
          const x = column * spacing + (random() - 0.5) * spacing * 1.35;
          const y = row * spacing + (random() - 0.5) * spacing * 1.35;
          const sampleX = Math.max(0, Math.min(width - 1, Math.round(x)));
          const sampleY = Math.max(0, Math.min(height - 1, Math.round(y)));
          const pixel = (sampleY * width + sampleX) * 4;
          const red = pixels[pixel];
          const green = pixels[pixel + 1];
          const blue = pixels[pixel + 2];
          const brightness = (red + green + blue) / 765;
          const depth = Math.max(0, x / width - 0.5) / 0.5;
          const radiusX = spacing * (0.7 + random() * 1.05 + depth * 0.55);
          const radiusY = spacing * (0.18 + random() * 0.35);
          const opacity = 0.58 + brightness * 0.26 + random() * 0.12;

          splatContext.save();
          splatContext.translate(x, y);
          splatContext.rotate((random() - 0.5) * Math.PI * 1.65);
          splatContext.scale(radiusX, radiusY);
          const gaussian = splatContext.createRadialGradient(0, 0, 0, 0, 0, 1);
          gaussian.addColorStop(0, `rgba(${red},${green},${blue},${opacity})`);
          gaussian.addColorStop(0.55, `rgba(${red},${green},${blue},${opacity * 0.68})`);
          gaussian.addColorStop(1, `rgba(${red},${green},${blue},0)`);
          splatContext.fillStyle = gaussian;
          splatContext.beginPath();
          splatContext.arc(0, 0, 1, 0, Math.PI * 2);
          splatContext.fill();
          splatContext.restore();
        }
      }

      drawCutaway();
    };

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    });
    resizeObserver.observe(host);

    const onPointerMove = (event: PointerEvent) => {
      if (!active) return;
      const bounds = host.getBoundingClientRect();
      pointer = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      host.style.setProperty("--hero-shift-x", `${pointer * -0.65}%`);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(drawCutaway);
    };

    const onPointerLeave = () => {
      pointer = 0;
      host.style.setProperty("--hero-shift-x", "0%");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(drawCutaway);
    };

    image.addEventListener("load", build);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    if (image.complete) build();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      image.removeEventListener("load", build);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [active]);

  return (
    <div className={`gaussian-field-hero ${active ? "is-active" : ""}`} ref={hostRef}>
      <img src={source} alt="Official Inria 3D Gaussian Splatting reconstruction of the bicycle scene" />
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="gaussian-cutaway-labels" aria-hidden="true">
        <span>Rendered view</span>
        <span>Gaussian field</span>
      </div>
    </div>
  );
}
