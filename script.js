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

function createHoneycombLayout(width, height, options = {}) {
  const radius = Math.min(width * (options.radiusRatio || 0.027), height * (options.heightRadiusRatio || 0.072));
  const rootThree = Math.sqrt(3);
  const columns = 16;
  const rowsAcross = 4;
  const maxX = (columns - 1) * radius * 1.5;
  const minY = -rootThree * radius * 0.5;
  const maxY = (rowsAcross - 1) * rootThree * radius + rootThree * radius;
  const angle = (options.angleDegrees || -24) * (Math.PI / 180);

  return {
    radius,
    rootThree,
    columns,
    rowsAcross,
    maxX,
    minY,
    maxY,
    localCenterX: maxX * 0.5,
    localCenterY: (minY + maxY) * 0.5,
    centerX: width * (options.centerXRatio || 0.52),
    centerY: height * (options.centerYRatio || 0.63),
    depthScale: options.depthScale || 0.66,
    cosine: Math.cos(angle),
    sine: Math.sin(angle),
  };
}

function projectHoneyPoint(layout, x, y) {
  const localX = x - layout.localCenterX;
  const localY = (y - layout.localCenterY) * layout.depthScale;
  return {
    x: layout.centerX + localX * layout.cosine - localY * layout.sine,
    y: layout.centerY + localX * layout.sine + localY * layout.cosine,
  };
}

function projectedHexagon(layout, centerX, centerY) {
  const r = layout.radius;
  const halfDepth = layout.rootThree * r * 0.5;
  return [
    { x: centerX + r, y: centerY },
    { x: centerX + r * 0.5, y: centerY + halfDepth },
    { x: centerX - r * 0.5, y: centerY + halfDepth },
    { x: centerX - r, y: centerY },
    { x: centerX - r * 0.5, y: centerY - halfDepth },
    { x: centerX + r * 0.5, y: centerY - halfDepth },
  ].map((point) => projectHoneyPoint(layout, point.x, point.y));
}

function drawProjectedHexPrism(context, base, height, palette = {}) {
  const top = base.map((point) => ({ x: point.x, y: point.y - height }));
  const centerX = base.reduce((sum, point) => sum + point.x, 0) / base.length;
  const centerY = base.reduce((sum, point) => sum + point.y, 0) / base.length;

  for (let index = 0; index < base.length; index += 1) {
    const next = (index + 1) % base.length;
    const midpointY = (base[index].y + base[next].y) * 0.5;
    if (midpointY < centerY - 0.25) continue;
    const midpointX = (base[index].x + base[next].x) * 0.5;
    polygon(context, [top[index], top[next], base[next], base[index]], midpointX < centerX
      ? (palette.left || "#b74217")
      : (palette.right || "#df5b21"));
  }

  polygon(context, top, palette.top || "#ff8a3d", palette.stroke || "rgba(255,214,174,.7)", 0.65);
  return { base, top, center: { x: centerX, y: centerY }, topCenter: { x: centerX, y: centerY - height } };
}

