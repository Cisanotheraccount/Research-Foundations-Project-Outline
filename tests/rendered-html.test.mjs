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
  assert.match(html, /capture/);
  assert.match(html, /Not a virtual world/);
  assert.match(html, /Pause/);
  assert.match(html, /Replay/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the opening continuous, automatic and accessible", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("../app/OpeningExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /mode-lidar/);
  assert.match(component, /mode-mesh/);
  assert.match(component, /mode-gaussian/);
  assert.match(component, /setRun/);
  assert.match(css, /--duration:\s*12s/);
  assert.match(css, /@keyframes spatialSequence/);
  assert.match(css, /@keyframes phoneSequence/);
  assert.match(css, /@keyframes lidarSequence/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /scroll-snap|rotateX\(5\.5deg\)/);
  await access(new URL("../public/room.webp", import.meta.url));
});
