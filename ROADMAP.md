# Orbital Cleanup — Roadmap

## Phase 1 — v0.6 Shareable PWA

Status: complete on `main`.

Delivered:

- Standalone static project based on the v0.532 behavioral reference
- Mobile-first responsive layout and safe-area handling
- Anti-scroll, anti-selection, long-press, and pointer-capture protections
- Title screen and short first-play instructions
- Persistent local high score
- Web app manifest, offline service worker, and placeholder install icons
- Static-host readiness and deterministic acceptance checks

The next action is outside playtesting, not feature expansion.

## Phase 2 — Playtest instrumentation

Goal: learn whether the loop works before adding content.

Potential metrics:

- Runs started and run duration
- Banked score and unbanked haul lost
- Cause of death
- Maximum cargo mass
- Deposits and objects collected
- Time spent in high, mid, and low orbit
- Voluntary second-run rate

Primary signal: the percentage of first-time players who voluntarily start a second run.

Optional post-run feedback:

- Fun? 😐 / 🙂 / 🤩
- What felt frustrating: controls, collisions, difficulty, unclear instructions, or other

Instrumentation design should be reviewed before implementation, especially any external analytics or data collection.

## Phase 3 — Core gameplay refinement

Use playtest evidence to decide whether to tune:

- Orbit risk and reward
- Gravity, thrust, and cargo-mass curves
- Collision damage
- Debris density and targeting feedback
- Cleanup-station visibility and cadence
- Average run length

Do not change tuning without documenting the evidence and decision in `HANDOFF.md`.

## Phase 4 — Progression and replayability

v0.7 level-system foundation implemented for review at Brian’s request. Playtest balance before expanding.

Possible later backlog includes combos, additional debris classes, rare or dangerous objects, missions, upgrades, stronger suits, and difficulty escalation. None are committed features.

## Phase 5 — Presentation and polish

- Replace placeholder app icons
- Improve astronaut, Earth, debris, and station art
- Add animation, parallax, audio, music, and haptics where supported
- Refine the title and game-over presentation

## Delivery workflow

Each new iteration starts on a feature branch. When it is ready for testing, commit it clearly and open a pull request against `main`. Keep `main` on the latest explicitly approved stable playtest build; do not merge without explicit approval.

## v0.7 — Level System

Implemented for review: configuration-driven Levels 1–3, bank-value objectives, optional three-star goals, safe-deposit completion choice, local progression, and replay. No fuel.

Next: playtest First Haul, Junkyard, and High Roller for understandable goals and worthwhile additional trips. Levels 4–10 remain future experiments in geometry, rewards, objectives, movement, and constraints. Campaign, Contracts, and Endless should eventually share the configuration-driven engine; neither future mode is implemented.

Playtest follow-up: protect against accidental campaign exits with header navigation and a paused leave confirmation. Implemented for review.

## v0.8 — Endless Orbit follow-up

Implemented for review: Endless Orbit is available from the start, with no campaign unlock. It restores the original MVP debris/values and station cadence through a shared-engine configuration with no completion objective. Separate local best banked score, same-mode replay, protected exit, and a Level 3 completion shortcut are included. No fuel, difficulty ramp, Contracts, or additional campaign levels. Prior notes deferring Endless are superseded by this player-requested scope.
