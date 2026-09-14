# Orbital Cleanup — Roadmap

## Current status — v0.21.0 gameplay HUD in review

Production v0.20.0 deployed via PR #29 (merge `690717f`, successful deployment 34796281120). The new HUD implements the approved single/mixed objective rows, separate banked/aboard segments, wallet-versus-score labels, suit/cargo/motion status, dedicated station strip, icon-only pause, and two-step exit confirmation. Existing simulation, rewards, saved progress and input protections are retained.

Brian found the first playable HUD too tall. The revision compacts spacing and suppresses repeated explanatory captions on short screens. The canvas displays world y60–380 instead of y60–460, cropping unused space below the lower boundary while leaving physics and both boundaries unchanged. Small-screen checks verified visible controls and no horizontal overflow. The full acceptance suite passes, including new mixed-objective readiness and pause/exit cases. Local playtest: http://127.0.0.1:8095/previews/v021/playtest.html. Not deployed; awaiting playtest approval.


## Current status — v0.20.0 title screen in review

World pages and navigation refinements are deployed as v0.19.0 via PR #28 (merge `c8fdff7`, deployment 34795963647). Unavailable end arrows are invisible while preserving centered headings. The separate v0.20.0 review adds an opening title screen using existing artwork, one Choose World action, and a footer version. It appears on each fresh document load, including Refresh Game Files, and stays dismissed when returning from runs or menus. No extra saved-progress state is introduced. Production remains v0.19.0 pending title-screen approval.


## Current status — v0.19.0 world pages in review

Production is v0.18.0, deployed via PR #27 (merge `363065a`, deployment 34791992193). Mars Contracts and Endless are live. The new review replaces implicit Endless routing with saved, explicit world pages. Each world has Campaign, Contracts, Endless, its own progress/best, approved world scenery, and flag/clipboard/orbit icons. An upper-right menu exposes World Pages, Upgrades, and Refresh Game Files; the footer retains the release version. Existing progression, scores, and unlocks remain intact.

Next priorities: HUD clarity before expanding Contracts to 12 per world (4 Easy, 4 Medium, 4 Hard). Queue a settings menu and sounds/music, upgrade illustrations, suit reinforcement, save backup, mobile control comfort, collection/mastery ideas, and future-world prototypes. Analytics remains high in the backlog but deferred by Brian. These are future work, not part of the world-page batch.

Review at http://127.0.0.1:8091/previews/v019/playtest.html. Earlier release status statements below are historical. Do not deploy v0.19.0 until playtest approval.


## Current status — v0.18.0 review

Production v0.17.0 deployed via PR #26 (merge `0105841`, successful deployment 34789600069). The full Mars campaign and shared boundary/momentum changes are live. v0.18.0 adds Mars Contracts and Endless locally for review; it is not deployed.

See [Mars modes](MARS-MODES-PLAN.md) for the new jobs and phase tuning. Earlier review/deployment statements below are historical.


For version-by-version changes, see [Release notes](RELEASE-NOTES.md).

## Current roadmap — September 13, 2026

1. **Earth / World One: complete and deployed.** Ten campaign missions, checkpointed finale, Contracts, and Endless Orbit are available. Shared upgrades include reel motor, thruster power, and deposit speed.
2. **Moon / World Two: complete and deployed.** All ten missions are live, including Last Rover’s three checkpointed assignments, independent Moon checkpoint/reward handling, completion badge, and one-time $2,000 reward. Approved lunar artwork, vertical drift, and station-timed recovery are implemented. See [Moon campaign record](MOON-CAMPAIGN-PLAN.md).
3. **Moon mode support: complete and deployed in v0.15.5.** Six Moon contracts use Earth/Moon navigation, difficulty sorting, and inline briefings. Starting a Moon campaign mission sets the persistent active world; browsing, contracts, and Earth replays do not reset it. Endless follows that world, labels its destination, and preserves separate Earth/Moon best scores. PR #22 deployed successfully; Brian’s playtest feedback was positive.
4. **Shared presentation: complete and deployed.** Campaign and contract briefings expand directly below the selected card, with a MISSION BRIEFING heading and objective bullets. Briefings omit exact timing, altitude, and spawn-pattern hints. The responsive flight header reserves its height so changing status messages do not resize the playfield.
5. **v0.16 / Mars / World Three: first batch approved and deployed.** Brian approved the artwork and requested Mars missions 1–3 plus tether reach, cargo stabilizer, and a one-time $100 recovery scanner. The first batch uses familiar movement; later missions and speed variation remain proposals. PR #24 deployed successfully as v0.16.0 (run 34782069208); live release verified.

## Mars delivery and remaining proposals

**v0.17.0 in review:** Brian requested missions 4–10 and reported too little altitude travel and risk. The full Mars campaign is now implemented locally, with guaranteed outer-band targets and shared cargo momentum at speed. See [Mars campaign review](MARS-CAMPAIGN-PLAN.md) for missions, tuning, checkpoints, and validation. Production remains v0.16.0 until approval.

