# From Images to Places — Opening V2

A local cinematic opening prototype for the Columbia GSAPP Gaussian Splatting presentation.

The first viewport is one continuous 12-second spatial transformation:

`3D room → flat image → phone capture → LiDAR → mesh → Gaussian field`

Nothing flips between slides. The room remains in one camera space while its representation changes. The interface stays black, white and gray; the room’s natural color is treated as source media rather than interface decoration.

## Controls

- The sequence starts automatically.
- `Pause` freezes the entire visual timeline.
- `Replay` restarts it from the three-dimensional room.
- `prefers-reduced-motion` shows the final stable state without autoplay.

## Local development

```bash
npm install
npm run dev
npm test
```

The current prototype is intentionally local-only and has not been connected to or published over the existing public research website.
