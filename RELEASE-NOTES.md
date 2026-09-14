# Orbital Cleanup — Release notes

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


Player-facing changes, newest first. Current production release: **v0.16.0**.

The history below was reconstructed from merged changes and project records. Follow-up changes that retained the same displayed version are grouped under that version; no patch numbers or deployment dates have been invented. PR links identify the corresponding merged changes. For future direction, see [ROADMAP.md](ROADMAP.md); proposals are not shipped features.

## Unreleased

### v0.17.0 — Full Mars campaign and cargo momentum (in review)

Earth and Moon now share the boundary recovery layout across campaigns, all 17 Contracts, and every Endless phase. Recurring targets and salvage pockets alternate sides; mixed finite orders separate target types by altitude. Introductory fields keep gentler margins, unique finale targets keep scripted placement, and drift remains bounded. Existing timing, counts, objectives, and payouts are preserved. Shared momentum and braking cues apply throughout. Acceptance coverage includes every mode and phase.

- Added Power Salvage, Habitat Recovery, Research Manifest, Survey Window, Power Reserve, Heavy Lift, and the three-assignment Last Ascent finale.
- Added independent Mars checkpoints, completion badge, and one-time $2,000 reward. Existing 3-3 completion unlocks 3-4.
- Broadened Mars support salvage and guaranteed upper/lower finite targets so central hovering cannot finish recovery quotas with standard gear. Mixed orders require travel between opposite bands.
- Fast, loaded movement retains more momentum across all worlds and modes. Early braking cues and the cargo stabilizer help manage approaches; unloaded and slow movement retain their previous physics.
- Acceptance checks cover mission completion, target supply, rewards/checkpoints, altitude coverage and actual braking trajectories. Awaiting playtest approval; not deployed. Mars Contracts and Endless follow campaign review.

### Documentation

- Recorded the v0.16 Mars proposals: five salvage items, art direction, gameplay experiments, upgrade candidates, and the first three mission concepts.
- Updated current documentation to reflect the completed Earth/Moon campaigns and deployed Moon modes.
- Added this release history and the maintenance workflow below.

## v0.16.0 — Mars arrival and recovery gear

