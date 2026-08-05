"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ApplicationsFinale } from "./ApplicationsFinale";
import { ContinentalCameraPathHero } from "./ContinentalCameraPathHero";
import { EndingQuestion } from "./EndingQuestion";
import { RecordEvolution } from "./RecordEvolution";
import { LinearProgress } from "./LinearProgress";
import { OriginsTimeline } from "./OriginsTimeline";
import { RepresentationPrimer } from "./RepresentationPrimer";

type Motion = "idle" | "flatten" | "unfold" | "compare";

type RoomBuild = {
  group: THREE.Group;
  solidMaterials: THREE.MeshStandardMaterial[];
};

const copy = [
  {
    eyebrow: "3D space · 4D world",
    title: "we are living in a 3D space and a 4D world",
    detail: "The room in front of you is real geometry—not a photograph.",
  },
  {
    eyebrow: "A flat record",
    title: <>We preserved<br />the place as a surface.</>,
    detail: "The image was rendered from the same spatial scene.",
  },
  {
    eyebrow: "An ordinary camera",
    title: <>A surface becomes<br />a field again.</>,
    detail: "Depth returns behind the moving camera path.",
  },
  {
    eyebrow: "A spatial field",
    title: <>Gaussian<br />Splatting</>,
    detail: "Not a flat image. A field you can enter and explore.",
  },
] as const;

const openingIds = ["opening-space", "opening-flat", "opening-field", "opening-gaussian"] as const;

function easeInOutQuint(value: number) {
  return value < 0.5 ? 16 * value ** 5 : 1 - ((-2 * value + 2) ** 5) / 2;
}

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4;
}

function makeMaterial(color: number, roughness = 0.72, metalness = 0.02) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, transparent: true });
  material.userData.baseOpacity = 1;
  return material;
}

function addRoundedBox(
  parent: THREE.Object3D,
  materials: THREE.MeshStandardMaterial[],
  size: [number, number, number],
  position: [number, number, number],
  color: number,
  radius = 0.08,
  roughness = 0.72,
  metalness = 0.02,
) {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, ...size.map((value) => value / 2.1)));
  const material = makeMaterial(color, roughness, metalness);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  materials.push(material);
  return mesh;
}

function makeWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#d9e0e2");
  sky.addColorStop(0.52, "#aeb9b2");
  sky.addColorStop(1, "#59635d");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(30, 43, 36, .78)";
  for (let index = 0; index < 32; index += 1) {
    const x = (index * 83) % canvas.width;
    const radius = 40 + ((index * 29) % 78);
    context.beginPath();
    context.arc(x, 420 - ((index * 17) % 85), radius, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "rgba(255,255,255,.22)";
  context.fillRect(0, 0, canvas.width, 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function buildRoom(): RoomBuild {
  const group = new THREE.Group();
  group.name = "real-three-dimensional-room";
  group.position.z = -3.6;
  const materials: THREE.MeshStandardMaterial[] = [];

  addRoundedBox(group, materials, [12, 0.18, 10], [0, -0.12, 0], 0x8b8378, 0.04, 0.88);
  addRoundedBox(group, materials, [12, 0.12, 10], [0, 5.7, 0], 0xd8d4cb, 0.03, 0.84);
  addRoundedBox(group, materials, [2.8, 5.8, 0.16], [-4.6, 2.8, -5], 0xb9b3a9, 0.03, 0.86);
  addRoundedBox(group, materials, [2.8, 5.8, 0.16], [4.6, 2.8, -5], 0xb5aea4, 0.03, 0.86);
  addRoundedBox(group, materials, [6.4, 1.35, 0.16], [0, 5.05, -5], 0xc9c4bb, 0.03, 0.86);
  addRoundedBox(group, materials, [6.4, 0.9, 0.16], [0, 0.42, -5], 0xb7b0a5, 0.03, 0.86);
  addRoundedBox(group, materials, [0.12, 5.7, 5.3], [-6, 2.8, -2.35], 0xbdb7ad, 0.02, 0.88);

  const windowMaterial = new THREE.MeshBasicMaterial({ map: makeWindowTexture(), toneMapped: false });
  const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.15, 3.75), windowMaterial);
  windowMesh.position.set(0, 2.9, -4.9);
  group.add(windowMesh);

  const frameColor = 0x222326;
  addRoundedBox(group, materials, [6.35, 0.09, 0.12], [0, 4.8, -4.82], frameColor, 0.02, 0.35, 0.35);
  addRoundedBox(group, materials, [6.35, 0.09, 0.12], [0, 1.02, -4.82], frameColor, 0.02, 0.35, 0.35);
  [-3.12, -1.04, 1.04, 3.12].forEach((x) => addRoundedBox(group, materials, [0.08, 3.88, 0.12], [x, 2.91, -4.82], frameColor, 0.02, 0.35, 0.35));

  addRoundedBox(group, materials, [6.1, 0.07, 3.3], [0.6, 0.01, 0.35], 0x5e5a55, 0.03, 0.98);

  const sofa = new THREE.Group();
  sofa.position.set(2.2, 0, -1.5);
  group.add(sofa);
  const sofaColor = 0x77746f;
  addRoundedBox(sofa, materials, [4.7, 0.52, 1.6], [0, 0.46, 0], sofaColor, 0.17, 0.94);
  addRoundedBox(sofa, materials, [4.55, 1.12, 0.42], [0, 1.16, -0.57], 0x6e6b67, 0.14, 0.96);
  addRoundedBox(sofa, materials, [0.38, 0.78, 1.62], [-2.18, 0.72, 0], 0x6b6965, 0.14, 0.95);
  addRoundedBox(sofa, materials, [0.38, 0.78, 1.62], [2.18, 0.72, 0], 0x6b6965, 0.14, 0.95);
  [-1.53, -0.52, 0.52, 1.53].forEach((x, index) => {
    addRoundedBox(sofa, materials, [0.92, 0.2, 1.25], [x, 0.82, 0.08], index % 2 ? 0x84817b : 0x7c7973, 0.13, 0.96);
    const cushion = addRoundedBox(sofa, materials, [0.86, 0.76, 0.2], [x, 1.26, -0.34], index % 2 ? 0x7f7b76 : 0x89857e, 0.14, 0.98);
    cushion.rotation.x = -0.08;
  });
  addRoundedBox(sofa, materials, [1.65, 0.38, 2.15], [1.5, 0.4, 1.35], 0x74716c, 0.15, 0.96);

  const table = new THREE.Group();
  table.position.set(-0.2, 0, 0.55);
  group.add(table);
  addRoundedBox(table, materials, [2.4, 0.16, 1.28], [0, 0.72, 0], 0x252526, 0.06, 0.46, 0.18);
  [-0.92, 0.92].forEach((x) => [-0.42, 0.42].forEach((z) => addRoundedBox(table, materials, [0.1, 0.7, 0.1], [x, 0.35, z], 0x2a2a2b, 0.025, 0.46, 0.22)));
  addRoundedBox(table, materials, [0.26, 0.22, 0.26], [-0.25, 0.91, 0], 0xb2aca1, 0.08, 0.82);

  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-3.85, 0, -3.95);
  group.add(consoleGroup);
  addRoundedBox(consoleGroup, materials, [3.3, 0.58, 0.72], [0, 0.42, 0], 0x494744, 0.05, 0.68);
  addRoundedBox(consoleGroup, materials, [2.75, 1.72, 0.09], [0, 2.05, -0.38], 0x121214, 0.035, 0.32, 0.16);

  const shelves = new THREE.Group();
  shelves.position.set(4.7, 0, -4.6);
  group.add(shelves);
  [-0.56, 0.1, 0.76, 1.42, 2.08].forEach((y) => addRoundedBox(shelves, materials, [1.55, 0.08, 0.48], [0, y + 1.2, 0], 0x5b5650, 0.025, 0.72));
  [-0.72, 0.72].forEach((x) => addRoundedBox(shelves, materials, [0.08, 3.4, 0.5], [x, 2.15, 0], 0x514d48, 0.02, 0.72));
  for (let index = 0; index < 12; index += 1) {
    addRoundedBox(shelves, materials, [0.1 + (index % 3) * 0.03, 0.36 + (index % 4) * 0.07, 0.24], [-0.55 + (index % 6) * 0.21, 0.96 + Math.floor(index / 6) * 0.66, -0.02], index % 2 ? 0x8b8175 : 0x6e6b65, 0.02, 0.88);
  }

  const plant = new THREE.Group();
  plant.position.set(-4.8, 0, -4.3);
  group.add(plant);
  const pot = addRoundedBox(plant, materials, [0.62, 0.58, 0.62], [0, 0.3, 0], 0x504941, 0.14, 0.86);
  pot.rotation.y = Math.PI / 4;
  const stemMaterial = makeMaterial(0x384238, 0.9);
  materials.push(stemMaterial);
  for (let index = 0; index < 14; index += 1) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 1.25 + (index % 5) * 0.2, 7), stemMaterial);
    stem.position.set(((index * 17) % 10) * 0.035 - 0.16, 1.0, ((index * 23) % 10) * 0.03 - 0.14);
    stem.rotation.z = -0.24 + (index % 7) * 0.08;
    stem.castShadow = true;
    plant.add(stem);
    const leafMaterial = makeMaterial(index % 2 ? 0x465348 : 0x536057, 0.96);
    materials.push(leafMaterial);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), leafMaterial);
    leaf.scale.set(1.6, 0.32, 0.72);
    leaf.position.copy(stem.position).add(new THREE.Vector3(Math.sin(index) * 0.34, 0.72 + (index % 4) * 0.18, Math.cos(index) * 0.24));
    leaf.rotation.z = (index * 0.41) % Math.PI;
    leaf.castShadow = true;
    plant.add(leaf);
  }

  const lamp = new THREE.Group();
  lamp.position.set(5.15, 0, -1.1);
  group.add(lamp);
  addRoundedBox(lamp, materials, [0.42, 0.08, 0.42], [0, 0.05, 0], 0x303031, 0.04, 0.42, 0.28);
  addRoundedBox(lamp, materials, [0.045, 3.2, 0.045], [0, 1.65, 0], 0x555557, 0.02, 0.34, 0.52);
  const shadeMaterial = makeMaterial(0xd8d0c4, 0.88);
  shadeMaterial.emissive.setHex(0x332c22);
  shadeMaterial.emissiveIntensity = 0.8;
  materials.push(shadeMaterial);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.54, 0.72, 24, 1, true), shadeMaterial);
  shade.position.y = 3.18;
  lamp.add(shade);

  const artColors = [0x323638, 0x6a625b, 0x4f5655];
  [-4.75, 4.4].forEach((x, index) => {
    addRoundedBox(group, materials, [1.1, 1.5, 0.07], [x, 3.25, -4.75], 0x252526, 0.03, 0.5);
    addRoundedBox(group, materials, [0.86, 1.25, 0.075], [x, 3.25, -4.7], artColors[index], 0.02, 0.84);
  });

  return { group, solidMaterials: materials };
}

