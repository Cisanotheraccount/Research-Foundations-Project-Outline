# Design QA — Rent as Terrain

Source visual truth: `/var/folders/sf/s771pjq925v7cvpbcwld72f40000gn/T/TemporaryItems/NSIRD_screencaptureui_6afDXv/Screenshot 2026-07-20 at 6.59.08 PM.png`

Implementation baseline: `RECON/screenshots/audit-before-hero-1440.png`, `audit-before-fields-1440.png`, `audit-before-experiments-1440.png`, `audit-before-material-1440.png`, and `audit-before-drawing-1440.png`

Viewports: 1440 × 900 desktop and 390 × 844 mobile.

State: local first-draft website before the visual repair pass.

## Findings — baseline

- [P1] Hero terrain does not match the selected visual direction.
  Location: `.hero-visual`, `.terrain-grid`.
  Evidence: the reference uses a recognizable oblique NYC/Manhattan ground plane with vertical orange extrusion; the implementation uses a pastel card and a generic square CSS grid that reads as flat.
  Impact: the project’s main spatial argument is not visible in the first image.
  Fix: replace the CSS grid with a responsive, data-driven Canvas rendering on black: white Manhattan slab, 64 orange 3D columns, perspective depth, shadow, and map linework.

- [P1] Diagram geometry relies on brittle absolute-positioned or decorative CSS shapes.
  Location: `.field-map`, `.mini-columns`, `.projection-diagram`, `.argument__visual`, `.poster`.
  Evidence: labels and shapes use fixed percentages, pseudo-elements, clipping paths, and fixed heights; their relationship changes when containers resize.
  Impact: diagrams drift, overlap, or appear cropped across viewports.
  Fix: use intrinsic CSS grids for text relationships and responsive Canvas renderers for spatial diagrams.

- [P1] The Plan A and Plan B visuals do not clearly communicate their material systems.
  Location: `.plan-card` illustration regions.
  Evidence: Plan A is only eight rounded bars; Plan B is a clipped CSS silhouette. Neither has a stable ground plane, mechanical relationship, or clear projector/model geometry.
  Impact: the two material strategies are harder to compare and appear unfinished.
  Fix: draw both diagrams at consistent aspect ratios with a shared dark visual system and explicit 3D depth.

- [P2] The drawing proposal preview is too sparse and does not show the proposed composition.
  Location: `.poster`.
  Evidence: repeated empty rectangles replace the central Manhattan terrain, year overlays, time series, and two technical sections described in the copy.
  Impact: the preview does not support the drawing proposal.
  Fix: render a full poster schematic with a central orange Manhattan terrain, four year panels, timeline, mechanical section, and projection section.

- [P2] Opacity-based entrance animation produces faded or blank anchored sections.
  Location: `.reveal` and the reveal observer.
  Evidence: anchor captures show dark sections as gray and content briefly near-invisible while the opacity transition completes.
  Impact: navigation can appear broken and visual QA becomes inconsistent.
  Fix: remove opacity hiding and keep content visible at all times.

## Required fidelity surfaces — baseline

- Fonts and typography: Apple-like system typography is coherent; no P1 typography mismatch.
- Spacing and layout rhythm: general page rhythm is strong, but diagram regions have unstable internal alignment.
- Colors and visual tokens: page tokens are consistent; Hero palette conflicts with the requested black/white/orange target.
- Image quality and asset fidelity: Hero and technical diagrams are insufficiently dimensional and look like CSS placeholders.
- Copy and content: research copy is coherent and complete.

## Comparison history

Iteration 0: baseline captured. P1/P2 findings remain.

Iteration 1: replaced the flat Hero grid with a responsive Canvas scene using a black field, white extruded Manhattan ground plane, perspective linework, and 64 orange rent columns. Rebuilt the field map with intrinsic grid areas and replaced the argument, Plan A, Plan B, and drawing placeholders with responsive Canvas diagrams.

Iteration 2: desktop section review confirmed aligned cards and diagrams without horizontal overflow. Mobile review found the Hero caption overlapping the bottom of the terrain frame; the frame was shortened and the card extended so the visualization and caption occupy separate regions. The mobile navigation label now reports both open and close states.

## Final evidence

- Reference + Hero in one comparison surface: `RECON/screenshots/hero-reference-comparison-1440.png`
- Desktop Hero: `RECON/screenshots/audit-after-terrain-detail-1440.png`
- Desktop field map: `RECON/screenshots/audit-after-fields-1440.png`
- Desktop argument: `RECON/screenshots/audit-after-argument-1440.png`
- Desktop material diagrams: `RECON/screenshots/audit-after-material-detail-1440.png`
- Desktop drawing proposal: `RECON/screenshots/audit-after-drawing-1440.png`
- Final mobile Hero: `RECON/screenshots/audit-after-mobile-hero-detail-final-390.png`
- Mobile field map, argument, Plan A, Plan B, and drawing: `RECON/screenshots/audit-after-mobile-fields-390.png`, `audit-after-mobile-argument-390.png`, `audit-after-mobile-plan-a-390.png`, `audit-after-mobile-plan-b-390.png`, and `audit-after-mobile-drawing-390.png`

## Required fidelity surfaces — final

- Fonts and typography: passed. System typography stays consistent across desktop and mobile.
- Spacing and layout rhythm: passed. Diagrams stay inside their cards and the 390 px page has no horizontal overflow.
- Colors and visual tokens: passed. The Hero now uses the requested black, white, and orange hierarchy while the rest of the site retains the Apple-like neutral system.
- Image quality and asset fidelity: passed. The reference comparison confirms oblique depth, a light ground plane, and vertical orange extrusion; technical diagrams now have stable geometry at both viewports.
- Copy and content: passed. No research content was removed during the repair.
- Interaction: passed. Sticky navigation, anchors, mobile menu states, Canvas resizing, and CSV-backed Hero data load without browser warnings or errors.

No actionable P0, P1, or P2 findings remain.

Final result: passed
