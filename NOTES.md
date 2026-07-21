# Implementation Notes

## Reuse strategy

The first visual draft explored Ci Song’s earlier `Precendent-Study/iteration` language. The current direction intentionally simplifies the site into a long-form, Apple-inspired product-page rhythm so the research content remains primary. The new project stays in a separate directory and repository; the original project is not modified.

The current design uses system typography, large editorial headlines, generous white space, shallow navigation, rounded content panels, soft gradients, and light scroll reveals. It references Apple’s presentation rhythm without copying Apple branding, product content, or media.

The rent data, research content, D3 terrain, drawing proposal, and material proposals are original to this assignment.

## Interaction notes

- The hero contains one lightweight D3 data join across 64 cells using the 2025 observations.
- The page uses ordinary vertical scrolling and anchor navigation.
- The Intersecting Fields diagram labels housing, mapping, data, mechanics, projection, and computation.
- A small IntersectionObserver adds subtle entrance transitions and respects reduced-motion preferences.

## Current first-draft limits

- Hex cells are a designed spatial sample rather than official neighborhood polygons.
- The lightweight GeoJSON boundary is contextual and intentionally simplified.
- ZIP-level ZORI is used for reproducible first-draft data; the next research pass can compare it with StreetEasy neighborhood-level median asking rent.
- Plan A has not yet passed the eight-column physical feasibility test.
- Plan B calibration is represented as a proposal, not a completed installation test.

## QA target

The site is checked at desktop and mobile widths through a local HTTP server, with console errors, anchor links, data integrity, relative paths, responsive layout, and the local D3 backup included in the test scope.
