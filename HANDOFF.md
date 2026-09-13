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

## v0.7 implementation

The `codex/v0.7-level-system` branch introduces three configured campaign levels; production remains v0.6 until approved and merged. `src/levels.js` owns configurations, criteria, and versioned local progress. The existing game engine consumes the selected configuration.

- First Haul: five slow mid-orbit panels, a more frequent station, $60 / $120 / $200 targets.
- Junkyard: eight objects across the original three bands, broader values, $150 / $300 / $500 targets.
- High Roller: seven ordinary objects plus one gold-marked $300 satellite at altitude 112; $150 / $350 / $600 targets. The satellite returns if missed and is not replaced if collected.
- A safe qualifying deposit pauses play for Finish Level or Keep Salvaging. Finishing commits completion and best stars, unlocking the next level. Failure after continuing remains Game Over and does not commit that attempt's stars.
- Completing all three levels offers replay; campaign selection supports any unlocked level. Storage failures do not prevent play. Existing high scores remain separate.
- Movement, cargo effects, tether range, deposit repair, and failure causes are retained. No fuel is introduced.
- Counts, bands, and station timing above intentionally replace single-run v0.6 tuning to serve the requested three-level prototype. These are initial playtest values, not validated balance conclusions.

Validation: `node tests/acceptance.mjs` now also covers objectives, ratings, completion choices, progression, replay bests, save reload/corruption/unavailable storage, special-target return, failure/deposit ordering, and offline level data.

## Safe campaign exit follow-up

Menu navigation now sits in the header, away from flight controls. During an active run or objective choice, Menu pauses and requires an explicit Leave to Campaign action; Keep Playing restores the prior state without discarding score or cargo. The offline cache advances to v0.7.1. Regression checks cover pause, cancel, confirmed exit, and objective-choice restoration.

## v0.8 — Endless Orbit follow-up

Implemented for review: Endless Orbit is available from the start, with no campaign unlock. It restores the original MVP debris/values and station cadence through a shared-engine configuration with no completion objective. Separate local best banked score, same-mode replay, protected exit, and a Level 3 completion shortcut are included. No fuel, difficulty ramp, Contracts, or additional campaign levels. Prior notes deferring Endless are superseded by this player-requested scope.

## v0.8.1 — Approved layout and pixel-art pass

Implemented for review: separate Campaign/Endless menu cards, persistent campaign star targets and bank progress, banked/carried dashboard, integrity/cargo, generated Earth and sprite artwork, restart confirmation inside paused Menu, and result-screen menu navigation. Station labels now depend on visible station bounds, approach direction, and deposit range. The artwork atlas is opaque, so draw-only silhouette masks exclude its background. Physics and collision parameters remain untouched. Canvas presentation crops unused world margins (y=60 through 460); it does not change simulation bounds. Acceptance checks cover station states, bank-only stars, HUD values, restart confirmation/cancel, and offline art assets. Browser QA covered 375×667 and 320×568 layouts and menu/flight/pause navigation.

## v0.8.2 — Mobile input safety

Restore WebKit-prefixed selection protection and suppress native touch/double-tap gestures on the flight controls and canvas. Hold controls track one pointer each, release on capture loss, cancellation, outside release, page hiding, or window blur, and clear ownership on gameplay transitions. Independent thrust/deposit fingers remain supported. Menu scrolling and browser zoom outside flight surfaces remain available. Acceptance checks include multi-pointer ownership, interruption recovery, and gesture cancellation. Real iOS Safari/PWA retesting is needed to confirm the reported device-specific failures.

## PWA update recovery

Fix for devices stuck on older builds: release-specific install fetches bypass stale HTTP cache entries, HTML references versioned scripts/styles, and worker registration explicitly checks for updates. `update.html` provides a save-preserving refresh: after checking connectivity it unregisters only this project’s worker and removes only Orbital Cleanup asset caches. It never accesses localStorage. The main menu links to it; older builds can open it directly. Tests cover fresh install requests, failed-install behavior, cache isolation, and saved-data isolation. Production approval is required before merging.

## v0.9 — Levels 4–5

Implemented for review: Recovery Detail requires 10 banked objects, with $400/$650 banked for additional stars after the quota. Temptation uses $350/$650/$1,000 targets, mid-orbit $40–$60 panels, and recurring high-orbit $150–$200 satellites. Banked-object counts accumulate across safe deposits and never include carried/lost cargo. HUD, briefing, result text, five-level menu, saved progress, and offline release URLs are updated. Existing Levels 1–3 and Endless tuning is unchanged. Tests cover multi-trip counts, quota plus value criteria, failure/reset, replay bests, old saves, and all five levels. Next: playtest whether small-object quota and recurring valuable boundary targets create different choices.

## v0.10 — Encounters and Endless progression

Ready for review. Station status counts down to the horizontal deposit window; players must still align altitude. The next return is sampled in advance from the existing ranges so the departure countdown is accurate. Station speed, opening coordinates, return ranges, campaign targets, physics, and mobile input protections are unchanged.

Recovery Detail reserves three of its eight slots for lightweight scrap pockets: 32px spacing, shared speed, and a compact altitude spread. A cleared or missed pocket returns as a group. Temptation reserves one slot for a $150–$200 high-orbit satellite that crosses the player four seconds before station range on every pass. Both patterns are data in `src/levels.js`, consumed by the shared engine. No new drift behavior.

