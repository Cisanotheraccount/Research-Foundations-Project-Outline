(() => {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".local-nav__links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navToggle.querySelector(".sr-only").textContent = isOpen
        ? "Open navigation"
        : "Close navigation";
      navLinks.classList.toggle("is-open", !isOpen);
    });

    navLinks.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.querySelector(".sr-only").textContent = "Open navigation";
      navLinks.classList.remove("is-open");
    });
  }

  const splatField = document.querySelector("[data-splat-field]");

  if (splatField) {
    let seed = 37;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const colors = ["#ff5a1f", "#f0a37f", "#4f7c90", "#718a61", "#161615"];

    for (let index = 0; index < 52; index += 1) {
      const splat = document.createElement("i");
      const width = 7 + random() * 30;
      const height = 4 + random() * 15;
      splat.style.left = `${6 + random() * 88}%`;
      splat.style.top = `${8 + random() * 84}%`;
      splat.style.setProperty("--splat-width", `${width}px`);
      splat.style.setProperty("--splat-height", `${height}px`);
      splat.style.setProperty("--splat-color", colors[Math.floor(random() * colors.length)]);
      splat.style.setProperty("--splat-opacity", `${0.18 + random() * 0.55}`);
      splat.style.setProperty("--splat-rotation", `${-65 + random() * 130}deg`);
      splat.style.setProperty("--splat-duration", `${2.8 + random() * 3.2}s`);
      splat.style.animationDelay = `${random() * -4}s`;
      splatField.appendChild(splat);
    }
  }

  const floorControl = document.querySelector("#floor-control");
  const floorOutput = document.querySelector("#floor-output");
  const floorMarker = document.querySelector("[data-floor-marker]");
  const prototypeVisual = document.querySelector(".prototype-visual");
  const skyOutput = document.querySelector("[data-sky-output]");
  const obstructionOutput = document.querySelector("[data-obstruction-output]");
  const blockageOutput = document.querySelector("[data-blockage-output]");
  const privacyOutput = document.querySelector("[data-privacy-output]");

  const floorStates = {
    low: {
      sky: "Low",
      obstruction: "Near",
      blockage: "Dense",
      privacy: "High exposure",
    },
    mid: {
      sky: "Medium",
      obstruction: "Mid-distance",
      blockage: "Partial",
      privacy: "Moderate",
    },
    high: {
      sky: "High",
      obstruction: "Far",
      blockage: "Open",
      privacy: "Lower exposure",
    },
  };

  const updateFloor = () => {
    if (!floorControl || !prototypeVisual) return;

    const floor = Number(floorControl.value);
    const normalized = (floor - Number(floorControl.min)) /
      (Number(floorControl.max) - Number(floorControl.min));
    const band = floor < 13 ? "low" : floor < 25 ? "mid" : "high";
    const state = floorStates[band];

    floorOutput.textContent = `${floor}F`;
    floorMarker.style.bottom = `${normalized * 100}%`;
    prototypeVisual.dataset.floorBand = band;
    skyOutput.textContent = state.sky;
    obstructionOutput.textContent = state.obstruction;
    blockageOutput.textContent = state.blockage;
    privacyOutput.textContent = state.privacy;
  };

  floorControl?.addEventListener("input", updateFloor);
  updateFloor();

  const viewpointButtons = document.querySelectorAll("[data-viewpoint]");

  viewpointButtons.forEach((button) => {
    button.addEventListener("click", () => {
      viewpointButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      prototypeVisual.dataset.viewpointState = button.dataset.viewpoint;
    });
  });

  const evidenceButtons = document.querySelectorAll("[data-evidence]");
  const evidenceTitle = document.querySelector("[data-evidence-title]");
  const evidenceNote = document.querySelector("[data-evidence-note]");
  const statusDot = document.querySelector("[data-status-dot]");

  const evidenceStates = {
    captured: {
      title: "Captured",
      note: "Proposed apartment video capture. No public apartment splat is connected yet.",
      dot: "status-dot--captured",
    },
    modeled: {
      title: "Modeled",
      note: "A future city model can supply building massing, floor elevation, and obstruction geometry.",
      dot: "status-dot--modeled",
    },
    inferred: {
      title: "Inferred",
      note: "Unverified views may be estimated from floor, orientation, and neighboring evidence only.",
      dot: "status-dot--inferred",
    },
  };

  evidenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const state = evidenceStates[button.dataset.evidence];
      if (!state) return;

      evidenceButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      evidenceTitle.textContent = state.title;
      evidenceNote.textContent = state.note;
      statusDot.className = `status-dot ${state.dot}`;
    });
  });
})();
