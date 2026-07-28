# Research Foundations + Project Outline — Second Draft

**From Images to Places: What New Possibilities Does Gaussian Splatting Create?** is Ci Song's second-draft research website for Summer Colloquium 2026 at Columbia GSAPP.

The project asks how ordinary video can become a spatial record that people can revisit, share, compare, and question. Its core concept prototype connects a captured apartment interior to floor, viewpoint, window direction, city context, and visible evidence status.

## Published website

https://cisanotheraccount.github.io/Research-Foundations-Project-Outline/

## Assignment confirmations

- **Drawing type:** Exploded Spatial Evidence Section
- **Final print:** 36 × 72 inches, portrait, matte plot
- **Proof sequence:** 11 × 17 proof, half-scale review, full-size print
- **Material gesture:** A browser-based spatial record viewed through a simple physical window frame
- **Setup:** Laptop, web viewer, monitor or short-throw projection, physical frame, one input control, and the printed drawing

The WIP drawing is stored in `assets/drawing/` as SVG, HTML, and PDF. The uploaded
[Google Drive copy](https://drive.google.com/file/d/14orwlnLF13xBEfLNPoCNzqlTcwalP2VG/view?usp=sharing)
has read-only access enabled for the Columbia domain; the published website also hosts the same PDF publicly.

## Run locally

From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Technical structure

The site is static HTML, CSS, and JavaScript. The second draft intentionally uses lightweight diagrams and one concept interaction rather than a heavy 3D viewer. A real Gaussian Splat scene will only be connected after a legally usable capture has been obtained and tested.

## Evidence boundary

- `Captured` means actual footage or scanning.
- `Registered` means position, direction, and height have been aligned.
- `Modeled` means the content comes from project-owned or legally loaded geometry.
- `Inferred` means the content is estimated from related evidence.
- `Unverified` means it has not been checked against the real place.

The current apartment interface is a concept response. It does not claim that a public apartment splat, full-city registered model, or verified window-view calculation has already been completed.

## Previous draft

The first-draft **Rent as Terrain** website remains preserved in Git history through commit `a8e26a9`.
