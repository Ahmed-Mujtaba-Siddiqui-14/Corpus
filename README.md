# Corpus — Interactive Human Anatomy

Made by **Ahmed Mujtaba Siddiqui**.

Live website: https://Ahmed-Mujtaba-Siddiqui-14.github.io/Corpus/

An interactive educational anatomy explorer with seven body systems, clickable structures, guided biological processes, and detailed reference organ surfaces.

## Features

- Digestive, respiratory, circulatory, nervous, muscular, skeletal and urinary systems
- Full-body X-ray and cutaway views, with X-ray enabled by default
- Automatic body rotation, camera zoom and organ close-ups
- Beginner and advanced explanations, labels and direction-of-flow animations
- Play/pause, restart, playback speed and step controls
- Optional synthesized process audio with volume controls
- Desktop workspace and responsive mobile layout

## Run locally

Requires Node.js 22.13 or newer. Use the pnpm version declared in `package.json`.

```sh
npx pnpm@11.25.0 install
npx pnpm@11.25.0 dev
```

Open the local URL printed by the development server (normally http://localhost:3000).

```sh
npx pnpm@11.25.0 build
npx pnpm@11.25.0 start
```

The project uses React, TypeScript, Three.js, Next.js, and Tailwind CSS. `app/` contains the interface, lessons, model registration, rendering and audio. `public/models/` includes the anatomical reference assets and their attribution.

## Anatomy and attribution

Reference organs are adapted from the HuBMAP CCF 3D Reference Object Library. Bones, muscle groups, surrounding vessels, nerves and process close-ups include simplified educational geometry. Textures, movement timing, flow colors and sounds are illustrative. See [`public/models/ATTRIBUTION.md`](public/models/ATTRIBUTION.md) for source credits and the reference assets' CC BY 4.0 license.

External genital detail is removed from the supplied body surface. This assembled application is intended for learning and is not a clinically validated anatomical atlas.

The website is a static Next.js export. GitHub Actions builds the static export and deploys `out/` to GitHub Pages. The initial import archives expand automatically into the repository. To rebuild locally for this repository, set `NEXT_PUBLIC_BASE_PATH=/Corpus` and run the build. Local frontend development does not require a paid API or secret key.
