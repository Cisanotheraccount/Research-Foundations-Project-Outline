import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the rebuilt cinematic opening", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>From Images to Places — Gaussian Splatting<\/title>/i);
  assert.match(html, /We live in 3D/);
  assert.match(html, /The room in front of you is real geometry/);
  assert.match(html, /LiDAR samples/);
  assert.match(html, /Photogrammetry mesh/);
  assert.match(html, /Gaussian field/);
  assert.match(html, /Live WebGL geometry/);
  assert.match(html, /Space/);
  assert.match(html, /Replay/);
  assert.match(html, /A photograph samples light on a plane/);
  assert.match(html, /Video adds time\. The record is still flat/);
  assert.match(html, /A recording becomes a place you can move through/);
  assert.match(html, /3D \+ time: space becomes a sequence of states/);
  assert.match(html, /Official 3DGS result/);
  assert.match(html, /Official 4DGS result/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the opening continuous, user-controlled and accessible", async () => {
  const [component, recordEvolution, css] = await Promise.all([
    readFile(new URL("../app/OpeningExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/RecordEvolution.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /new THREE\.WebGLRenderer/);
  assert.match(component, /RoundedBoxGeometry/);
  assert.match(component, /real-three-dimensional-room/);
  assert.match(component, /new THREE\.WebGLRenderTarget/);
  assert.match(component, /buildRepresentations/);
  assert.match(component, /THREE\.Points/);
  assert.match(component, /THREE\.WireframeGeometry/);
  assert.match(component, /THREE\.InstancedBufferGeometry/);
  assert.match(component, /THREE\.ShaderMaterial/);
  assert.match(component, /anisotropic-gaussian-field/);
  assert.match(component, /Gaussian<br \/>Splatting/);
  assert.match(component, /Not a virtual world\. A captured one\./);
  assert.match(component, /event\.key === " "/);
  assert.match(component, /getBoundingClientRect/);
  assert.match(component, /event\.key === " " && openingIsActive\(\)/);
  assert.match(component, /continueToStory/);
  assert.match(component, /inria-3dgs-playroom\.mp4/);
  assert.match(component, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/);
  assert.match(component, /nextDirection === 1 \? currentStep < 3 : currentStep > 0/);
  assert.match(component, /unflattenRoom/);
  assert.match(component, /foldRoom/);
  assert.match(component, /rewindRepresentations/);
  assert.match(component, /setRun/);
  assert.match(component, /await animate\(3000/);
  assert.match(component, /await animate\(4000/);
  assert.match(css, /@keyframes phoneScan/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /scroll-snap|rotateX\(5\.5deg\)/);
  assert.match(recordEvolution, /import gsap from "gsap"/);
  assert.match(recordEvolution, /timeline\.reverse\(\)/);
  assert.match(recordEvolution, /nextSection\.scrollIntoView/);
  assert.match(recordEvolution, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/);
  assert.match(recordEvolution, /s09-interstellar-tesseract/);
  assert.match(css, /\.record-chapter/);
  assert.match(css, /\.gaussian-primitive-demo/);
  await access(new URL("../app/OpeningExperience.tsx", import.meta.url));
  await access(new URL("../public/media/record-evolution/inria-3dgs-playroom.mp4", import.meta.url));
  await access(new URL("../public/media/record-evolution/cvpr2024-4dgs-standup-time.mp4", import.meta.url));
});