Earth and Moon now share the boundary recovery layout across campaigns, all 17 Contracts, and every Endless phase. Recurring targets and salvage pockets alternate sides; mixed finite orders separate target types by altitude. Introductory fields keep gentler margins, unique finale targets keep scripted placement, and drift remains bounded. Existing timing, counts, objectives, and payouts are preserved. Shared momentum and braking cues apply throughout. Acceptance coverage includes every mode and phase.

### Setting and art direction

An abandoned expedition site above red Martian terrain, with research equipment and remnants of unfinished infrastructure. Proposed salvage colors are cream, charcoal, and metallic tones with teal accents for readability against the red background. Mix new Mars items with familiar tool crates, panels, and rocket fragments.

Brian approved the Mars background and five salvage sprites from `previews/mars-art-v1`. Originals and prompts are preserved in `src/art/mars`. The v0.17.0 review uses all five approved sprites; the ascent engine is exclusive to the finale. Keep terrain below the flight boundary and preserve the expedition site in portrait cropping.

**Later artwork task:** add illustrations for the upgrades. Brian requested these for a future pass; they are not part of this implementation batch.

### Proposed salvage lineup

| Item | Intended role |
| --- | --- |
| Sample canister | Small, light geological sample container; an accessible introduction to Mars recovery. |
| Survey drone | Moderately valuable equipment with a folded-wing silhouette; candidate for a new movement experiment. |
| Solar array section | Bulky salvage that encourages decisions about how much cargo to carry. |
| Habitat support frame | Heavy structural debris for later missions and mixed recovery orders. |
| Ascent engine | Unique finale target: the last major component of an abandoned expedition. Keep it special to the finale initially. |

The artwork lineup is approved. First playtest tuning: sample canisters weigh 4kg and are worth $55–70; survey drones weigh 9kg and are worth $110–140. The v0.17.0 review adds 14kg arrays ($140–170), 20kg frames ($180–220), and the 24kg finale engine ($550).

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
| Recovery scanner | Highlights visible salvage still needed for the current objective. | Approved as a one-time $100 unlock, with no tiers or arrival/location forecasts. |

Brian approved **tether reach, cargo stabilization, and recovery scanner** for the first batch. Suit reinforcement stays deferred. Existing reel, thrust, and deposit upgrades remain available. Every campaign mission must remain achievable with standard gear.

Initial playtest tuning (adjust after feedback):
- Tether reach: +10% / +20% / +30% range, priced $600 / $2,400 / $6,000.
- Cargo stabilizer: 15% / 30% / 45% smaller cargo handling penalties, priced $700 / $2,800 / $7,000. Scales only cargo's extra gravity, reduced thrust effectiveness and inertia; does not boost unloaded thrust or change actual mass, value, or reeling duration.
- Both tiered upgrades use the existing 0 / 3 / 6 different completed-contract requirements. Purchases apply on the next launch in every mode.
- Recovery scanner: **one-time $100 unlock, no tiers and no contract requirement**, as requested by Brian. Marks visible salvage still needed for the current objective; counts banked and carried items when deciding what remains needed. Supports mixed quotas and current finale assignments, with no arrival/location forecasting. No markers in Endless. Additional scanner benefits can be considered later only if worthwhile.

### Proposed first three missions

| Mission | Working title | Prototype focus |
| --- | --- | --- |
| 3-1 | Red Arrival | Implemented: bank $250 of familiar panels/tool crates; $450/$700 higher stars. |
| 3-2 | Sample Return | Implemented: bank 5 sample canisters from a finite pool of 7; $550/$800 higher stars. |
| 3-3 | Survey Recovery | Implemented: bank 3 drones from a finite pool of 5, familiar constant speed; $600/$900 higher stars. Speed variation remains deferred. |

Missions 3-4 through 3-10 are implemented for review, including arrays, frames, mixed orders, a station-timed drone recovery, and Last Ascent’s three saved assignments. The finale has an independent Mars badge and one-time $2,000 reward. Initial balance and mission details are in [Mars campaign review](MARS-CAMPAIGN-PLAN.md).

### Delivery sequence and open decisions

1. Complete: Mars salvage lineup and visual direction approved.
2. Complete: background and five sprites created and approved.
3. Complete: approved assets, missions 3-1 through 3-3, world navigation, and selected upgrades deployed in v0.16.0.
4. Playtest the initial missions and upgrade tuning. Compare a separate drone-speed variant later; keep movement and cargo experiments independent.
5. In review: missions 4–10, the checkpointed finale, outer-band coverage, and shared cargo momentum based on Brian’s playthrough feedback.
6. After campaign approval, evaluate Mars Contracts and world-aware Endless support using the established per-world pattern. Their content and tuning remain open.

The first three missions and approved upgrades are deployed in v0.16.0. Mars unlocks after the Moon finale; completing 3-3 does not award a world-completion badge or reward. Active Mars campaign state persists through earlier-world replays. Until Mars mode support is designed, Contracts remain Earth/Moon and Endless explicitly uses Moon for Mars players. Use the established feature-branch, playtest, and production-approval workflow for each batch.

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

Maintain RELEASE-NOTES.md for each review build and release, following its history workflow. Record implemented changes and verified deployment status; keep future ideas here.

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