Endless phases use banked value within a repeating $750 cycle: Open field at $0, Scrap pockets at $150, High-value passes at $300, Recovery stretch at $500. Recovery uses five light mid-orbit objects. A deposit previews the resulting phase; Keep Salvaging applies it to future spawns, preserving debris and tethers already in flight. Large deposits select the phase for the resulting bank total. Timed encounters begin with the next station return after entering that phase.

Score milestones are $150, $300, $500, $750, $1,000, then every $250 indefinitely. Banking across a milestone announces it. Every successful Endless deposit pauses for Keep Salvaging or Finish Run Successfully, including deposits below $150. Finishing shows Run Complete without campaign stars or unlocks; continuing retains normal failure outcomes. The existing separate Endless best and campaign save keys are retained; no save migration or new persistent fields.

Validation: `node tests/acceptance.mjs` covers countdown/queued returns/pause, pocket recurrence and capacity, encounter alignment, bank-only phase transitions and previews, multi-threshold deposits, repeated cycles, finish/replay/failure, existing saves, mobile pointer ownership, and offline update isolation. Browser QA verified flight, banking preview, and successful finish at 320×568 and 375×667 with no console errors. Real iOS gesture behavior and initial balance settings still need hands-on playtesting. Fuel, upgrades, drifting debris, and new campaign levels remain deferred. Do not merge or deploy without approval.

## v0.11 — Contract playtest build

Implemented nine contracts, separate saved career wallet, once-per-run deposit-triggered bonuses, workshop, and three tiers each of reel and thrust upgrades. User explicitly requested upgrades apply across all modes; every run now snapshots owned gear. Only Contracts earn wallet currency. Sprite at `src/art/contracts.png` matches the existing menu palette and is cached offline. See README for initial prices, tier requirements, save semantics, and validation. Playtest preview uses port 8081 because 8080 already serves an older build. No merge or deployment performed.

## v0.12 — Levels 6–7 and new salvage (in playtest)

Adds Lost Equipment (bank 5 tool crates; $550/$850 for additional stars) and Heavy Metal (bank 3 rocket fragments; $750/$1,100 for additional stars). Both require deposited target items for every star tier. Tool crates are $60–$80, 8kg; rocket fragments are $130–$170, 18kg. Finite campaign pools supply seven crates in Level 6 and five rocket fragments in Level 7; missed items loop around and collected targets never replenish. New items use the approved transparent pixel art. Existing reel duration and cargo physics make fragments slower/heavier; collision base damage is 13 for crates and 22 for fragments, versus 11 for panels and 18 for satellites. These are initial content values for playtesting, chosen to differentiate medium equipment from heavy engines; existing items and flight physics are unchanged.

Adds Equipment Return (5 crates, $500 bonus) and Engine Recovery (3 fragments, $700 bonus), preserving existing contracts, prices, and upgrade gates. Endless mixes crates into Scrap pockets and fragments into High-value passes without changing the opening field, recovery phase, phase thresholds, or milestones. Campaign saves keep their existing keys and unlock Level 6 after a saved Level 5 completion. Level 7 is the last currently available mission, not the World One finale. Production remains on the prior approved release until this build is approved.


### v0.12 playtest adjustment — salvage2

Brian found new items too common and clustered, allowing Heavy Metal to finish at the first station pass. Campaign target pools now contain the objective count plus two spares: seven TOOL items spaced 360px apart (12s at 30px/s) and five ROCKET items spaced 480px apart (16s at 30px/s). Shared speeds preserve spacing, and missed objects wrap by the pool circumference. Normal debris has five slots and contains only panels/scrap in these missions; collecting a limited target does not spawn a replacement. Replay restores the pool. Contracts retain repeatable weighted target spawns and Endless is unchanged.

Brian also found per-item deposits slow. Transfer times are reduced 20% (0.3s cap to 0.24s, mass rate 18 to 22.5kg/s). Credit, dot removal, and target count updates still happen together for each item. Acceptance checks cover finite counts, gaps, first-pass quota limits, wrapping, no replenishment, replay reset, and interrupted banking.


### v0.12 playtest adjustment — salvage3

Brian approved the revised campaign pacing but found the new contract and Endless items too dense and frequent. Equipment Return and Engine Recovery now exclude new items from random bands and reserve one scheduled-salvage slot. Minimum spawn intervals are 12s for crates and 16s for fragments. Endless uses the same single-item cap with 18s/24s intervals in Scrap pockets/High-value passes. The first spawn waits 8s, travels at 30px/s, and takes another 6s to reach the astronaut. A live scheduled item blocks another across type/phase changes; collected items do not reset the spawn clock. Missed items leave the field and later arrivals remain available. Phase changes preserve existing items and impose at least an 8s delay before new rare spawns; missed intervals never produce catch-up clusters. Normal debris fills the other slots.

Campaign finite pools and salvage2 deposit speed remain unchanged. Tests cover cooldowns, single-item caps, replay, preserved in-flight salvage across Endless phases, and all prior acceptance scenarios. Initial timing remains subject to user playtest.
