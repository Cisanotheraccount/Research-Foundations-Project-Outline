# FROM PHOTOGRAPHS TO SPATIAL FIELDS

Version 1 of a presentation-ready, interactive website for the Columbia GSAPP Gaussian Splatting project.

The site follows one continuous vertical narrative:

`3D space → photograph → video → spatial representations → 3DGS → 4DGS → history → applications → open question`

It combines native page scrolling with presentation controls. Space, Arrow Up/Down, the mouse wheel, and the chapter dots move through the story; chapter-specific animations remain reversible. Section 04 uses the project's own Continental Rooftop Gaussian Splatting capture and interactive camera path.

## Version

- Stable snapshot: **Version 1**
- Frozen: **August 5, 2026**
- Git tag: `from-photographs-to-spatial-fields-v1`
- GitHub branch: `from-photographs-to-spatial-fields-v1`

Future changes continue in the separate Version 2 working copy.

## Controls

- `Space` or `Arrow Down`: advance an animation step or continue to the next chapter.
- `Arrow Up` or upward wheel movement: rewind where supported.
- Mouse wheel / trackpad: control the current sequence, then resume normal vertical scrolling.
- Right-side dots: jump directly to the corresponding page.
- `prefers-reduced-motion`: presents a stable, reduced-motion version.

## Evidence and sources

- Original project capture: Continental Rooftop, 2026.
- Photo and video sequences: credited source footage recorded in the source manifests.
- 3DGS and 4DGS technical examples: official project material where identified.
- Conceptual and derived visuals are labeled separately from technical results.

See the source manifests under `public/media/` for the detailed asset audit.

## Local development

```bash
npm install
npm run dev
npm test
```

The local development server defaults to `http://localhost:3000/`.
