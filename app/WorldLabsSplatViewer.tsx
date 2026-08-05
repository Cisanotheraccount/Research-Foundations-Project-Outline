"use client";

/* eslint-disable @next/next/no-img-element -- the official fallback image must stay paired with the WebGL canvas */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const splatUrl = "/media/world-labs/ancient-stone-crypt-500k.spz";

export function WorldLabsSplatViewer({ active }: { active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let spark: SparkRenderer | undefined;
    let splat: SplatMesh | undefined;
    let controls: OrbitControls | undefined;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute("aria-label", "Interactive World Labs Marble Gaussian splat. Drag to orbit.");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.01, 1000);
      camera.position.set(0, 0.15, 3.2);

      spark = new SparkRenderer({ renderer });
      scene.add(spark);

      splat = new SplatMesh({
        url: splatUrl,
        onProgress: (event) => {
          if (event.lengthComputable && event.loaded >= event.total && !disposed) setLoaded(true);
        },
      });
      // Spark's splat coordinate convention is Y/Z-flipped relative to Three.js.
      splat.quaternion.set(1, 0, 0, 0);
      scene.add(splat);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.rotateSpeed = 0.18;
      controls.minPolarAngle = Math.PI * 0.2;
      controls.maxPolarAngle = Math.PI * 0.8;
      controls.minAzimuthAngle = -0.42;
      controls.maxAzimuthAngle = 0.42;

      void splat.initialized.then(() => {
        if (disposed || !splat || !controls) return;
        const bounds = splat.getBoundingBox(true);
        const size = bounds.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z, 0.1);
        // Marble's public exports retain the prompt camera close to the local
        // origin. Starting there reproduces the authored interior view; a
        // bounding-box fit would place the camera inside a wall of the room.
        controls.target.set(0, -0.12, -3.2);
        camera.near = Math.max(radius / 2500, 0.005);
        camera.far = radius * 15;
        camera.position.set(0, 0.12, 0.08);
        camera.updateProjectionMatrix();
        controls.minDistance = 2.15;
        controls.maxDistance = 5.8;
        controls.update();
        setLoaded(true);
      }).catch(() => {
        if (!disposed) setFailed(true);
      });

      const resize = () => {
        if (!renderer) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const render = () => {
        if (disposed) return;
        controls?.update();
        if (activeRef.current) renderer?.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        controls?.dispose();
        splat?.dispose();
        spark?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      queueMicrotask(() => setFailed(true));
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        controls?.dispose();
        splat?.dispose();
        spark?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }
  }, []);

  return (
    <div className={`worldlabs-viewer ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""}`} ref={hostRef} data-interactive-world>
      <img src="/media/world-labs/ancient-stone-crypt-thumbnail.webp" alt="World Labs Marble ancient stone crypt Gaussian splat preview" />
      <div className="worldlabs-loading" aria-live="polite">{failed ? "Interactive view unavailable" : loaded ? "Drag to explore" : "Loading interactive field…"}</div>
      <a href="https://marble.worldlabs.ai/world/94fdf9de-939f-4d52-abe4-b09c1aafa1a6" target="_blank" rel="noreferrer">Open original ↗</a>
    </div>
  );
}
