# Orbital Cleanup v0.8.1

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
- `src/levels.js` — campaign configurations, criteria evaluation, and local progress
- `src/game.js` — game state, simulation, rendering, and controls
- `manifest.webmanifest` — install metadata
- `service-worker.js` — offline app-shell cache
- `icons/` — temporary v0.6 placeholder icons; replace before a polished release
- `reference/prototype-v0.532.html` — untouched behavioral reference
- `tests/acceptance.mjs` — deterministic checks for core mechanics and PWA assets

No build step or framework is required.

## v0.7 campaign

Choose one of three sequentially unlocked levels. Bank the mission target, then choose **Finish Level** or **Keep Salvaging** at the paused deposit screen. Every subsequent qualifying deposit offers that choice again. Finishing saves completion and the best star rating; failing keeps the existing Game Over outcome and loses unbanked cargo. A qualifying deposit alone does not save campaign completion. Replay completed levels from Campaign; the header Menu pauses an active run and asks before discarding it. Keep Playing preserves the run. Progress is local to the browser, with an in-memory fallback when storage is unavailable.

`src/levels.js` defines field boundaries, player starting altitude/integrity, station cadence, weighted debris bands (altitude, speed, value, mass, size, and existing visual type), an optional single special target, an objective, and ordered star criteria. The engine reads these on reset and spawn. Normal debris replenishes as in v0.6; a missed special satellite returns, but a collected one does not respawn during that run. Bank targets use the original game's value scale.

Add future criterion types to `meets`; add future content as configurations. Only bank-value objectives and objective-completion/bank-value stars exist today. Field dimensions and artwork remain the original canvas geometry. Contracts, other objectives, and fuel are outside this release.

## v0.8 — Endless Orbit

Endless Orbit is available immediately in the main menu, independent of campaign completion. It uses the original MVP debris bands, fixed values, eight replenishing objects, and recurring station passes. Safe deposits keep the run going; boundary or suit failure ends it. No fuel or difficulty ramp is added.

The endless configuration uses the same engine with no objective and no stars. Its best banked score is stored separately under `orbital-cleanup-endless-best-v1`, updated at deposits and preserved across replay. Existing combined legacy/campaign scores are not imported because their source cannot be distinguished. Completing Level 3 also offers a direct Endless Orbit launch. Safe Menu exit applies to both modes.

## v0.8.1 — Flight UI and artwork

The main menu separates Campaign and Endless. During flight, the dashboard shows the bank target, all three star thresholds, banked versus carried value, integrity, and cargo. Endless shows its personal best instead of stars. Restart lives in the paused Menu and requires confirmation. Results include a Main Menu action.

Station status is blank while offscreen or departing outside deposit range, “Station approaching” only when visible and moving toward the player, and “Station in range” when a deposit is possible. Transfer feedback remains visible while depositing.

`src/art.js` draws generated pixel artwork from `src/art/` with silhouette masks to exclude the atlas background. The original drawing code remains a fallback if artwork fails to load. Art changes do not alter physics, hitboxes, tether range, or rewards. The canvas displays a 360×400 crop starting at world y=60; simulation coordinates remain 360×520, with both failure boundaries visible. Assets are cached offline and included by the existing recursive `src` deployment copy.

## v0.8.2 — Mobile input safety

Restore WebKit-prefixed selection protection and suppress native touch/double-tap gestures on the flight controls and canvas. Hold controls track one pointer each, release on capture loss, cancellation, outside release, page hiding, or window blur, and clear ownership on gameplay transitions. Independent thrust/deposit fingers remain supported. Menu scrolling and browser zoom outside flight surfaces remain available. Acceptance checks include multi-pointer ownership, interruption recovery, and gesture cancellation. Real iOS Safari/PWA retesting is needed to confirm the reported device-specific failures.
