"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec3 vLocalPosition;

  void main() {
    vLocalPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vLocalPosition;
  uniform vec3 uCameraLocal;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  void main() {
    vec3 rayOrigin = uCameraLocal;
    vec3 rayDirection = normalize(vLocalPosition - rayOrigin);

    float b = dot(rayOrigin, rayDirection);
    float c = dot(rayOrigin, rayOrigin) - 1.0;
    float discriminant = b * b - c;
    if (discriminant <= 0.0) discard;

    float root = sqrt(discriminant);
    float nearT = max(-b - root, 0.0);
    float farT = -b + root;
    float rayLength = max(farT - nearT, 0.0);

    float accumulatedAlpha = 0.0;
    vec3 accumulatedColor = vec3(0.0);
    const int STEPS = 48;

    for (int i = 0; i < STEPS; i++) {
      float unitT = (float(i) + 0.5) / float(STEPS);
      vec3 samplePosition = rayOrigin + rayDirection * (nearT + unitT * rayLength);

      // A normalized 3D Gaussian. The mesh scale and rotation transform this
      // isotropic local density into the anisotropic covariance ellipsoid.
      float density = exp(-3.2 * dot(samplePosition, samplePosition));
      float stepAlpha = 1.0 - exp(-density * uOpacity * rayLength / float(STEPS));
      vec3 sampleColor = mix(uColorA, uColorB, samplePosition.x * 0.32 + 0.5);

      accumulatedColor += (1.0 - accumulatedAlpha) * stepAlpha * sampleColor;
      accumulatedAlpha += (1.0 - accumulatedAlpha) * stepAlpha;
    }

    float edgeFade = smoothstep(0.0, 0.08, discriminant);
    accumulatedAlpha *= edgeFade;
    if (accumulatedAlpha < 0.004) discard;

    gl_FragColor = vec4(accumulatedColor / max(accumulatedAlpha, 0.0001), accumulatedAlpha);
  }
`;

export function GaussianPrimitiveWebGL() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
    camera.position.set(0, 0, 6.65);

    const gaussian = new THREE.Group();
    gaussian.rotation.set(-0.24, -0.48, -0.18);
    scene.add(gaussian);

    const uniforms = {
      uCameraLocal: { value: new THREE.Vector3() },
      uColorA: { value: new THREE.Color("#79b9cf") },
      uColorB: { value: new THREE.Color("#f2fbff") },
      uOpacity: { value: 2.55 },
    };

    const geometry = new THREE.SphereGeometry(1, 72, 52);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
    });
    const volume = new THREE.Mesh(geometry, material);
    volume.scale.set(2.32, 0.92, 1.3);
    gaussian.add(volume);

    const centerGeometry = new THREE.SphereGeometry(0.035, 18, 12);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xf6fbff, transparent: true, opacity: 0.82 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    gaussian.add(center);

    const cameraInLocalSpace = new THREE.Vector3();
    const inverseWorld = new THREE.Matrix4();
    const timer = new THREE.Timer();
    timer.connect(document);
    const targetRotation = new THREE.Vector2(gaussian.rotation.x, gaussian.rotation.y);
    let isVisible = true;
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    visibilityObserver.observe(mount);

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      mount.dataset.dragging = "true";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      targetRotation.y += (event.clientX - previousX) * 0.008;
      targetRotation.x += (event.clientY - previousY) * 0.006;
      targetRotation.x = THREE.MathUtils.clamp(targetRotation.x, -0.85, 0.45);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      isDragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      delete mount.dataset.dragging;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    renderer.setAnimationLoop((timestamp) => {
      if (!isVisible) return;
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      if (!reduceMotion && !isDragging) {
        targetRotation.y = -0.48 + Math.sin(elapsed * 0.34) * 0.42;
        targetRotation.x = -0.24 + Math.sin(elapsed * 0.23) * 0.08;
      }
      gaussian.rotation.x = THREE.MathUtils.lerp(gaussian.rotation.x, targetRotation.x, 0.055);
      gaussian.rotation.y = THREE.MathUtils.lerp(gaussian.rotation.y, targetRotation.y, 0.055);
      if (!reduceMotion) gaussian.rotation.z = -0.18 + Math.sin(elapsed * 0.19) * 0.08;

      scene.updateMatrixWorld(true);
      inverseWorld.copy(volume.matrixWorld).invert();
      cameraInLocalSpace.copy(camera.position).applyMatrix4(inverseWorld);
      uniforms.uCameraLocal.value.copy(cameraInLocalSpace);
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      geometry.dispose();
      material.dispose();
      centerGeometry.dispose();
      centerMaterial.dispose();
      timer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="gaussian-webgl"
      role="img"
      aria-label="Interactive WebGL visualization of one anisotropic 3D Gaussian with soft volumetric density"
    />
  );
}
