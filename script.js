const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".local-nav__links");
const navToggleLabel = navToggle?.querySelector(".sr-only");
const navigationItems = [...document.querySelectorAll(".local-nav__links a")];

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks?.classList.toggle("is-open", !isOpen);
  if (navToggleLabel) navToggleLabel.textContent = isOpen ? "Open navigation" : "Close navigation";
});

navigationItems.forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    navLinks?.classList.remove("is-open");
    if (navToggleLabel) navToggleLabel.textContent = "Open navigation";
  });
});

const trackedSections = navigationItems
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!current) return;
      navigationItems.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${current.target.id}`;
        link.classList.toggle("is-active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-30% 0px -55%", threshold: [0, 0.1, 0.3] },
  );

  trackedSections.forEach((section) => sectionObserver.observe(section));
}

const FALLBACK_ROWS = Array.from({ length: 64 }, (_, index) => ({
  cell_id: `H${String(index + 1).padStart(2, "0")}`,
  rent: 2100 + ((index * 283) % 2800),
}));

let terrainRows = FALLBACK_ROWS;
let renderFrame = 0;

function setupCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function polygon(context, points, fill, stroke = null, lineWidth = 1) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function centerAt(width, height, t) {
  return {
    x: width * (0.79 - 0.55 * t + 0.018 * Math.sin(t * Math.PI * 1.4)),
    y: height * (0.22 + 0.56 * t),
  };
}

function islandHalfWidth(width, t) {
  return width * (0.026 + 0.035 * Math.sin(Math.PI * Math.max(0.03, Math.min(0.97, t))));
}

function islandGeometry(width, height) {
  const direction = { x: -0.55 * width, y: 0.56 * height };
  const length = Math.hypot(direction.x, direction.y);
  const perpendicular = { x: -direction.y / length, y: direction.x / length };
  const left = [];
  const right = [];

  for (let index = 0; index <= 18; index += 1) {
    const t = index / 18;
    const center = centerAt(width, height, t);
    const taper = index === 0 || index === 18 ? 0.16 : 1;
    const halfWidth = islandHalfWidth(width, t) * taper;
    left.push({ x: center.x + perpendicular.x * halfWidth, y: center.y + perpendicular.y * halfWidth });
    right.push({ x: center.x - perpendicular.x * halfWidth, y: center.y - perpendicular.y * halfWidth });
  }

  return { points: [...left, ...right.reverse()], perpendicular };
}

function drawHexPrism(context, x, y, radius, height, palette = {}) {
  const topY = y - height;
  const sideDepth = Math.max(3, radius * 0.58);
  const left = [
    { x: x - radius, y: topY },
    { x, y: topY + sideDepth },
    { x, y: y + sideDepth },
    { x: x - radius, y },
  ];
  const right = [
    { x, y: topY + sideDepth },
    { x: x + radius, y: topY },
    { x: x + radius, y },
    { x, y: y + sideDepth },
  ];
  const top = [
    { x: x - radius, y: topY },
    { x, y: topY - sideDepth },
    { x: x + radius, y: topY },
    { x, y: topY + sideDepth },
  ];

  polygon(context, left, palette.left || "#b83d0f");
  polygon(context, right, palette.right || "#df5318");
  polygon(context, top, palette.top || "#ff8a2b", palette.stroke || "rgba(255,190,125,.45)", 0.65);
}

function drawTerrainScene(canvas, rows, options = {}) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { context, width, height } = setup;
  const background = options.background || "#050505";
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const gridGradient = context.createLinearGradient(0, 0, width, height);
  gridGradient.addColorStop(0, "rgba(255,255,255,.07)");
  gridGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.strokeStyle = gridGradient;
  context.lineWidth = 1;
  for (let x = -height; x < width + height; x += Math.max(42, width / 18)) {
    context.beginPath();
    context.moveTo(x, height);
    context.lineTo(x + height, 0);
    context.stroke();
  }
  for (let y = height * 0.12; y < height; y += Math.max(38, height / 10)) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const geometry = islandGeometry(width, height);
  const depth = Math.max(8, height * 0.022);
  const shadowPoints = geometry.points.map((point) => ({ x: point.x + width * 0.012, y: point.y + depth * 1.8 }));
  context.save();
  context.shadowColor = "rgba(0,0,0,.7)";
  context.shadowBlur = 28;
  polygon(context, shadowPoints, "rgba(0,0,0,.48)");
  context.restore();

  const slabPoints = geometry.points.map((point) => ({ x: point.x, y: point.y + depth }));
  polygon(context, slabPoints, "#777775");
  polygon(context, geometry.points, "#f3f1e9", "rgba(255,255,255,.9)", 1.2);

  context.save();
  polygon(context, geometry.points, null, "rgba(35,35,35,.25)", 0.8);
  context.clip();
  context.strokeStyle = "rgba(30,30,30,.18)";
  context.lineWidth = 0.8;
  for (let index = 1; index < 15; index += 1) {
    const t = index / 15;
    const center = centerAt(width, height, t);
    const span = islandHalfWidth(width, t) * 1.75;
    context.beginPath();
    context.moveTo(center.x - geometry.perpendicular.x * span, center.y - geometry.perpendicular.y * span);
    context.lineTo(center.x + geometry.perpendicular.x * span, center.y + geometry.perpendicular.y * span);
    context.stroke();
  }
  context.restore();

  const values = rows.map((row) => Number(row.rent)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const radius = Math.max(4.2, Math.min(8, width / 120));
  const minHeight = Math.max(15, height * 0.045);
  const maxHeight = Math.max(72, height * 0.28);

  rows.slice(0, 64).forEach((row, index) => {
    const rowIndex = Math.floor(index / 4);
    const columnIndex = index % 4;
    const t = 0.055 + (rowIndex / 15) * 0.89;
    const center = centerAt(width, height, t);
    const halfWidth = islandHalfWidth(width, t);
    const across = [-0.72, -0.24, 0.24, 0.72][columnIndex];
    const x = center.x + geometry.perpendicular.x * halfWidth * across;
    const y = center.y + geometry.perpendicular.y * halfWidth * across;
    const value = Number(row.rent);
    const normalized = Number.isFinite(value) && max > min ? (value - min) / (max - min) : 0.08;
    const barHeight = minHeight + normalized * (maxHeight - minHeight);
    drawHexPrism(context, x, y, radius, barHeight);
  });

  context.fillStyle = "rgba(255,255,255,.48)";
  context.font = `600 ${Math.max(9, Math.min(12, width / 100))}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.letterSpacing = "1px";
  context.fillText("NORTH", width * 0.82, height * 0.15);
  context.fillText("LOWER MANHATTAN", width * 0.12, height * 0.84);
}

