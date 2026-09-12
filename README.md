# Orbital Cleanup v0.6

A mobile-first, standalone PWA build of the v0.532 canvas prototype. Collect debris, manage the added cargo mass, and bank the haul at the cleanup station before the run ends.

## Production deployment

Production URL:

**https://houseandrade.github.io/orbital-cleanup/**

GitHub Pages deploys automatically through `.github/workflows/deploy-pages.yml` whenever a commit reaches `main`. Feature branches do not deploy to the production Pages URL. The workflow validates the game and assembles a production-only artifact, keeping `index.html` at the artifact root alongside the manifest, service worker, icons, styles, and game code.

To release an iteration:

1. Complete and validate the work on a feature branch.
2. Open a pull request targeting `main`.
3. Merge only after the playtest build is explicitly approved.
4. Monitor the **Deploy production PWA to GitHub Pages** workflow in GitHub Actions. A successful run updates the production URL above.

All browser-facing paths are relative, so the PWA operates under the `/orbital-cleanup/` GitHub Pages project path. The service worker scope and offline cache remain within that project path.

## Run locally

The service worker requires HTTP rather than a `file://` URL. From this directory, run:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/` on a phone or desktop browser. After one successful online load, the app shell is available offline through the service worker.

Run the dependency-free gameplay acceptance checks with:

```sh
node tests/acceptance.mjs
```

## Controls

- Hold **THRUST** to climb; release it to let gravity pull you down.
- Tap **TETHER** near debris to reel it in; tap again to cancel.
- Hold **DEPOSIT** near the cleanup station to bank the current haul and repair 12% integrity.

## Project structure

- `index.html` — accessible application shell and overlays
- `styles.css` — mobile layout, safe areas, and input protections
- `src/game.js` — game state, simulation, rendering, and controls
- `manifest.webmanifest` — install metadata
- `service-worker.js` — offline app-shell cache
- `icons/` — temporary v0.6 placeholder icons; replace before a polished release
- `reference/prototype-v0.532.html` — untouched behavioral reference
- `tests/acceptance.mjs` — deterministic checks for core mechanics and PWA assets

No build step or framework is required.
