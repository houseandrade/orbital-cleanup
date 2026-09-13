# Orbital Cleanup — Handoff

For version-by-version changes, see [Release notes](RELEASE-NOTES.md).

## Current state

Local v0.17.0 review work adds Mars missions 4–10, `marsFinale` checkpoints, `worldThreeReward`, and the Mars completion badge. Brian’s feedback prompted guaranteed upper/lower Mars targets (including introductory finite pools) and speed/load-dependent momentum in all modes. Brake cues recommend releasing thrust on climbs and holding thrust on descents; the stabilizer reduces inertia. See MARS-CAMPAIGN-PLAN.md. Production is still v0.16.0; do not merge or deploy this batch without approval.

The full acceptance suite passes: finite/spaced targets, quota and star gating, standard-gear completion, independent checkpoints/reward, scanner assignment behavior, outer-band guarantees, and early/late braking trajectories at different frame rates. Browser checks verified the mission list, array flight artwork, and finale briefing with no browser errors. Playtest at http://127.0.0.1:8089/previews/v017/playtest.html; assess pacing and momentum before proceeding to Mars Contracts and Endless.

`main` contains approved production v0.16.0 (PR #24, commit `989e90f`). Deployment 34782069208 succeeded, and the live release was verified on September 13, 2026. Earth and Moon retain their ten-mission campaigns, Contracts, independent finale checkpoints/rewards, and world-aware Endless. Mars missions 3-1 through 3-3, the approved artwork, tether reach, cargo stabilizer, and the one-time $100 recovery scanner are now live. The scanner appears first in the workshop. Mars Contracts/Endless, later missions, and upgrade illustrations remain future work; see ROADMAP.md.

Validation: `node tests/acceptance.mjs` passes, including Mars gates/quotas/finite pools, save migration, scanner purchase/target tracking, launch-only upgrade effects, range limits, and loaded/unloaded stabilization. Browser review verified mission briefings, the single-unlock workshop state, Mars flight artwork, scanner markers and surface-impact copy at the default viewport and compact 320×568 layout, with no browser errors. Brian approved the playtest and requested deployment. Further balance feedback can guide later changes. Local playtest: http://127.0.0.1:8088/previews/v016/playtest.html (standard gear or scanner, backed-up preview saves, $3,000 test wallet).

The release sections below are historical records. Their original playtest/pending-review wording is superseded by this current status. The original v0.532 single-file prototype is preserved unchanged at `reference/prototype-v0.532.html` and remains the behavioral baseline for the core loop.

The project separates the game into a maintainable static project with no build step:

- `index.html` — application shell, title screen, and game-over UI
- `styles.css` — mobile layout, safe-area handling, and input protections
- `src/game.js` — gameplay simulation, rendering, controls, and mode navigation
- `src/levels.js` — campaign/world configurations, Endless phases, and progression
- `src/contracts.js` — contracts, upgrades, and saved economy
- `src/art.js` — approved sprite/background rendering
- `src/input.js` — mobile pointer ownership and input safety
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

Maintain RELEASE-NOTES.md with each release: implemented changes under Unreleased or In review, then Released only after successful approved deployment. Keep roadmap proposals separate from shipped features.

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


### v0.12 playtest adjustment — salvage4

Brian requested more altitude variation and risk near the gameplay edges, consistently across modes. Shared TOOL/ROCKET bands now choose 25% high orbit (y105–140), 50% middle orbit (y170–280), or 25% low orbit (y300–330), then randomize altitude within that zone. The same configuration feeds both campaign finite pools, both new contract arrival schedules, and the corresponding Endless phases. Edge passes use the upper portion of existing value ranges (crates $70–$80, fragments $155–$170), while middle passes use $60–$69/$130–$154. Edge salvage gets the existing value highlight. Sprites and collision bounds remain safely inside y75–360 including wobble. Campaign 6–7 supporting panels/scrap also span broader altitude ranges, shared by the new contracts. Earlier campaign teaching layouts, scripted pockets, and existing Endless recovery behavior are unchanged. All previously validated pool counts, spacing, arrival intervals, and deposit speed remain unchanged.

Validation forces each zone for both new types and checks safe bounds, value ranges, and shared configuration across Campaign, Contracts, and Endless. Full acceptance suite passes.


## v0.13 — implementation ready for playtest

User approved implementation of Levels 8–10, checkpointed finale, capsule art, and Deposit Speed (not Reel Motor). The ending animation remains undecided and is excluded. Implemented the objectives and initial star/price/reward values documented in README's v0.13 section. Mixed finite pools stagger crates/fragments by 240px, with 480px same-type spacing at 30px/s and two spares per required type. Stage three has a unique $300, 14kg capsule that loops when missed. Checkpoints capture cumulative bank only at assignment boundaries; retries restore bank and reset the failed assignment, cargo, field, and integrity. One-time wallet reward is stored atomically with its claim flag in career data. Existing v0.12 gameplay balance is preserved.

Acceptance checks cover mixed objectives, every assignment transition, persisted checkpoint loading, failed-assignment rollback, capsule recovery after failure, completion/replay, reward idempotence after reload, older upgrade saves, next-launch effect application, and visible per-item deposits at max upgrade. Initial prices and star thresholds require hands-on playtesting. Production remains v0.12 pending approval.


### v0.13 finale2 — capsule challenge

Brian found the capsule too immediate and safely positioned. Its finite pool now starts with an 840px offset: it enters the visible field after 28s, reaches the astronaut at 34s, and cannot be tethered during the initial station pass. Each attempt chooses upper orbit y98–110 or lower orbit y325–336 with equal probability; both include safe sprite/collision clearance inside y75–360. It receives the existing valuable-target highlight, keeps its $300 value/14kg mass, and loops every 30s when missed. Checkpoint retry preserves completed assignments and resets this delayed approach. Tests cover arrival timing, both altitude ranges, and safe bounds.


### v0.13 finale3 — campaign completion indicator

User requested replacing the standalone World One completion banner with a green check beside CAMPAIGN inside its entry card. The check retains an accessible World One complete label and appears only after Level 10 completion.


## v0.13 polish1 — satellite variety and Campaign card

User reported too few satellites in Levels 6–10, requested the completion check before World One in the card subtext, and noted the astronaut's right-side clipping. Later missions and all finale assignments now include a low-weight satellite band capped at two active satellites, sampling high/mid/low altitudes with upper-range rewards near boundaries. Existing normal debris counts and mission target pools remain unchanged. New target contracts inherit the varied support bands. The Campaign heading is plain, with subtext `10 missions · [green check when complete] World One`. The astronaut atlas background offset and silhouette mask now match its source bounds, preserving both arms inside the icon column. Grid text columns can shrink without overflowing. Full acceptance checks include satellite presence across all late-campaign assignments and the two-satellite cap. Production remains unchanged pending playtest approval.


## v0.14 — Mission briefings and contract sorting

Selecting a campaign mission expands a connected MISSION BRIEFING directly below its card. Objectives appear as bullets; mixed quotas are separate items, and Final Sweep lists all three assignments with its saved checkpoint. Star requirements remain explicit. Start Mission appears inside the briefing. Selecting another mission moves the briefing and scrolls the selected card into view.

Contracts use the same expandable briefing, with objective bullets, payout terms, and Accept Contract inside the selected card. Only one contract briefing is open at a time. The board automatically sorts Easy, Medium, then Hard, preserving order within each difficulty. Existing objectives, unlocks, saved progress, payouts, and flight behavior are unchanged.

Validation: full acceptance suite and whitespace checks pass; local browser review verified the campaign card, contract objectives, and collapse-on-selection behavior. Brian approved the changes and requested a v0.14 PR targeting production.

## v0.15 — Planned Moon prototype

Brian approved the five lunar salvage sprites and Moon background. Local assets are saved under src/art/lunar/ and previews/lunar-art-v1/ for the next iteration; they are not included in the v0.14 release. Preserve the distant Earth when cropping the Moon background. Next scope: world selector and the first three Moon missions, using the v0.14 inline briefing pattern.


## v0.15 — Moon prototype ready for playtest

World navigation displays only the selected world's missions, with per-world completion and stars, a sticky selector, and remembered world selection. World One remains ten missions; World Two targets ten, with only the first three playable in this prototype. Mission labels use world-mission numbering. Complete Final Sweep to unlock Lunar Arrival; existing World One completions unlock it immediately. World One's finale reward and 30-star total remain scoped to Earth. The third Moon mission ends the available prototype without awarding a world completion or another wallet reward.

- **2-1 Lunar Arrival:** bank $200 / $400 / $650 using six familiar panels, scraps, and satellites.
- **2-2 Spare Parts:** bank five rover wheels; higher stars also require $550 / $800. Seven finite wheels, spaced 14 seconds apart, travel at varied safe altitudes; missed wheels return and collected wheels do not respawn. Wheels weigh 7kg and pay $65–$85.
- **2-3 Tank Sweep:** bank eight spent oxygen tanks across trips; higher stars also require $550 / $850. Two light 4kg tanks form recurring pockets among ordinary salvage, paying $35–$45 each.

The Moon uses the approved horizon cropped below the flight boundary, with the distant Earth drawn separately above it. Approved wheel and tank sprites are integrated and cached offline. The other approved lunar assets are retained for later missions. Lower-boundary failure reads Surface Impact. Base flight physics and existing gear effects are preserved; the lunar station has a shorter, more predictable return range for these introductory missions. Vertical drift, extra lunar contracts, and missions 2-4 onward remain deferred.

Validation: full acceptance suite covers existing gameplay plus world visibility, locked access, save compatibility, sequential Moon unlocks, multi-deposit tank quotas, finite wheels, recurring tank pockets, shared upgrades, reward isolation, and lunar failure labels. Local browser QA checked locked/unlocked world pages, inline briefings at 375×667 and 320×568, and the lunar flight composition; no warnings or errors were observed. Mission thresholds and spawn pacing are initial playtest settings.

Local playtest helper: previews/v015/playtest.html runs only at localhost:8085 and seeds test campaign progress while preserving a backup. It never changes production progress and is excluded from the production Pages artifact. v0.14 is deployed in production; v0.15 requires playtest approval before merge/deployment.


## Deployment and roadmap update

v0.15 PR #17 was explicitly approved, merged, and successfully deployed to production. The next work is planning Moon missions 2-4 through 2-10, documented in MOON-CAMPAIGN-PLAN.md and the current section at the top of ROADMAP.md. After the full Moon campaign is complete, add lunar Contracts and ensure Endless follows active Moon campaign progression. Mars is confirmed as World Three after Moon work. These are planning updates; no additional campaign or mode changes have been implemented.


## v0.15.1 — Moon missions 4–6 (playtest)

Field Research (2-4) requires three instrument packages; higher stars additionally require $550/$800. Packages weigh 6kg, pay $110–$140, and spawn in a finite five-item pool spaced 14 seconds apart in the safe middle field. Landing Debris (2-5) requires three lander legs; higher stars require $650/$950. Legs weigh 18kg, pay $150–$190, and use a five-item pool spaced 16 seconds apart, also introduced at middle altitudes. Approved sprites and fallback drawings are integrated and cached offline.

Workshop Delivery (2-6) requires three rover wheels and two tool crates, with $650/$950 for higher stars. Five wheels and four crates use 16-second same-type spacing, with the crate pool offset by eight seconds. Existing wheel/crate altitude and value rules apply. All targets circle back if missed and do not replenish after collection; replay restores their finite pools.

Brian clarified that World One's object-density principle should carry between worlds, without requiring identical tuning. These three missions use five ordinary debris slots, a two-satellite support cap, spaced target pools, and two spare targets per type. New targets never appear in random support bands. Earlier missions retain their existing tuning.

Completing Tank Sweep unlocks Field Research, including on existing saves. The available campaign ends at 2-6; missions 2-7–2-10 remain future work. Lunar Contracts and world-aware Endless follow the complete Moon campaign, with Mars next.

Validation: full acceptance suite covers finite target counts/spacing, looping missed targets, failure and replay, typed and mixed quotas across deposits, star gating, save progression, and no premature world reward. Prices and star thresholds are initial playtest values. Local helper: previews/v0151/playtest.html on localhost:8085. No deployment without approval.


## v0.15.2 — Stable flight header

The flight header previously sized itself to its status text. At mission launch it displayed the full briefing; the first empty Tether attempt replaced that with a short message, shrinking the header and enlarging the flex-sized canvas. At 375×667, Workshop Delivery's header changed from 77.5px to 55px, and its canvas from 312.6px to 335.1px.

The header now reserves 60px (55px in the existing short-screen layout), with a single-line mission title and a fixed two-line status area. Text cannot grow the header horizontally or vertically. Full mission details remain available in the mission briefing. No flight physics or controls changed.

Validation: browser reproduction before/after confirms the fixed canvas stays at 330.1px through the Tether status change, with a constant 60px header at 375×667. No browser warnings/errors; full acceptance suite and whitespace checks pass. Ready for device playtesting, not deployed.


## v0.15.3 — Moon missions 7–9 (playtest)

- **2-7 Off Course:** bank three instrument packages; $650/$950 for higher stars. Five finite targets spaced 16 seconds apart drift vertically at 7px/s between y140 and y300. Ordinary debris retains its existing motion. Drift pauses during reeling, resumes smoothly on cancellation, and shares one altitude between rendering, collisions, and target acquisition.
- **2-8 Catch the Window:** bank four instrument packages; $800/$1,150 for higher stars. One target crosses four seconds ahead of each station window, with at most one scheduled target and up to six recoveries per run. Missed targets are offered again on subsequent passes, without stacking. The timed targets do not drift.
- **2-9 Heavy Recovery:** bank three lander legs and two rocket fragments; $1,100/$1,500 for higher stars. Five legs and four fragments use 16-second same-type spacing with an eight-second offset between types. Both weigh 18kg. Missed targets loop; collected finite targets do not respawn.

All three preserve five ordinary support slots and a two-satellite cap. Existing saves with Workshop Delivery complete unlock Off Course. Completing Heavy Recovery ends the currently available missions, without granting a Moon completion reward. Mission 2-10 and later modes remain deferred.

Validation: full acceptance suite passes, including bounded drift, shared tether altitude, cancellation without snapping, station lead timing, single-target recurrence, six-recovery cap, replay, multi-deposit objectives, heavy mixed quotas, star gating, and progression. Browser QA checked briefings and mission launch at 375×667 with no warnings/errors. Initial pacing and rewards require playtesting. Helper: previews/v0153/playtest.html on localhost:8085.

v0.15.2 (stable flight header) was approved, merged via PR #19, and successfully deployed; the public page was verified. v0.15.3 remains a separate playtest build pending approval.

Briefing copy follows Heavy Metal’s concise style: state the goal, relevant cargo behavior, and missed-item recovery rules without revealing exact timing, altitude, or spawn patterns. Applied across Earth and Moon, including the Earth finale, with matching cleanup for Contracts and Endless phase text. Off Course and Catch the Window use Brian’s requested wording. Gameplay tuning and objectives are unchanged.


## v0.15.4 — Last Rover (playtest)

v0.15.3, including Moon missions 7–9 and concise briefings across all missions, is approved and deployed via PR #20. Deployment 34778688455 succeeded; production briefing copy was verified.

Last Rover completes the ten-mission Moon campaign with three checkpointed assignments: bank six oxygen tanks and three wheels; bank two lander legs and two instruments; recover one rover chassis. Every stage retains five support slots with capped satellites. Mixed finite pools include two spare targets per type and deliberate spacing. The unique rover returns when missed, weighs 22kg, and uses the approved sprite. It can be recovered with standard gear.

Moon checkpoints are independent of Earth checkpoints, including replay saves. Failure rolls back the current assignment only. Completion awards a separate Moon badge and one-time $2,000 wallet reward, preserving Earth reward claims. Initial higher-star thresholds are $1,800/$2,400 across assignments. Briefings state goals and recovery rules without exact timing, altitude, or spawn hints.

Acceptance coverage includes mixed quotas, checkpoint persistence/isolation, failed-stage rollback, finite density, normal rover tethering, missed/lost rover return, replay, and reward isolation/idempotence. Review locally via previews/v0154/playtest.html on localhost:8086. v0.15.4 is not deployed; pacing and star targets await playtesting. Lunar Contracts and world-aware Endless follow Moon campaign approval, then Mars.


## v0.15.5 — Moon Contracts and Endless Orbit (playtest)

v0.15.4 Last Rover is approved and deployed via PR #21. Deployment 34779093640 succeeded, and the public finale configuration was verified.

The contract board now has Earth/Moon navigation and retains Easy → Medium → Hard ordering and inline briefings within each world. Six Moon jobs cover tanks, wheels, instruments, lander legs, object count, and bank value. Moon contracts unlock with World Two after Earth completion. Targeted jobs use finite pools with two spare items, deliberate spacing, five ordinary support slots, and capped satellites. Value/count jobs use a single recurring lunar target slot within a five-object budget. Wallet, upgrades, and completed-job unlocks are shared; bonuses pay once per run and retain existing replay/failure rules.

Starting a Moon campaign mission sets a persistent active world. Mission-page browsing and contracts do not change it; Earth replays do not reset it. Legacy saves infer Moon activity from lunar progress/current campaign mission. Endless follows this world, labels its destination on the menu, and uses a separate Moon best-score key while preserving the original Earth key. The Moon run cycles through familiar salvage, wheels/tanks, instruments, and heavy legs. Rare arrivals remain capped; the rover stays exclusive to the finale. Endless does not add spendable wallet earnings.

Validation: full acceptance suite passes, including locked access, board filtering/sorting, finite targets, all six payouts, shared save persistence, migration, world-selection isolation, phased lunar salvage, and separate scores. Browser QA checked inline Moon contract copy and lunar Endless scenery/launch with no warnings/errors. Review at previews/v0155/playtest.html on localhost:8087. This build is not deployed; contract rewards and pacing await playtesting. Mars remains next after Moon mode approval.