Released · [PR #24](https://github.com/houseandrade/orbital-cleanup/pull/24) · September 13, 2026

Production deployment 34782069208 succeeded at commit `989e90f`. The live release, Mars missions, scanner-first workshop ordering, $100 unlock, and service-worker version were verified.

- Added the approved Mars environment and first three missions: Red Arrival, Sample Return, and Survey Recovery. Mars unlocks after the Moon finale. Sample canisters and drones use spaced finite pools with two spare targets; missed items return.
- Added three tiers each of tether reach and cargo stabilization. Stabilization reduces cargo penalties without changing unloaded thrust, actual mass, or reeling duration.
- Added recovery scanner as a one-time $100 unlock, listed first in the workshop. It marks visible salvage still needed for the current objective, including mixed quotas and finale assignments, accounting for cargo already aboard.
- Preserved older saves, shared upgrades, Earth/Moon checkpoints and rewards. The Moon finale now leads to Mars; completing 3-3 clearly ends this review batch without a Mars finale reward.
- Mars Contracts, Mars Endless, drone speed variation, later Mars missions, suit reinforcement and upgrade illustrations remain future work. Mars players explicitly continue to Moon Endless for now.
- Validation: full acceptance suite passed locally and in the production workflow. Brian approved the playtest and requested production deployment; future tuning can follow additional feedback.

## v0.15.5 — Moon Contracts and Endless Orbit

Released · [PR #22](https://github.com/houseandrade/orbital-cleanup/pull/22)

- Added six Moon contracts: Tank Return, Wheel Run, Research Order, Lunar Cleanup, Lander Recovery, and Lunar Payday.
- Added Earth/Moon contract-board navigation, preserving difficulty sorting and inline briefings. Moon jobs unlock after World One completion.
- Added lunar Endless scenery and phases featuring wheels, tanks, instruments, and lander legs. The rover remains exclusive to the finale.
- Endless now follows the active campaign world. Starting a Moon mission sets the destination; browsing pages, contracts, and Earth replays do not reset it.
- Added a destination label and separate Moon Endless best score. Existing Earth scores, wallet, upgrades, and campaign progress are preserved.

## v0.15.4 — Last Rover

Released · [PR #21](https://github.com/houseandrade/orbital-cleanup/pull/21)

- Completed the Moon’s ten-mission campaign with Last Rover: recover tanks and wheels, then legs and instruments, then the rover chassis.
- Added independent Earth/Moon finale checkpoints. Failed assignments retry from the last saved checkpoint without losing earlier assignments.
- Added the approved rover sprite, normal-tether recovery, and missed/lost rover return behavior.
- Added the Moon completion badge and a separate one-time $2,000 wallet reward.

## v0.15.3 — Moon missions 7–9 and clearer briefings

Released · [PR #20](https://github.com/houseandrade/orbital-cleanup/pull/20)

- Added Off Course, Catch the Window, and Heavy Recovery.
- Introduced gentle vertical drift on instrument packages and a station-timed recovery challenge with a bounded target supply.
- Preserved spaced targets, limited support debris, and missed-item return behavior.
- Simplified Earth/Moon briefings, the Earth finale, contract descriptions, and Endless phase text. Removed exact timing, altitude, and spawn-pattern hints while retaining goals and useful cargo/recovery information.

## v0.15.2 — Stable playfield layout

Released · [PR #19](https://github.com/houseandrade/orbital-cleanup/pull/19)

- Fixed subtle playfield resizing when mission text changed to a short status message after tapping Tether.
- Reserved a consistent flight-header height while keeping the game responsive to device size. Full details remain in the mission briefing.

## v0.15.1 — Moon missions 4–6

Released · [PR #18](https://github.com/houseandrade/orbital-cleanup/pull/18)

- Added Field Research, Landing Debris, and Workshop Delivery.
- Introduced instrument-package and lander-leg recovery, plus mixed wheel/tool-crate objectives.
- Carried forward manageable density through spaced finite targets, spare items, staggered mixed types, and capped support satellites.

## v0.15 — First steps on the Moon

Released · [PR #17](https://github.com/houseandrade/orbital-cleanup/pull/17)

- Added Earth/Moon campaign navigation and per-world progress displays, with ten planned missions per world.
- Added Lunar Arrival, Spare Parts, and Tank Sweep. The Moon unlocks after World One completion.
- Integrated approved lunar scenery and salvage artwork, preserving the distant Earth in the background.
- Added lunar Surface Impact feedback while retaining core controls, shared gear, and existing saves.

## v0.14 — Inline mission briefings

Released · [PR #16](https://github.com/houseandrade/orbital-cleanup/pull/16)

- Mission details now expand directly below the selected campaign card, with a MISSION BRIEFING heading and bulleted objectives.
- Applied the same experience to contracts, including the accept button inside the briefing.
- Contract jobs now stay sorted Easy → Medium → Hard.

## v0.13.1 — Satellite and menu polish

Released · [PR #15](https://github.com/houseandrade/orbital-cleanup/pull/15)

- Restored varied satellite placement in later campaign missions and capped the number of supporting satellites.
- Polished the Campaign card and World One completion presentation.

## v0.13 — World One finale and Deposit Speed

Released · [PR #14](https://github.com/houseandrade/orbital-cleanup/pull/14)

- Added Sorting Shift, Salvage Run, and Final Sweep, completing World One’s ten missions.
- Added mixed salvage objectives and a three-assignment finale with persistent checkpoints and a unique survey capsule.
- Added a World One completion badge and one-time $2,000 reward.
- Added three Deposit Speed upgrade tiers shared across game modes.

## v0.12 — Targeted salvage recovery

Released · [PR #13](https://github.com/houseandrade/orbital-cleanup/pull/13)

- Added Lost Equipment and Heavy Metal, introducing tool crates and rocket fragments with their approved artwork.
- Added Equipment Return and Engine Recovery contracts, and introduced these items in Endless phases.
- Added finite campaign target pools with spare items: missed targets return, while collected targets do not respawn during the run.
- Spaced rare contract/Endless arrivals, varied salvage placement and value, and improved per-item deposit speed.

## v0.11 — Contracts, upgrades, and deposit feedback

Released · [PR #10](https://github.com/houseandrade/orbital-cleanup/pull/10), [PR #11](https://github.com/houseandrade/orbital-cleanup/pull/11), [PR #12](https://github.com/houseandrade/orbital-cleanup/pull/12)

- Added nine repeatable contracts spanning Easy, Medium, and Hard objectives.
- Added a separate career wallet, immediate deposit earnings, and one bonus per successful contract run. Failure retains deposited earnings and loses carried cargo.
- Added the upgrade workshop, with Reel Motor and Thruster Power tiers shared across Campaign, Contracts, and Endless.
- Improved menu instructions and card styling.
- Added individual-item banking and transfer feedback, preserving deposited items if a transfer is interrupted, plus a return-to-contract-board action after completion.

## v0.10 — Encounters and Endless progression

Released · [PR #9](https://github.com/houseandrade/orbital-cleanup/pull/9)

- Added station-pass countdowns and advance notice of the next return.
- Added configured scrap pockets and valuable salvage encounters.
- Added repeating Endless phases, banked-value milestones, and a preview of the next phase.
- Every successful Endless deposit now offers a choice to keep salvaging or finish safely.

## v0.9 — Recovery Detail and Temptation

Released · [PR #8](https://github.com/houseandrade/orbital-cleanup/pull/8)

- Added campaign missions 4–5: an object-count objective and a higher-value salvage challenge.
- Added banked-object progress across multiple deposits, with optional higher-star value goals.

## v0.8.2 — Mobile input and reliable updates

Released · [PR #6](https://github.com/houseandrade/orbital-cleanup/pull/6), [PR #7](https://github.com/houseandrade/orbital-cleanup/pull/7)

- Hardened touch controls against gesture interference, lost releases, pointer cancellation, focus changes, and interrupted holds.
- Preserved independent Thrust/Deposit fingers and menu scrolling.
- Improved PWA updates to avoid stale cached files.
- Added Refresh game files recovery that clears this game’s asset caches while preserving local progress and scores.

## v0.8.1 — Flight dashboard and pixel artwork

Released · [PR #5](https://github.com/houseandrade/orbital-cleanup/pull/5)

- Added pixel artwork and clearer menu/flight presentation.
- Added readable bank, cargo, integrity, and star-goal displays, plus improved station status feedback.
- Moved Restart into the paused menu with confirmation and added a Main Menu result action.

## v0.8 — Endless Orbit

Released · [PR #4](https://github.com/houseandrade/orbital-cleanup/pull/4)

- Added immediately accessible Endless Orbit with no campaign unlock requirement.
- Added a separate Endless best banked score, same-mode replay, safe exit handling, and a campaign-to-Endless shortcut.

## v0.7 — Campaign foundation

Released · [PR #2](https://github.com/houseandrade/orbital-cleanup/pull/2), [PR #3](https://github.com/houseandrade/orbital-cleanup/pull/3)

- Added the first three sequential campaign missions, saved progression, replay, and optional three-star goals.
- Added a post-deposit choice to finish a mission or keep salvaging for higher stars.
- Protected active runs from accidental menu exits with pause and confirmation.

## v0.6 — Standalone PWA

Released · [Initial conversion](https://github.com/houseandrade/orbital-cleanup/commit/0c6ccb5), [PR #1](https://github.com/houseandrade/orbital-cleanup/pull/1)

- Converted the original single-file prototype into a standalone mobile-first project.
- Added installation/offline support, local high scores, responsive layout, and touch protections.
- Added GitHub Pages production deployment and automated acceptance checks.

## v0.532 — Reference prototype

Historical baseline, preserved at `reference/prototype-v0.532.html`; not a separate release of this PWA project.

- Established the collect, carry, return, and bank loop, with cargo mass, suit integrity, tethering, thrust, and station deposits.

## Maintaining this history

1. Add implemented changes to **Unreleased** as work lands. Keep unimplemented ideas in the roadmap; if mentioned here, label them as planning only.
2. When preparing a review build, move its changes under the exact displayed version and mark it **In review**. Group follow-ups that retain that version into the same entry.
3. After approved deployment succeeds, mark the entry **Released**, add its PR link and verified deployment date, and update the current-production line at the top. Do not mark a build released just because its PR exists.
4. Summarize player-visible additions, changes, and fixes. Include save compatibility or migration details when relevant; keep detailed tuning and test records in the handoff or PR.
5. Update these notes alongside the README, handoff, and current roadmap. Preserve historical entries and keep an Unreleased section for the next batch.

Suggested entry format:

```markdown
## vX.Y.Z — Short release title

In review / Released · YYYY-MM-DD (verified deployment date) · PR link

- Added …
- Changed …
- Fixed …
- Saves: … (when relevant)
```
