const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".local-nav__links");
const navigationItems = [...document.querySelectorAll(".local-nav__links a")];
const revealItems = [...document.querySelectorAll(".reveal")];

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks?.classList.toggle("is-open", !isOpen);
});

navigationItems.forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    navLinks?.classList.remove("is-open");
  });
});

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

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

function renderTerrain(rows = []) {
  const grid = document.querySelector("#terrain-grid");
  if (!grid) return;

  const source = rows.length
    ? rows
    : Array.from({ length: 64 }, (_, index) => ({
        cell_id: `H${String(index + 1).padStart(2, "0")}`,
        rent: 2100 + ((index * 283) % 2800),
      }));

  const values = source.map((row) => Number(row.rent)).filter(Number.isFinite);
  const extent = d3.extent(values);
  const height = d3.scaleLinear().domain(extent).range([42, 220]).clamp(true);
  const color = d3.scaleLinear().domain(extent).range(["#ff9a58", "#ff355d"]).clamp(true);

  d3.select(grid)
    .selectAll("span")
    .data(source.slice(0, 64), (row) => row.cell_id)
    .join("span")
    .attr("class", (row) => (Number.isFinite(Number(row.rent)) ? "terrain-cell" : "terrain-cell is-missing"))
    .style("--height", (row) => `${Number.isFinite(Number(row.rent)) ? height(Number(row.rent)) : 20}px`)
    .style("--cell", (row) => (Number.isFinite(Number(row.rent)) ? color(Number(row.rent)) : "#a9adb4"))
    .style("--delay", (_, index) => `${index * 9}ms`);

  if (rows.length) {
    const median = d3.median(values);
    const caption = document.querySelector("#terrain-caption");
    if (caption && Number.isFinite(median)) {
      caption.textContent = `2025 median across the 64 designed cells: ${d3.format("$,.0f")(median)}. Column height and color represent ZIP-level asking-rent estimates; the same values can drive the website, drawing, kinetic model, and projection.`;
    }
  }
}

if (window.d3) {
  d3.csv("./data/hex_cell_year.csv")
    .then((rows) => renderTerrain(rows.filter((row) => Number(row.year) === 2025)))
    .catch(() => renderTerrain());
} else {
  document.documentElement.classList.add("no-d3");
}
