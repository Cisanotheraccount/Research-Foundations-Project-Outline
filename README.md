# From Images to Places — Cinematic Record Evolution

A local, presentation-ready website for the Columbia GSAPP Gaussian Splatting project.

The opening is a user-controlled spatial transformation:

`3D room → flat image → phone capture → LiDAR → mesh → Gaussian field`

It continues into four full-viewport chapters:

`Photo → Video / Stereo → 3DGS → 4DGS`

Nothing flips between slides and nothing advances automatically. The opening room is real WebGL geometry. Its final state resolves into the official Inria 3DGS result so a conceptual Gaussian transition is never presented as a trained reconstruction.

## Controls

- The opening begins as an idle three-dimensional room.
- Each `Space` press triggers exactly one gradual transformation or one chapter animation.
- Step 1 compresses the room into a camera-rendered image.
- Step 2 restores spatial depth behind a moving phone path.
- Step 3 moves the same room through LiDAR points, wireframe mesh and anisotropic Gaussian billboards, then crossfades to an official 3DGS result.
- A second `Space` press after a chapter finishes moves smoothly to the next chapter.
- Wheel down plays an unfinished chapter; wheel up reverses it. Once the chapter reaches an endpoint, native page scrolling resumes.
- `Replay` rebuilds the room and returns to the beginning.
- `prefers-reduced-motion` shows the final stable state without autoplay.

## Evidence and sources

- Photo and stereo frames: Charlotte May / Pexels.
- 3DGS: official Inria / SIGGRAPH 2023 playroom result.
- 4DGS: official CVPR 2024 result, CC BY-SA 4.0.
- *Interstellar* (2014) tesseract image: classroom-only visual metaphor.

See `public/media/record-evolution/source-manifest.md` for the detailed asset audit.

## Local development

```bash
npm install
npm run dev
npm test
```

This project is intentionally local-only and has not been connected to or published over the existing public research website.