function setMaterialOpacity(materials: THREE.Material[], opacity: number) {
  materials.forEach((material) => {
    material.transparent = opacity < 0.999;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.65;
  });
}

function buildRepresentations(room: THREE.Group) {
  room.updateMatrixWorld(true);
  const pointsGroup = new THREE.Group();
  const wireGroup = new THREE.Group();
  const pointsMaterial = new THREE.PointsMaterial({ color: 0xd8dce0, size: 0.038, transparent: true, opacity: 0, sizeAttenuation: true });
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0xbfc3c7, transparent: true, opacity: 0 });
  const centers: number[] = [];
  const scales: number[] = [];
  const rotations: number[] = [];
  const colors: number[] = [];
  const opacities: number[] = [];
  let seed = 0x4d595df4;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const sampled = new THREE.Vector3();

  room.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !(object.geometry instanceof THREE.BufferGeometry)) return;
    const transformed = object.geometry.clone();
    transformed.applyMatrix4(object.matrixWorld);
    const position = transformed.getAttribute("position");
    if (!position) return;

    const points = new THREE.Points(transformed.clone(), pointsMaterial);
    pointsGroup.add(points);
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(transformed), wireMaterial);
    wireGroup.add(wire);

    const indexAttribute = transformed.getIndex();
    const triangleCount = Math.max(1, Math.floor((indexAttribute?.count ?? position.count) / 3));
    const triangleAreas: number[] = [];
    let totalArea = 0;
    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      const getVertex = (corner: number) => indexAttribute
        ? indexAttribute.getX(triangleIndex * 3 + corner)
        : triangleIndex * 3 + corner;
      a.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(0));
      b.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(1));
      c.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(2));
      edgeAB.copy(b).sub(a);
      edgeAC.copy(c).sub(a);
      totalArea += cross.crossVectors(edgeAB, edgeAC).length() * 0.5;
      triangleAreas.push(totalArea);
    }
    const sampleCount = Math.min(2200, Math.max(36, Math.ceil(totalArea * 60)));
    const footprint = THREE.MathUtils.clamp(Math.sqrt(Math.max(0.0001, totalArea / sampleCount)) * 0.58, 0.022, 0.092);
    const meshMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
    const baseColor = meshMaterial && "color" in meshMaterial && meshMaterial.color instanceof THREE.Color
      ? meshMaterial.color
      : new THREE.Color(0xaaa7a2);

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const targetArea = random() * totalArea;
      let low = 0;
      let high = triangleAreas.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (triangleAreas[middle] < targetArea) low = middle + 1;
        else high = middle;
      }
      const triangleIndex = low;
      const getVertex = (corner: number) => indexAttribute
        ? indexAttribute.getX(triangleIndex * 3 + corner)
        : triangleIndex * 3 + corner;
      a.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(0));
      b.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(1));
      c.fromBufferAttribute(position as THREE.BufferAttribute, getVertex(2));
      let u = random();
      let v = random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      edgeAB.copy(b).sub(a);
      edgeAC.copy(c).sub(a);
      sampled.copy(a).addScaledVector(edgeAB, u).addScaledVector(edgeAC, v);
      centers.push(sampled.x, sampled.y, sampled.z);
      const size = footprint * (0.82 + random() * 0.38);
      scales.push(size * (1.04 + random() * 0.68), size * (0.74 + random() * 0.46));
      rotations.push(random() * Math.PI * 2);
      const variation = 0.9 + random() * 0.2;
      colors.push(
        Math.min(1, baseColor.r * variation),
        Math.min(1, baseColor.g * variation),
        Math.min(1, baseColor.b * variation),
      );
      opacities.push(0.42 + random() * 0.28);
    }
    transformed.dispose();
  });

  // Gaussian splats need an approximate back-to-front order for natural alpha
  // compositing. The final chapter camera is stable, so a single static sort is
  // both inexpensive and materially closer to a real splat renderer than mesh
  // traversal order.
  const finalCamera = new THREE.Vector3(-4.7, 3.2, 7.45);
  const order = Array.from({ length: opacities.length }, (_, index) => index)
    .sort((left, right) => {
      const leftOffset = left * 3;
      const rightOffset = right * 3;
      const leftX = centers[leftOffset] - finalCamera.x;
      const leftY = centers[leftOffset + 1] - finalCamera.y;
      const leftZ = centers[leftOffset + 2] - finalCamera.z;
      const rightX = centers[rightOffset] - finalCamera.x;
      const rightY = centers[rightOffset + 1] - finalCamera.y;
      const rightZ = centers[rightOffset + 2] - finalCamera.z;
      const leftDistance = leftX * leftX + leftY * leftY + leftZ * leftZ;
      const rightDistance = rightX * rightX + rightY * rightY + rightZ * rightZ;
      return rightDistance - leftDistance;
    });
  const sortedCenters: number[] = [];
  const sortedScales: number[] = [];
  const sortedRotations: number[] = [];
  const sortedColors: number[] = [];
  const sortedOpacities: number[] = [];
  order.forEach((index) => {
    sortedCenters.push(centers[index * 3], centers[index * 3 + 1], centers[index * 3 + 2]);
    sortedScales.push(scales[index * 2], scales[index * 2 + 1]);
    sortedRotations.push(rotations[index]);
    sortedColors.push(colors[index * 3], colors[index * 3 + 1], colors[index * 3 + 2]);
    sortedOpacities.push(opacities[index]);
  });

  const gaussianGeometry = new THREE.InstancedBufferGeometry();
  gaussianGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  gaussianGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0.5, 0.5, 0,
    -0.5, 0.5, 0,
  ], 3));
  gaussianGeometry.setAttribute("instanceCenter", new THREE.InstancedBufferAttribute(new Float32Array(sortedCenters), 3));
  gaussianGeometry.setAttribute("instanceScale", new THREE.InstancedBufferAttribute(new Float32Array(sortedScales), 2));
  gaussianGeometry.setAttribute("instanceRotation", new THREE.InstancedBufferAttribute(new Float32Array(sortedRotations), 1));
  gaussianGeometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(new Float32Array(sortedColors), 3));
  gaussianGeometry.setAttribute("instanceOpacity", new THREE.InstancedBufferAttribute(new Float32Array(sortedOpacities), 1));
  gaussianGeometry.instanceCount = sortedOpacities.length;

  const gaussianMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: `
      attribute vec3 instanceCenter;
      attribute vec2 instanceScale;
      attribute float instanceRotation;
      attribute vec3 instanceColor;
      attribute float instanceOpacity;
      varying vec2 vGaussianPosition;
      varying vec3 vColor;
      varying float vOpacity;

      void main() {
        vec4 center = modelViewMatrix * vec4(instanceCenter, 1.0);
        float cosine = cos(instanceRotation);
        float sine = sin(instanceRotation);
        vec2 local = position.xy * 2.0;
        vec2 rotated = vec2(
          local.x * cosine - local.y * sine,
          local.x * sine + local.y * cosine
        );
        center.xy += rotated * instanceScale;
        gl_Position = projectionMatrix * center;
        vGaussianPosition = local;
        vColor = instanceColor;
        vOpacity = instanceOpacity;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec2 vGaussianPosition;
      varying vec3 vColor;
      varying float vOpacity;

      void main() {
        float radius = dot(vGaussianPosition, vGaussianPosition);
        float alpha = exp(-2.75 * radius) * vOpacity * uOpacity;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });
  const gaussianField = new THREE.Mesh(gaussianGeometry, gaussianMaterial);
  gaussianField.name = "anisotropic-gaussian-field";
  gaussianField.frustumCulled = false;
  gaussianField.visible = false;

  pointsGroup.visible = false;
  wireGroup.visible = false;
  return { pointsGroup, wireGroup, gaussianField, pointsMaterial, wireMaterial, gaussianMaterial, gaussianGeometry };
}

export function OpeningExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openingRef = useRef<HTMLElement>(null);
  const openingPanelRefs = useRef<Array<HTMLElement | null>>([]);
  const advanceRef = useRef<() => void>(() => undefined);
  const [step, setStep] = useState(0);
  const [motion, setMotion] = useState<Motion>("idle");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let renderFrame = 0;
    let animationFrame = 0;
    let currentStep = 0;
    let animationLocked = false;
    let idleCamera = true;
    let wheelAccumulator = 0;
    let wheelLockedUntil = 0;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
    const roomTarget = new THREE.Vector3(0, 2.05, -4.15);
    const initialCamera = new THREE.Vector3(7.5, 3.85, 7.6);
    const frontCamera = new THREE.Vector3(0, 2.75, 8.35);
    const unfoldedCamera = new THREE.Vector3(5.6, 3.35, 7.05);
    const comparedCamera = new THREE.Vector3(-4.7, 3.2, 7.45);
    camera.position.copy(initialCamera);
    camera.lookAt(roomTarget);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentScene = new RoomEnvironment();
    const environment = pmrem.fromScene(environmentScene).texture;
    scene.environment = environment;
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xe9eef2, 0x23211f, 1.7));
    const sun = new THREE.DirectionalLight(0xfff8ee, 3.4);
    sun.position.set(-4, 7.5, 5.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);
    const windowLight = new THREE.RectAreaLight(0xe3edf0, 5.5, 6, 3.4);
    windowLight.position.set(0, 3, -7.9);
    windowLight.lookAt(0, 2, 0);
    scene.add(windowLight);
    const warmLight = new THREE.PointLight(0xffe2bd, 9, 7, 2);
    warmLight.position.set(4.8, 3.2, -4.7);
    scene.add(warmLight);

    const { group: room, solidMaterials } = buildRoom();
    scene.add(room);
    room.updateMatrixWorld(true);
    const representations = buildRepresentations(room);
    scene.add(representations.pointsGroup, representations.wireGroup, representations.gaussianField);

    const renderTarget = new THREE.WebGLRenderTarget(1600, 900, { colorSpace: THREE.SRGBColorSpace, samples: 4 });
    const photoMaterial = new THREE.MeshBasicMaterial({ map: renderTarget.texture, transparent: true, opacity: 0, toneMapped: false });
    const photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 6.075), photoMaterial);
    photoPlane.position.set(0, 2.65, -3.45);
    photoPlane.visible = false;
    scene.add(photoPlane);
    const captureCamera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
    captureCamera.position.copy(frontCamera);
    captureCamera.lookAt(roomTarget);

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const renderSnapshot = () => {
      const previousVisible = photoPlane.visible;
      photoPlane.visible = false;
      room.visible = true;
      room.scale.z = 1;
      setMaterialOpacity(solidMaterials, 1);
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, captureCamera);
      renderer.setRenderTarget(null);
      photoPlane.visible = previousVisible;
    };

    const animate = (duration: number, update: (eased: number, linear: number) => void) => new Promise<void>((resolve) => {
      const startedAt = performance.now();
      const slowedDuration = duration * 1.18;
      const tick = (now: number) => {
        if (disposed) return;
        const linear = Math.min(1, (now - startedAt) / slowedDuration);
        update(easeInOutQuint(linear), linear);
        if (linear < 1) animationFrame = requestAnimationFrame(tick);
        else resolve();
      };
      animationFrame = requestAnimationFrame(tick);
    });

    const lookFrom = (position: THREE.Vector3, target = roomTarget) => {
      camera.position.copy(position);
      camera.lookAt(target);
    };

    const setRepresentationOpacity = (materials: THREE.Material[], opacity: number) => {
      setMaterialOpacity(materials, opacity);
    };

    const setGaussianOpacity = (opacity: number) => {
      representations.gaussianMaterial.uniforms.uOpacity.value = opacity;
      representations.gaussianField.visible = opacity > 0.001;
    };

    const flattenRoom = async () => {
      renderSnapshot();
      photoPlane.visible = false;
      room.visible = true;
      room.scale.z = 1;
      setMaterialOpacity(solidMaterials, 1);
      const start = camera.position.clone();
      const orbit = new THREE.Vector3(9.2, 3.5, 4.2);
      const side = new THREE.Vector3(9.6, 3.05, -2.75);

      await animate(780, (eased) => lookFrom(new THREE.Vector3().lerpVectors(start, orbit, easeOutQuart(eased))));
      await animate(1480, (eased) => {
        room.scale.z = THREE.MathUtils.lerp(1, 0.018, eased);
        lookFrom(new THREE.Vector3().lerpVectors(orbit, side, eased));
      });
      photoPlane.visible = true;
      await animate(980, (eased) => {
        lookFrom(new THREE.Vector3().lerpVectors(side, frontCamera, eased));
        photoMaterial.opacity = eased;
        setMaterialOpacity(solidMaterials, 1 - eased);
      });
      room.visible = false;
      photoMaterial.opacity = 1;
      lookFrom(frontCamera);
    };

    const unflattenRoom = async () => {
      const side = new THREE.Vector3(9.6, 3.05, -2.75);
      const orbit = new THREE.Vector3(9.2, 3.5, 4.2);
      photoPlane.visible = true;
      photoMaterial.opacity = 1;
      room.visible = true;
      room.scale.z = 0.018;
      setMaterialOpacity(solidMaterials, 0);
      lookFrom(frontCamera);

      await animate(820, (eased) => {
        photoMaterial.opacity = 1 - eased;
        setMaterialOpacity(solidMaterials, eased);
        lookFrom(new THREE.Vector3().lerpVectors(frontCamera, side, eased));
      });
      photoPlane.visible = false;
      await animate(1280, (eased) => {
        room.scale.z = THREE.MathUtils.lerp(0.018, 1, eased);
        lookFrom(new THREE.Vector3().lerpVectors(side, orbit, eased));
      });
      await animate(650, (eased) => lookFrom(new THREE.Vector3().lerpVectors(orbit, initialCamera, easeOutQuart(eased))));
      room.scale.z = 1;
      setMaterialOpacity(solidMaterials, 1);
      lookFrom(initialCamera);
      idleCamera = true;
    };

    const unfoldRoom = async () => {
      const revealPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -6.1);
      solidMaterials.forEach((material) => {
        material.clippingPlanes = [revealPlane];
        material.clipShadows = true;
      });
      room.visible = true;
      room.scale.z = 0.018;
      setMaterialOpacity(solidMaterials, 0.08);
      setGaussianOpacity(0);
      await animate(3000, (eased, linear) => {
        revealPlane.constant = THREE.MathUtils.lerp(-6.1, 6.2, eased);
        room.scale.z = THREE.MathUtils.lerp(0.018, 1, eased);
        setMaterialOpacity(solidMaterials, THREE.MathUtils.lerp(0.08, 1, eased));
        photoMaterial.opacity = 1 - Math.min(1, linear * 1.35);
        const splatOpacity = Math.sin(Math.PI * linear) * 0.48;
        setGaussianOpacity(splatOpacity);
        lookFrom(new THREE.Vector3().lerpVectors(frontCamera, unfoldedCamera, eased));
      });
      solidMaterials.forEach((material) => {
        material.clippingPlanes = [];
      });
      setGaussianOpacity(0);
      photoPlane.visible = false;
      room.scale.z = 1;
      setMaterialOpacity(solidMaterials, 1);
      lookFrom(unfoldedCamera);
    };

    const foldRoom = async () => {
      renderSnapshot();
      const revealPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 6.2);
      solidMaterials.forEach((material) => {
        material.clippingPlanes = [revealPlane];
        material.clipShadows = true;
      });
      room.visible = true;
      room.scale.z = 1;
      setMaterialOpacity(solidMaterials, 1);
      photoPlane.visible = true;
      photoMaterial.opacity = 0;
      setGaussianOpacity(0);

      await animate(2600, (eased, linear) => {
        revealPlane.constant = THREE.MathUtils.lerp(6.2, -6.1, eased);
        room.scale.z = THREE.MathUtils.lerp(1, 0.018, eased);
        setMaterialOpacity(solidMaterials, THREE.MathUtils.lerp(1, 0.08, eased));
        photoMaterial.opacity = Math.min(1, linear * 1.3);
        setGaussianOpacity(Math.sin(Math.PI * linear) * 0.48);
        lookFrom(new THREE.Vector3().lerpVectors(unfoldedCamera, frontCamera, eased));
      });
      solidMaterials.forEach((material) => {
        material.clippingPlanes = [];
      });
      setGaussianOpacity(0);
      room.visible = false;
      photoPlane.visible = true;
      photoMaterial.opacity = 1;
      lookFrom(frontCamera);
    };

    const applyRepresentationTimeline = (linear: number) => {
      if (linear < 0.175) {
        const phase = easeOutQuart(linear / 0.175);
        setMaterialOpacity(solidMaterials, 1 - phase);
        setRepresentationOpacity([representations.pointsMaterial], phase);
        setRepresentationOpacity([representations.wireMaterial], 0);
        setGaussianOpacity(0);
      } else if (linear < 0.35) {
        const phase = easeOutQuart((linear - 0.175) / 0.175);
        setMaterialOpacity(solidMaterials, 0);
        setRepresentationOpacity([representations.pointsMaterial], 1 - phase);
        setRepresentationOpacity([representations.wireMaterial], phase);
        setGaussianOpacity(0);
      } else if (linear < 0.7) {
        const phase = easeOutQuart((linear - 0.35) / 0.35);
        setRepresentationOpacity([representations.pointsMaterial], 0);
        setRepresentationOpacity([representations.wireMaterial], 1 - phase);
        setGaussianOpacity(phase);
        setMaterialOpacity(solidMaterials, phase * 0.12);
      } else {
        setRepresentationOpacity([representations.pointsMaterial], 0);
        setRepresentationOpacity([representations.wireMaterial], 0);
        setGaussianOpacity(1);
        setMaterialOpacity(solidMaterials, 1);
      }
    };

    const compareRepresentations = async () => {
      const start = camera.position.clone();
      representations.pointsGroup.visible = true;
      representations.wireGroup.visible = true;
      representations.gaussianField.visible = true;
      setRepresentationOpacity([representations.pointsMaterial], 0);
      setRepresentationOpacity([representations.wireMaterial], 0);
      setGaussianOpacity(0);

      await animate(4000, (_eased, linear) => {
        applyRepresentationTimeline(linear);
        const cameraEase = easeInOutQuint(linear);
        lookFrom(new THREE.Vector3().lerpVectors(start, comparedCamera, cameraEase));
      });
      representations.pointsGroup.visible = false;
      representations.wireGroup.visible = false;
      setMaterialOpacity(solidMaterials, 1);
      setGaussianOpacity(1);
      lookFrom(comparedCamera);
    };

    const rewindRepresentations = async () => {
      representations.pointsGroup.visible = true;
      representations.wireGroup.visible = true;
      representations.gaussianField.visible = true;
      await animate(3400, (eased, linear) => {
        applyRepresentationTimeline(1 - linear);
        lookFrom(new THREE.Vector3().lerpVectors(comparedCamera, unfoldedCamera, eased));
      });
      representations.pointsGroup.visible = false;
      representations.wireGroup.visible = false;
      setGaussianOpacity(0);
      setMaterialOpacity(solidMaterials, 1);
      lookFrom(unfoldedCamera);
    };

    const transition = async (nextDirection: 1 | -1) => {
      const targetStep = currentStep + nextDirection;
      if (animationLocked || targetStep < 0 || targetStep > 3) return;
      const sourceStep = currentStep;
      animationLocked = true;
      idleCamera = false;
      setBusy(true);
      setDirection(nextDirection);
      const transitionIndex = nextDirection === 1 ? sourceStep : targetStep;
      const nextMotion: Motion = transitionIndex === 0 ? "flatten" : transitionIndex === 1 ? "unfold" : "compare";
      currentStep = targetStep;
      setStep(targetStep);
      setMotion(nextMotion);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo({
        top: (openingRef.current?.offsetTop ?? 0) + targetStep * window.innerHeight,
        behavior: "smooth",
      });
      if (nextDirection === 1 && sourceStep === 0) await flattenRoom();
      if (nextDirection === 1 && sourceStep === 1) await unfoldRoom();
      if (nextDirection === 1 && sourceStep === 2) await compareRepresentations();
      if (nextDirection === -1 && sourceStep === 1) await unflattenRoom();
      if (nextDirection === -1 && sourceStep === 2) await foldRoom();
      if (nextDirection === -1 && sourceStep === 3) await rewindRepresentations();
      setMotion("idle");
      setBusy(false);
      animationLocked = false;
      wheelAccumulator = 0;
      wheelLockedUntil = performance.now() + 320;
    };
    const continueToStory = () => document.getElementById("representations")?.scrollIntoView({ behavior: "smooth", block: "start" });
    advanceRef.current = () => {
      if (currentStep < 3) void transition(1);
      else continueToStory();
    };

    const onProgressNavigate = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const targetStep = openingIds.findIndex((openingId) => openingId === id);
      if (targetStep < 0 || animationLocked) return;

      currentStep = targetStep;
      setStep(targetStep);
      setMotion("idle");
      setBusy(false);
      representations.pointsGroup.visible = false;
      representations.wireGroup.visible = false;
      room.scale.z = 1;
      setRepresentationOpacity([representations.pointsMaterial, representations.wireMaterial], 0);

      if (targetStep === 0) {
        room.visible = true;
        photoPlane.visible = false;
        photoMaterial.opacity = 0;
        setMaterialOpacity(solidMaterials, 1);
        setGaussianOpacity(0);
        lookFrom(initialCamera);
        idleCamera = true;
      } else if (targetStep === 1) {
        room.visible = false;
        photoPlane.visible = true;
        photoMaterial.opacity = 1;
        setMaterialOpacity(solidMaterials, 0);
        setGaussianOpacity(0);
        lookFrom(frontCamera);
        idleCamera = false;
      } else if (targetStep === 2) {
        room.visible = true;
        photoPlane.visible = false;
        photoMaterial.opacity = 0;
        setMaterialOpacity(solidMaterials, 1);
        setGaussianOpacity(0);
        lookFrom(unfoldedCamera);
        idleCamera = false;
      } else {
        room.visible = true;
        photoPlane.visible = false;
        photoMaterial.opacity = 0;
        setMaterialOpacity(solidMaterials, 1);
        setGaussianOpacity(1);
        lookFrom(comparedCamera);
        idleCamera = false;
      }
    };

    const openingIsActive = () => {
      const bounds = openingPanelRefs.current[currentStep]?.getBoundingClientRect();
      return Boolean(
        bounds
        && bounds.top < window.innerHeight * 0.35
        && bounds.bottom > window.innerHeight * 0.65,
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("button, input, textarea, select, [contenteditable='true']")) return;
      if (event.key === " " && openingIsActive()) {
        event.preventDefault();
        if (currentStep < 3) {
          if (!animationLocked) void transition(1);
        } else {
          continueToStory();
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!openingIsActive() || event.deltaY === 0) return;
      const nextDirection: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const canMove = nextDirection === 1 ? currentStep < 3 : currentStep > 0;
      if (!canMove) return;

      event.preventDefault();
      if (animationLocked || performance.now() < wheelLockedUntil) return;
      if (Math.sign(wheelAccumulator) !== Math.sign(event.deltaY)) wheelAccumulator = 0;
      wheelAccumulator += event.deltaY;
      if (Math.abs(wheelAccumulator) < 44) return;
      wheelAccumulator = 0;
      void transition(nextDirection);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("spatial:navigate", onProgressNavigate);

    const render = (time: number) => {
      if (disposed) return;
      if (idleCamera && currentStep === 0) {
        const drift = Math.sin(time * 0.00028);
        const orbitPosition = initialCamera.clone().add(new THREE.Vector3(drift * 0.35, Math.cos(time * 0.00021) * 0.06, -drift * 0.22));
        lookFrom(orbitPosition);
      }
      renderer.render(scene, camera);
      renderFrame = requestAnimationFrame(render);
    };
    renderFrame = requestAnimationFrame(render);
    setReady(true);

    return () => {
      disposed = true;
      cancelAnimationFrame(renderFrame);
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("spatial:navigate", onProgressNavigate);
      renderTarget.dispose();
      photoPlane.geometry.dispose();
      photoMaterial.dispose();
      representations.pointsMaterial.dispose();
      representations.wireMaterial.dispose();
      representations.gaussianMaterial.dispose();
      representations.gaussianGeometry.dispose();
      environment.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments)) return;
        if (object.geometry) geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, [run]);

  const instruction = busy
    ? direction === -1 ? "Reversing the spatial transition…" : motion === "flatten" ? "Compressing spatial depth…" : motion === "unfold" ? "Restoring the field…" : "Changing representation…"
    : step === 0 ? "Space or scroll ↓ to compress" : step === 1 ? "Space / scroll ↓ · scroll ↑ to rewind" : step === 2 ? "Space / scroll ↓ · scroll ↑ to rewind" : "Scroll ↓ to continue · scroll ↑ to rewind";

  return (
    <main className="opening-page">
      <header className="site-header">
        <span>FROM PHOTOGRAPHS TO SPATIAL FIELDS</span>
        <span>A spatial record · Columbia GSAPP</span>
      </header>

      <section className="opening-sequence" ref={openingRef} aria-label="Opening sequence">
        <div className="opening-stage opening-visual-sticky" data-motion={motion} data-step={step}>
          <div className="canvas-stage">
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="opening-official-result">
              <ContinentalCameraPathHero active={step === 3 && motion === "idle"} />
            </div>
            <div className="real-geometry-badge">{step === 3 ? "Continental Rooftop · live Gaussian splat · 1,481 camera poses" : "Live WebGL geometry"}</div>
            <div className="phone-path" aria-hidden="true"><i /><span /></div>
            <div className="representation-cues" aria-hidden="true">
              <span>LiDAR samples</span><span>Photogrammetry mesh</span><span>Gaussian field</span>
            </div>
          </div>
        </div>

        <div className="opening-panels">
          {copy.map((page, index) => (
            <section
              className={`opening-panel ${step === index ? "is-active" : ""}`}
              id={openingIds[index]}
              key={openingIds[index]}
              ref={(element) => { openingPanelRefs.current[index] = element; }}
              aria-label={`Opening page ${index + 1} of 4`}
            >
              <div className="opening-copy">
                <p>{page.eyebrow}</p>
                <h1>{page.title}</h1>
                <span>{page.detail}</span>
                {index === 3 && (
                  <div className="gaussian-attributes" aria-label="A Gaussian splat records position, scale, rotation, color and opacity">
                    <i>Position</i><i>Scale</i><i>Rotation</i><i>Color</i><i>Opacity</i>
                  </div>
                )}
              </div>

              <footer className="sequence-footer">
                <button type="button" className="space-control" onClick={() => advanceRef.current()} disabled={busy || !ready}>
                  <kbd>Space</kbd><span>{instruction}</span>
                </button>
                <button
                  type="button"
                  className="replay-control"
                  onClick={() => {
                    setReady(false);
                    setBusy(false);
                    setMotion("idle");
                    setStep(0);
                    window.scrollTo({ top: openingRef.current?.offsetTop ?? 0, behavior: "smooth" });
                    setRun((value) => value + 1);
                  }}
                >
                  Replay
                </button>
              </footer>
            </section>
          ))}
        </div>
      </section>

      <RepresentationPrimer />
      <RecordEvolution key="record-evolution-2-5d" />
      <OriginsTimeline />
      <ApplicationsFinale />
      <EndingQuestion />
      <LinearProgress />
    </main>
  );
}
