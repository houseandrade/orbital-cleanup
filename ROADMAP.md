# Orbital Cleanup — Roadmap

## Current roadmap — September 13, 2026

1. **Earth / World One: complete and deployed.** Ten campaign missions, checkpointed finale, Contracts, and Endless Orbit are available. Shared upgrades include reel motor, thruster power, and deposit speed.
2. **Moon / World Two: complete and deployed.** All ten missions are live, including Last Rover’s three checkpointed assignments, independent Moon checkpoint/reward handling, completion badge, and one-time $2,000 reward. Approved lunar artwork, vertical drift, and station-timed recovery are implemented. See [Moon campaign record](MOON-CAMPAIGN-PLAN.md).
3. **Moon mode support: complete and deployed in v0.15.5.** Six Moon contracts use Earth/Moon navigation, difficulty sorting, and inline briefings. Starting a Moon campaign mission sets the persistent active world; browsing, contracts, and Earth replays do not reset it. Endless follows that world, labels its destination, and preserves separate Earth/Moon best scores. PR #22 deployed successfully; Brian’s playtest feedback was positive.
4. **Shared presentation: complete and deployed.** Campaign and contract briefings expand directly below the selected card, with a MISSION BRIEFING heading and objective bullets. Briefings omit exact timing, altitude, and spawn-pattern hints. The responsive flight header reserves its height so changing status messages do not resize the playfield.
5. **v0.16 / Mars / World Three: planning.** Follow the Moon’s artwork-first, small-batch prototype approach. The proposals below are recorded for discussion; Mars art, missions, mechanics, and upgrades have not been implemented or individually approved.

## v0.16 — Mars proposal

### Setting and art direction

An abandoned expedition site above red Martian terrain, with research equipment and remnants of unfinished infrastructure. Proposed salvage colors are cream, charcoal, and metallic tones with teal accents for readability against the red background. Mix new Mars items with familiar tool crates, panels, and rocket fragments.

Create a Mars background and five salvage sprites after agreeing on the lineup. Review and approve the artwork before integrating it or changing gameplay. Preserve readable silhouettes and test background cropping at different device sizes, as with the Moon.

### Proposed salvage lineup

| Item | Intended role |
| --- | --- |
| Sample canister | Small, light geological sample container; an accessible introduction to Mars recovery. |
| Survey drone | Moderately valuable equipment with a folded-wing silhouette; candidate for a new movement experiment. |
| Solar array section | Bulky salvage that encourages decisions about how much cargo to carry. |
| Habitat support frame | Heavy structural debris for later missions and mixed recovery orders. |
| Ascent engine | Unique finale target: the last major component of an abandoned expedition. Keep it special to the finale initially. |

These are proposed names and roles, not finalized asset specifications. Masses, values, objective counts, and star thresholds remain to be tuned.

### Gameplay experiments

- **Primary candidate: changing horizontal speed on survey drones.** Drones gradually speed up and slow down as they pass, giving players movement to judge before tethering. Use existing controls, with no sudden reversals or unpredictable jumps. Introduce drones with familiar motion first, then compare a speed-varying variant before adopting it.
- **Cargo-management variety:** first test solar arrays and habitat frames through existing mass and handling rules. Careful tuning may provide enough variety without a new system. Do not add a separate bulk mechanic merely because the artwork looks large.
- **Deferred possibility: tether tension.** Revisit only if simpler mission prototypes reveal a worthwhile gap. This is not part of the initial prototype commitment.

Moon vertical drift is already implemented. Mars horizontal speed variation is a separate proposal; avoid layering multiple unfamiliar mechanics into the first introduction.

### Upgrade proposals

| Upgrade | Proposed benefit | Design constraint |
| --- | --- | --- |
| Tether reach | Modestly increases collection range. | Improve interception without removing positioning decisions or adding a button. |
| Cargo stabilizer | Reduces the handling penalty from heavy cargo. | Loaded trips should remain a meaningful tradeoff; define how this differs from existing thrust upgrades. |
| Suit reinforcement | Reduces collision damage. | Give room to recover from mistakes without eliminating danger. |
| Recovery scanner | Highlights item types still needed for the current objective. | Do not reveal arrival times or locations. Consider basic objective highlighting as a free readability feature instead of a paid upgrade. |

