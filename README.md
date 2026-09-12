# Orbital Cleanup v0.6

A mobile-first, standalone PWA build of the v0.532 canvas prototype. Collect debris, manage the added cargo mass, and bank the haul at the cleanup station before the run ends.

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