function drawPressure(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { context, width, height } = setup;
  context.fillStyle = "#080809";
  context.fillRect(0, 0, width, height);

  const values = rows.map((row) => Number(row.rent)).filter(Number.isFinite).sort((a, b) => a - b);
  const samples = [0.08, 0.28, 0.5, 0.72, 0.94].map((percent) => values[Math.floor((values.length - 1) * percent)] || 0);
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const groundY = height * 0.78;

  context.strokeStyle = "rgba(255,255,255,.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(width * 0.1, groundY + 8);
  context.lineTo(width * 0.9, groundY + 8);
  context.stroke();

  samples.forEach((value, index) => {
    const normalized = max > min ? (value - min) / (max - min) : 0.5;
    const x = width * (0.18 + index * 0.16);
    const h = height * (0.18 + normalized * 0.48);
    drawHexPrism(context, x, groundY, Math.max(10, width * 0.024), h);
  });

  context.fillStyle = "#f36b21";
  context.font = `700 ${Math.max(12, width * 0.035)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("PRESSURE ACCUMULATES", width * 0.1, height * 0.12);
  context.fillStyle = "rgba(255,255,255,.48)";
  context.font = `600 ${Math.max(9, width * 0.02)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("LOWER", width * 0.1, height * 0.9);
  context.fillText("HIGHER ASKING RENT", width * 0.64, height * 0.9);
}

function drawPlanA(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { context, width, height } = setup;
  context.fillStyle = "#080809";
  context.fillRect(0, 0, width, height);

  const baseY = height * 0.78;
  polygon(context, [
    { x: width * 0.08, y: baseY },
    { x: width * 0.84, y: baseY },
    { x: width * 0.94, y: baseY + height * 0.08 },
    { x: width * 0.18, y: baseY + height * 0.08 },
  ], "#efeee8", "rgba(255,255,255,.5)", 1);

  const eight = rows.slice(28, 36);
  const values = eight.map((row) => Number(row.rent)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  eight.forEach((row, index) => {
    const value = Number(row.rent);
    const normalized = max > min ? (value - min) / (max - min) : 0.5;
    const x = width * (0.17 + index * 0.095);
    const y = baseY + (index % 2 ? height * 0.022 : 0);
    const h = height * (0.18 + normalized * 0.45);
    drawHexPrism(context, x, y, Math.max(6, width * 0.015), h);
    context.strokeStyle = "rgba(255,255,255,.18)";
    context.beginPath();
    context.moveTo(x, baseY + height * 0.09);
    context.lineTo(x, height * 0.93);
    context.stroke();
  });

  context.fillStyle = "#f36b21";
  context.font = `700 ${Math.max(11, width * 0.025)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("8-COLUMN MOTION TEST", width * 0.07, height * 0.14);
  context.fillStyle = "rgba(255,255,255,.5)";
  context.font = `600 ${Math.max(8, width * 0.017)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("GUIDE PLATE / SLIDING COLUMNS / COMMON DRIVE", width * 0.07, height * 0.22);
}

function drawPlanB(canvas) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { context, width, height } = setup;
  context.fillStyle = "#080809";
  context.fillRect(0, 0, width, height);

  const lens = { x: width * 0.24, y: height * 0.57 };
  const modelCenter = { x: width * 0.73, y: height * 0.62 };
  const beamGradient = context.createLinearGradient(lens.x, lens.y, modelCenter.x, modelCenter.y);
  beamGradient.addColorStop(0, "rgba(255,166,96,.48)");
  beamGradient.addColorStop(1, "rgba(243,107,33,.08)");
  polygon(context, [
    { x: lens.x, y: lens.y },
    { x: width * 0.9, y: height * 0.25 },
    { x: width * 0.92, y: height * 0.83 },
  ], beamGradient);

  roundedRect(context, width * 0.07, height * 0.45, width * 0.18, height * 0.24, 10);
  context.fillStyle = "#48484c";
  context.fill();
  context.beginPath();
  context.arc(lens.x, lens.y, Math.max(7, width * 0.02), 0, Math.PI * 2);
  context.fillStyle = "#ff9a55";
  context.shadowColor = "#ff7a2d";
  context.shadowBlur = 18;
  context.fill();
  context.shadowBlur = 0;

  const island = islandGeometry(width * 0.48, height * 0.62);
  const offsetX = width * 0.48;
  const offsetY = height * 0.22;
  const points = island.points.map((point) => ({ x: point.x + offsetX, y: point.y + offsetY }));
  const depthPoints = points.map((point) => ({ x: point.x, y: point.y + height * 0.035 }));
  polygon(context, depthPoints, "#66666a");
  polygon(context, points, "#f4f2ea", "rgba(255,255,255,.85)", 1);

  context.save();
  polygon(context, points, null, null);
  context.clip();
  const projectionGradient = context.createLinearGradient(width * 0.58, 0, width * 0.95, height);
  projectionGradient.addColorStop(0, "rgba(255,155,85,.18)");
  projectionGradient.addColorStop(0.55, "rgba(243,107,33,.88)");
  projectionGradient.addColorStop(1, "rgba(255,55,95,.52)");
  context.fillStyle = projectionGradient;
  context.fillRect(width * 0.55, height * 0.22, width * 0.43, height * 0.55);
  context.restore();

  context.fillStyle = "rgba(255,255,255,.5)";
  context.font = `600 ${Math.max(8, width * 0.017)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("PROJECTOR", width * 0.07, height * 0.82);
  context.fillText("WHITE MODEL + CALIBRATED DATA", width * 0.55, height * 0.88);
}

function drawPoster(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { context, width, height } = setup;
  const margin = width * 0.075;
  context.fillStyle = "#f6f1e8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#171717";
  context.font = `700 ${Math.max(8, width * 0.025)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("RENT AS TERRAIN", margin, height * 0.045);
  context.textAlign = "right";
  context.fillText("36 × 72 IN", width - margin, height * 0.045);
  context.textAlign = "left";
  context.strokeStyle = "#171717";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(margin, height * 0.062);
  context.lineTo(width - margin, height * 0.062);
  context.stroke();

  const panelTop = height * 0.09;
  const panelHeight = height * 0.47;
  context.strokeRect(margin, panelTop, width - margin * 2, panelHeight);
  const panelWidth = width - margin * 2;
  const panelCanvas = {
    getBoundingClientRect: () => ({ width: panelWidth, height: panelHeight }),
  };

  context.save();
  context.translate(margin, panelTop);
  context.fillStyle = "#f6f1e8";
  context.fillRect(0, 0, panelWidth, panelHeight);
  const posterGeometry = islandGeometry(panelWidth, panelHeight);
  polygon(context, posterGeometry.points, "rgba(255,255,255,.25)", "#171717", 0.8);
  rows.filter((_, index) => index % 4 === 0).slice(0, 16).forEach((row, index) => {
    const t = 0.06 + (index / 15) * 0.88;
    const center = centerAt(panelWidth, panelHeight, t);
    const value = Number(row.rent);
    const h = panelHeight * (0.055 + ((value - 2000) / 3200) * 0.12);
    drawHexPrism(context, center.x, center.y, Math.max(2.3, panelWidth * 0.008), Math.max(10, h), {
      left: "#b94b22",
      right: "#db6030",
      top: "#f47a45",
      stroke: "rgba(0,0,0,.16)",
    });
  });
  context.restore();

  const yearTop = height * 0.59;
  const gap = width * 0.018;
  const yearWidth = (width - margin * 2 - gap * 3) / 4;
  [2010, 2015, 2020, 2025].forEach((year, index) => {
    const x = margin + index * (yearWidth + gap);
    context.strokeStyle = "#171717";
    context.strokeRect(x, yearTop, yearWidth, height * 0.105);
    context.fillStyle = "#171717";
    context.font = `700 ${Math.max(7, width * 0.021)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    context.fillText(String(year), x + 5, yearTop + 12);
    context.strokeStyle = year === 2010 ? "rgba(23,23,23,.22)" : "#f36b21";
    context.beginPath();
    context.moveTo(x + 7, yearTop + height * 0.078);
    for (let step = 0; step < 5; step += 1) {
      context.lineTo(x + 7 + step * ((yearWidth - 14) / 4), yearTop + height * (0.086 - step * 0.005 - index * 0.002));
    }
    context.stroke();
  });

  const timelineY = height * 0.735;
  context.strokeStyle = "#171717";
  context.beginPath();
  context.moveTo(margin, timelineY);
  context.lineTo(width - margin, timelineY);
  context.stroke();
  for (let index = 0; index < 16; index += 1) {
    const x = margin + (index / 15) * (width - margin * 2);
    context.beginPath();
    context.arc(x, timelineY, index < 5 ? 1.5 : 2.5, 0, Math.PI * 2);
    context.fillStyle = index < 5 ? "#aaa69f" : "#f36b21";
    context.fill();
  }
  context.fillStyle = "#171717";
  context.font = `700 ${Math.max(7, width * 0.02)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("TIME SERIES / 2010—2025", margin, timelineY + 18);

  const detailTop = height * 0.79;
  const detailHeight = height * 0.16;
  const detailWidth = (width - margin * 2 - gap) / 2;
  ["PLAN A / MECHANICAL SECTION", "PLAN B / PROJECTION GEOMETRY"].forEach((label, index) => {
    const x = margin + index * (detailWidth + gap);
    context.strokeStyle = "#171717";
    context.strokeRect(x, detailTop, detailWidth, detailHeight);
    context.fillStyle = "#171717";
    context.font = `700 ${Math.max(6, width * 0.017)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    context.fillText(label, x + 6, detailTop + 12);
    context.strokeStyle = "#f36b21";
    context.beginPath();
    if (index === 0) {
      for (let bar = 0; bar < 5; bar += 1) {
        const bx = x + 12 + bar * ((detailWidth - 24) / 5);
        context.moveTo(bx, detailTop + detailHeight - 12);
        context.lineTo(bx, detailTop + detailHeight * (0.47 - (bar % 3) * 0.08));
      }
    } else {
      context.moveTo(x + 12, detailTop + detailHeight * 0.68);
      context.lineTo(x + detailWidth - 12, detailTop + detailHeight * 0.36);
      context.moveTo(x + 12, detailTop + detailHeight * 0.68);
      context.lineTo(x + detailWidth - 12, detailTop + detailHeight * 0.82);
    }
    context.stroke();
  });
}

function updateCaption(rows) {
  const values = rows.map((row) => Number(row.rent)).filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) return;
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const caption = document.querySelector("#terrain-caption");
  if (caption) {
    caption.textContent = `2025 median across the 64 designed cells: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(median)}. Orange columns show asking-rent estimates above a white Manhattan ground plane.`;
  }
}

function renderAllVisuals() {
  drawTerrainScene(document.querySelector("#terrain-canvas"), terrainRows);
  drawPressure(document.querySelector("#pressure-canvas"), terrainRows);
  drawPlanA(document.querySelector("#plan-a-canvas"), terrainRows);
  drawPlanB(document.querySelector("#plan-b-canvas"));
  drawPoster(document.querySelector("#drawing-canvas"), terrainRows);
}

function scheduleRender() {
  window.cancelAnimationFrame(renderFrame);
  renderFrame = window.requestAnimationFrame(renderAllVisuals);
}

const canvases = [...document.querySelectorAll("#terrain-canvas, #pressure-canvas, #plan-a-canvas, #plan-b-canvas, #drawing-canvas")];
if ("ResizeObserver" in window) {
  const canvasObserver = new ResizeObserver(scheduleRender);
  canvases.forEach((canvas) => canvasObserver.observe(canvas));
} else {
  window.addEventListener("resize", scheduleRender);
}

scheduleRender();

if (window.d3) {
  d3.csv("./data/hex_cell_year.csv")
    .then((rows) => {
      const selected = rows.filter((row) => Number(row.year) === 2025);
      if (selected.length === 64) terrainRows = selected;
      updateCaption(terrainRows);
      scheduleRender();
    })
    .catch(() => {
      updateCaption(terrainRows);
      scheduleRender();
    });
} else {
  updateCaption(terrainRows);
}
