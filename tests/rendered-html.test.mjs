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
  assert.match(html, /<title>From Images to Places — Opening Study<\/title>/i);
  assert.match(html, /We live in 3D/);
  assert.match(html, /The room in front of you is real geometry/);
  assert.match(html, /LiDAR samples/);
  assert.match(html, /Photogrammetry mesh/);
  assert.match(html, /Gaussian field/);
  assert.match(html, /Live WebGL geometry/);
  assert.match(html, /Space/);
  assert.match(html, /Replay/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the opening continuous, user-controlled and accessible", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("../app/OpeningExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /new THREE\.WebGLRenderer/);
  assert.match(component, /RoundedBoxGeometry/);
  assert.match(component, /real-three-dimensional-room/);
  assert.match(component, /new THREE\.WebGLRenderTarget/);
  assert.match(component, /buildRepresentations/);
  assert.match(component, /THREE\.Points/);
  assert.match(component, /THREE\.WireframeGeometry/);
  assert.match(component, /THREE\.Sprite/);
  assert.match(component, /event\.key === " "/);
  assert.match(component, /setRun/);
  assert.match(component, /await animate\(3000/);
  assert.match(component, /await animate\(4000/);
  assert.match(css, /@keyframes phoneScan/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /scroll-snap|rotateX\(5\.5deg\)/);
  await access(new URL("../app/OpeningExperience.tsx", import.meta.url));
});
