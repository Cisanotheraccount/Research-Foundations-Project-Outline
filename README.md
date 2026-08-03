# From Images to Places — Opening V2

A local cinematic opening prototype for the Columbia GSAPP Gaussian Splatting presentation.

The first viewport is a user-controlled spatial transformation:

`3D room → flat image → phone capture → LiDAR → mesh → Gaussian field`

Nothing flips between slides and nothing advances automatically. The room is built from real WebGL geometry: walls, floor, ceiling, window, sofa, table, shelving, lighting and objects all exist in depth. The first Space press compresses that geometry and crossfades to a 2D render captured from the same scene.

## Controls

- The opening begins as an idle three-dimensional room.
- Each `Space` press triggers exactly one gradual transformation.
- Step 1 compresses the room into a camera-rendered image.
- Step 2 restores spatial depth behind a moving phone path.
- Step 3 moves the same room through LiDAR points, wireframe mesh and anisotropic Gaussian sprites.
- `Replay` rebuilds the room and returns to the beginning.
- `prefers-reduced-motion` shows the final stable state without autoplay.

## Local development

```bash
npm install
npm run dev
npm test
```

The current prototype is intentionally local-only and has not been connected to or published over the existing public research website.