function drawHoneycombTerrain(context, width, height, rows, options = {}) {
  const layout = createHoneycombLayout(width, height, options);
  const r = layout.radius;
  const frame = [
    { x: -r * 1.3, y: layout.localCenterY },
    { x: -r * 0.25, y: layout.minY - r * 0.48 },
    { x: layout.maxX + r * 0.25, y: layout.minY - r * 0.48 },
    { x: layout.maxX + r * 1.3, y: layout.localCenterY },
    { x: layout.maxX + r * 0.25, y: layout.maxY + r * 0.48 },
    { x: -r * 0.25, y: layout.maxY + r * 0.48 },
  ].map((point) => projectHoneyPoint(layout, point.x, point.y));

  const slabDepth = Math.max(5, height * 0.018);
  const slab = frame.map((point) => ({ x: point.x, y: point.y + slabDepth }));
  const shadow = slab.map((point) => ({ x: point.x + width * 0.01, y: point.y + slabDepth }));
  context.save();
  context.shadowColor = "rgba(0,0,0,.72)";
  context.shadowBlur = Math.max(16, width * 0.025);
  polygon(context, shadow, "rgba(0,0,0,.46)");
  context.restore();
  polygon(context, slab, "#777775");
  polygon(context, frame, "#f3f1e9", "rgba(255,255,255,.9)", 1);

  const values = rows.map((row) => Number(row.rent)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const cells = rows.slice(0, 64).map((row, index) => {
    const column = Math.floor(index / layout.rowsAcross);
    const across = index % layout.rowsAcross;
    const localX = column * r * 1.5;
    const localY = across * layout.rootThree * r + (column % 2) * layout.rootThree * r * 0.5;
    const value = Number(row.rent);
    const normalized = Number.isFinite(value) && max > min ? (value - min) / (max - min) : 0.08;
    const prismHeight = height * ((options.minimumHeightRatio || 0.045) + normalized * (options.heightRangeRatio || 0.23));
    const base = projectedHexagon(layout, localX, localY);
    const center = projectHoneyPoint(layout, localX, localY);
    return { base, center, prismHeight, normalized, index };
  }).sort((a, b) => a.center.y - b.center.y);

  const rendered = [];
  cells.forEach((cell) => {
    const warmth = Math.round(44 + cell.normalized * 16);
    rendered[cell.index] = drawProjectedHexPrism(context, cell.base, cell.prismHeight, {
      left: `hsl(16 78% ${Math.max(28, warmth - 16)}%)`,
      right: `hsl(18 82% ${Math.max(34, warmth - 9)}%)`,
      top: `hsl(24 95% ${warmth}%)`,
    });
  });

  if (options.showMotion) {
    [8, 25, 42, 57].forEach((index) => {
      const prism = rendered[index];
      if (!prism) return;
      const x = prism.topCenter.x + r * 0.18;
      const bottom = prism.topCenter.y - r * 0.7;
      const top = bottom - Math.max(13, height * 0.09);
      context.strokeStyle = "rgba(255,255,255,.72)";
      context.lineWidth = Math.max(1, width * 0.002);
      context.beginPath();
      context.moveTo(x, bottom);
      context.lineTo(x, top);
      context.stroke();
      context.fillStyle = "#ff8a3d";
      polygon(context, [
        { x, y: top - 4 },
        { x: x - 4, y: top + 3 },
        { x: x + 4, y: top + 3 },
      ], "#ff8a3d");
    });
  }

  return { layout, rendered };
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

  const honeycomb = drawHoneycombTerrain(context, width, height, rows, {
    centerXRatio: 0.52,
    centerYRatio: 0.55,
    radiusRatio: 0.027,
    heightRadiusRatio: 0.072,
    minimumHeightRatio: 0.045,
    heightRangeRatio: 0.23,
  });

  context.fillStyle = "rgba(255,255,255,.48)";
  context.font = `600 ${Math.max(9, Math.min(12, width / 100))}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.letterSpacing = "1px";
  const lower = projectHoneyPoint(honeycomb.layout, -honeycomb.layout.radius * 0.6, honeycomb.layout.maxY);
  const north = projectHoneyPoint(honeycomb.layout, honeycomb.layout.maxX, honeycomb.layout.minY);
  context.fillText("NORTH", north.x + honeycomb.layout.radius, north.y - honeycomb.layout.radius);
  context.fillText("LOWER MANHATTAN", lower.x - honeycomb.layout.radius * 2.4, lower.y + honeycomb.layout.radius * 2.4);
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

  drawHoneycombTerrain(context, width, height, rows, {
    centerXRatio: 0.53,
    centerYRatio: 0.68,
    radiusRatio: 0.026,
    heightRadiusRatio: 0.068,
    minimumHeightRatio: 0.035,
    heightRangeRatio: 0.19,
    showMotion: true,
  });

  context.fillStyle = "#f36b21";
  context.font = `700 ${Math.max(11, width * 0.025)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("64-CELL KINETIC HONEYCOMB", width * 0.07, height * 0.13);
  context.fillStyle = "rgba(255,255,255,.5)";
  context.font = `600 ${Math.max(8, width * 0.017)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText("CONNECTED HEXAGONS / INDEPENDENT VERTICAL MOTION", width * 0.07, height * 0.21);
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
  ["EARLY", "MID I", "MID II", "RECENT"].forEach((period, index) => {
    const x = margin + index * (yearWidth + gap);
    context.strokeStyle = "#171717";
    context.strokeRect(x, yearTop, yearWidth, height * 0.105);
    context.fillStyle = "#171717";
    context.font = `700 ${Math.max(7, width * 0.021)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    context.fillText(period, x + 5, yearTop + 12);
    context.strokeStyle = index === 0 ? "rgba(23,23,23,.22)" : "#f36b21";
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
  context.fillText("RENT CHANGE OVER TIME", margin, timelineY + 18);

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
  const caption = document.querySelector("#terrain-caption");
  if (caption) {
    caption.textContent = "Sixty-four connected hexagonal cells form Manhattan. Each column can rise and fall independently to translate rent data into a moving terrain.";
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
      const latestYear = Math.max(...rows.map((row) => Number(row.year)).filter(Number.isFinite));
      const selected = rows.filter((row) => Number(row.year) === latestYear);
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
