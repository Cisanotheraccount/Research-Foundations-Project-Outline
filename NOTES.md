# Implementation Notes

## Reuse strategy

This website is a content-and-visual continuation of Ci Song’s earlier `Precendent-Study/iteration` website. The new project was copied into a separate directory and repository; the original project was not modified.

Reused design DNA and code include IBM Plex Mono + Inter, the cool-gray atmospheric field, fixed full-screen experience, WebGL particle simulation, glass scene cards, right-side chapter rail, scroll/touch/keyboard chapter transitions, loader, responsive breakpoints, and reduced-motion fallback.

The rent data, scene content, chapter structure, particle target forms, D3 terrain, controls, and material proposals are new for this assignment.

## Interaction notes

- The main terrain uses D3 data joins across 64 SVG hexagonal prisms inside the cinematic WebGL experience.
- Slider, Play/Pause, and left/right arrow keys move between 2010 and 2025.
- Hover and keyboard focus expose neighborhood, year, rent, annual change, and physical height.
- Missing observations are rendered gray and labeled `No data`.
- Comparison mode places the unavailable 2010 condition beside the 2025 terrain.
- Thirteen reversible chapters use the previous iteration’s particle-morph and right-rail interaction model.
- The Intersecting Fields scene adds labeled particle nodes for housing, mapping, data, mechanics, projection, and computation.

## Current first-draft limits

- Hex cells are a designed spatial sample rather than official neighborhood polygons.
- The lightweight GeoJSON boundary is contextual and intentionally simplified.
- ZIP-level ZORI is used for reproducible first-draft data; the next research pass can compare it with StreetEasy neighborhood-level median asking rent.
- Plan A has not yet passed the eight-column physical feasibility test.
- Plan B calibration is represented as a proposal, not a completed installation test.

## QA target

The site is checked at desktop and mobile widths through a local HTTP server, with WebGL initialization, console errors, data integrity, chapter controls, terrain controls, relative paths, fallback content, and the local D3 backup included in the test scope.
