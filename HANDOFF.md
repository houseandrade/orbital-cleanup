# Orbital Cleanup — Handoff

## Current state

`main` contains the stable v0.6 mobile-first PWA playtest build. The original v0.532 single-file prototype is preserved unchanged at `reference/prototype-v0.532.html` and remains the behavioral baseline for the core loop.

The v0.6 build separates the game into a maintainable static project with no build step:

- `index.html` — application shell, title screen, and game-over UI
- `styles.css` — mobile layout, safe-area handling, and input protections
- `src/game.js` — gameplay simulation, rendering, and controls
- `manifest.webmanifest` and `service-worker.js` — installability and offline app shell
- `icons/` — temporary placeholder install icons
- `tests/acceptance.mjs` — deterministic core-loop acceptance checks

## Core loop and tuning

Preserve these decisions unless a later product decision explicitly changes them:

- The astronaut is horizontally stationary; the world moves past the player.
- Movement is altitude-only: hold THRUST to climb and release for gravity.
- Base gravity is 26; base thrust is 72.
- Cargo adds inertia and slightly increases gravity.
- Thrust effectiveness must never fall below 75%.
- Escape occurs above `y = 75`; reentry occurs below `y = 360`.
- Boundary warnings begin near `y = 135` and `y = 300`.
- Eight debris objects are active at once across high, mid, and low orbit.
- Tether range is 82px. Reel time is `0.55 + mass × 0.025` seconds.
- A second tether press cancels an active tether.
- Deposit requires holding for roughly 1.25 seconds near the cleanup station.
- A successful deposit banks the current haul, clears cargo mass, and repairs 12% integrity.
- Collisions cause type- and relative-speed-based damage, knockback, flash, shake, particles, and impact feedback.
- Game-over causes are REENTRY, LOST IN SPACE, and SUIT FAILURE.
- Game over displays Banked Score and Haul Lost; Play Again starts a fresh run.
- High score is the highest banked score and persists in local storage.

## Mobile and PWA requirements

- Prevent accidental scrolling, text selection, and long-press callouts during play.
- Use pointer events and pointer capture for hold controls.
- Respect device safe areas and maintain touch targets of at least 44px.
- Keep the app usable at iPhone-sized portrait viewports.
- Keep the manifest and offline service-worker cache valid for static hosting.
- Replace the placeholder icons before a polished public release.

## Repository workflow

The canonical repository is `https://github.com/houseandrade/orbital-cleanup`.

- `main` represents the latest stable playtest build.
- Begin new implementation work on a feature branch.
- Use clear, focused commit messages.
- Open a pull request when an iteration is ready for playtest or review.
- Do not merge a pull request into `main` without Brian's explicit request.
- Update this file and `ROADMAP.md` whenever a durable gameplay or product decision changes.

## Validation

Run:

```sh
node tests/acceptance.mjs
python3 -m http.server 8080
```

Then test `http://localhost:8080/` at a narrow mobile viewport. The acceptance harness covers the thrust floor, tether completion and cancellation, deposits and repair, all three game-over causes, score presentation, high-score persistence, replay reset, and manifest icon assets.

## Product question

The current playtest should answer:

> Do first-time players enjoy the core loop enough to voluntarily start another run?
