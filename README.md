# Sneyk

A premium, minimal, retro pixel-grid Snake game built for the modern browser. Inspired by the classic Nokia 6110 gameplay, built with strict TypeScript, HTML5 Canvas, Web Audio API, and custom design styles.

### [🎮 Play Sneyk Live Demo](https://moinchanna.github.io/sneyk-game/)

_(Deployment configuration is automated via GitHub Actions to GitHub Pages)_

## Features

- **Retro-Modern Visuals**: Custom dark surface container centered on a light-gray canvas, inspired by high-end application wrappers.
- **Winding Background Animation**: The landing page features a decorative, slow-slithering snake wandering across a pixel grid with zero layout shifts.
- **Fluid & Buffered Controls**: Direct 180-degree self-collisions (e.g. hitting LEFT while moving RIGHT) are physically blocked via a 2-key input buffer queue.
- **Web Audio Synth Effects**: Audio cues synthesized dynamically inside the browser (C5-A5 ping sweep for eating, sawtooth slide for game over) using the Web Audio API. Muted by default.
- **High-DPI / Retina Crispness**: Resolution-aware canvas scaling matching the device's physical pixel ratio for perfectly sharp lines.
- **Accessibility Forward**: Full keyboard navigation, visible focus state highlights, screen-reader announcer hookups, PWA theme-colors, and a custom detail pattern inside the red food cell for color-blind users.
- **Reduced Motion Support**: Respects `prefers-reduced-motion` settings by disabling pulsing food states and particle explosions when enabled.
- **Local Persistence**: Saves sound preferences, reduced-motion preferences, and best scores in `localStorage` safely.

---

## Controls

### Keyboard (Desktop)

- **Arrow Keys** or **WASD**: Slither in direction.
- **Space** or **P**: Pause / Resume.
- **R**: Restart game.
- **Escape**: Exit to Home Screen.

### Touch (Mobile & Tablet)

- **Swipe Gestures**: Swipe anywhere on the game board container to slither.
- **Action Buttons**: Visible start prompt overlays and HUD controls for easy tap navigation.

---

## Architecture Overview

The codebase is structured modularly:

```
src/
├── main.ts              # App entrypoint (imports styles & initializes AppController)
├── game/
│   ├── Game.ts          # State machine and event coordinator
│   ├── GameLoop.ts      # Fixed-timestep loop (decouples ticks from frame refresh rate)
│   ├── Snake.ts         # Coordinates, segments, moves, growth, and collision checks
│   ├── Food.ts          # Safe random food spawning (guaranteed termination)
│   ├── InputManager.ts  # Keyboard buffers and touch swipe gesture handlers
│   ├── Renderer.ts      # Canvas context wrapper (Retina rendering, particles, detail markers)
│   ├── AudioManager.ts  # Synthesizes click, eat, and game-over synth tones
│   ├── Storage.ts       # Safe localStorage reading and writing
│   ├── constants.ts     # Global configs (speeds, grid segments)
│   └── types.ts         # Shared typescript interfaces
└── ui/
    ├── AppController.ts # Coordinates screen switches and DOM event listener bindings
    ├── HomeScreen.ts    # Manages landing UI and background decorative canvas slither
    └── GameScreen.ts    # Synchronizes scores and toggles overlay displays
```

---

## Local Development

To run the game locally, you need [Node.js](https://nodejs.org) installed.

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Dev Server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your web browser.

3. **Run Unit Tests**:

   ```bash
   npm run test
   ```

4. **Lint Code**:

   ```bash
   npm run lint
   ```

5. **Build Production Bundle**:

   ```bash
   npm run build
   ```

   Build outputs are compiled into the `dist/` directory.

6. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## Deployment to GitHub Pages

Sneyk is configured for continuous deployment using GitHub Actions.

The deployment configuration is defined in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). When code is pushed to the `main` branch, the workflow will automatically:

1. Checkout the repository.
2. Setup Node.js.
3. Install dependencies using `npm ci`.
4. Run `npm run lint` and `npm run test` to verify build quality.
5. Build the static production bundle using `npm run build`.
6. Deploy the generated `dist/` assets folder to GitHub Pages under the subpath `/sneyk-game/`.

---

## Contributions

Contributions are welcome! Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for pull request instructions.

## License

Sneyk is open-source software licensed under the [MIT License](LICENSE).