The recommended first pair to explore is **tether reach and cargo stabilization**, supporting interception and loaded-cargo play styles respectively. This is a recommendation, not an approved implementation order. Existing reel, thrust, and deposit upgrades remain available. Prices, tiers, unlock requirements, effects, and interactions are open. Every campaign mission must remain achievable with standard gear.

### Proposed first three missions

| Mission | Working title | Prototype focus |
| --- | --- | --- |
| 3-1 | Red Arrival | Bank familiar salvage and get comfortable with the new setting. |
| 3-2 | Sample Return | Recover sample canisters with established spaced-target rules. |
| 3-3 | Survey Recovery | Introduce survey drones with familiar movement; test changing speed as a variant before committing. |

Later missions can introduce solar arrays, habitat frames, mixed objectives, and an ascent-engine finale with saved assignment checkpoints. Retain ten campaign missions per world. Specific missions 3-4 through 3-10, rewards, and balance are not designed yet.

### Delivery sequence and open decisions

1. Agree on the Mars salvage lineup and visual direction.
2. Create and approve the background and five sprites.
3. Integrate approved assets and prototype missions 3-1 through 3-3 with world navigation.
4. Playtest movement and cargo experiments independently; decide which to retain and which upgrade to prototype first.
5. Expand the campaign in small review batches, following the Moon’s 4–6, 7–9, and checkpointed-finale approach.
6. After campaign approval, evaluate Mars Contracts and world-aware Endless support using the established per-world pattern. Their content and tuning remain open.

Mars implementation remains future work. Use the established feature-branch, playtest, and production-approval workflow for each batch.

## Principles carried forward

- Preserve manageable object density across worlds: spaced mission targets, bounded support fields, capped valuable support items, and no random target clusters. Exact tuning may vary by world.
- Finite mission pools normally include two spare targets per required type; unique finale targets are the exception. Missed targets return. Do not replenish collected finite targets.
- Keep briefings concise: clear goals, relevant cargo behavior, and recovery rules. Use Heavy Metal as the style reference. Omit exact timing, altitude, and spawn patterns; detailed tuning belongs in developer notes.
- Preserve inline objective bullets, automatic contract difficulty ordering, responsive playfield stability, existing saves, shared gear, and independent world checkpoints/rewards and Endless scores.
- Introduce mechanics gradually, retain the existing controls where possible, and keep standard gear sufficient.

The sections below are historical delivery notes, not outstanding work. This current roadmap supersedes their older deployment statuses and deferred-feature statements.

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

## v0.8.1 — UI and art polish

Ready for review: approved menu/flight layout, pixel art, clear star thresholds, truthful station status, and protected Restart. Next: hands-on phone playtesting for readability, targeting clarity, and whether players voluntarily risk another trip. No new mechanics or difficulty changes in this pass.

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


## v0.12 — Levels 6–7 and shared salvage

Implemented for playtest: Lost Equipment and Heavy Metal, approved tool-crate and rocket-fragment artwork, targeted campaign stars, Equipment Return and Engine Recovery contracts, and new salvage in the middle Endless phases. Existing Level 5 saves unlock Level 6. Next: playtest target availability, heavy-cargo handling, and reward pacing before designing Levels 8–10 and the World One finale.


## v0.13 — World One complete (playtest)

Implemented Levels 8–10, three-assignment Final Sweep with saved checkpoints, survey capsule, completion badge/reward, and Deposit Speed tiers. Next: validate mixed-objective pacing, checkpoint clarity, and upgrade feel. Ending animation remains an undecided concept and is not implemented.


## v0.14 / v0.15 update

v0.14 mission briefings and contract sorting are approved and deployed. v0.15 implements the world selector and first three Moon missions for playtesting, with the approved lunar art. Next: validate introductory lunar pacing and background cropping before expanding toward ten missions; drifting salvage remains a later experiment.
