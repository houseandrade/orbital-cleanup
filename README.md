# Orbital Cleanup v0.14

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

## PWA update recovery

Fix for devices stuck on older builds: release-specific install fetches bypass stale HTTP cache entries, HTML references versioned scripts/styles, and worker registration explicitly checks for updates. `update.html` provides a save-preserving refresh: after checking connectivity it unregisters only this project’s worker and removes only Orbital Cleanup asset caches. It never accesses localStorage. The main menu links to it; older builds can open it directly. Tests cover fresh install requests, failed-install behavior, cache isolation, and saved-data isolation. Production approval is required before merging.

## v0.9 — Recovery Detail and Temptation

Campaign now has five sequential levels. Existing saves that completed High Roller can select Recovery Detail immediately; stars and Endless scores are preserved.

- **4 — Recovery Detail:** bank 10 objects across any number of trips. One star requires the quota; two and three stars additionally require $400 and $650 banked. Mostly light $15–$25 mid-orbit scraps, with occasional $70–$100 heavier satellites above. The dashboard distinguishes banked and carried counts and prompts Return to bank when the carried objects would meet the quota.
- **5 — Temptation:** bank $350 / $650 / $1,000 for one / two / three stars. Common mid-orbit panels pay $40–$60; recurring satellites near the upper boundary pay $150–$200 and display their value. These replenish normally rather than acting as a single special target.

The new `bank_objects` criterion uses a dedicated deposited-object counter, independent of visual cargo pieces. All star criteria remain ordered behind objective completion. Both levels retain Junkyard station cadence, standard player integrity/movement, and eight debris slots. No fuel or additional mechanics. These reward distributions and thresholds are initial playtest settings.

## v0.10 — Encounters and Endless progression

Ready for review. Station status counts down to the horizontal deposit window; players must still align altitude. The next return is sampled in advance from the existing ranges so the departure countdown is accurate. Station speed, opening coordinates, return ranges, campaign targets, physics, and mobile input protections are unchanged.

Recovery Detail reserves three of its eight slots for lightweight scrap pockets: 32px spacing, shared speed, and a compact altitude spread. A cleared or missed pocket returns as a group. Temptation reserves one slot for a $150–$200 high-orbit satellite that crosses the player four seconds before station range on every pass. Both patterns are data in `src/levels.js`, consumed by the shared engine. No new drift behavior.

Endless phases use banked value within a repeating $750 cycle: Open field at $0, Scrap pockets at $150, High-value passes at $300, Recovery stretch at $500. Recovery uses five light mid-orbit objects. A deposit previews the resulting phase; Keep Salvaging applies it to future spawns, preserving debris and tethers already in flight. Large deposits select the phase for the resulting bank total. Timed encounters begin with the next station return after entering that phase.

Score milestones are $150, $300, $500, $750, $1,000, then every $250 indefinitely. Banking across a milestone announces it. Every successful Endless deposit pauses for Keep Salvaging or Finish Run Successfully, including deposits below $150. Finishing shows Run Complete without campaign stars or unlocks; continuing retains normal failure outcomes. The existing separate Endless best and campaign save keys are retained; no save migration or new persistent fields.

Validation: `node tests/acceptance.mjs` covers countdown/queued returns/pause, pocket recurrence and capacity, encounter alignment, bank-only phase transitions and previews, multi-threshold deposits, repeated cycles, finish/replay/failure, existing saves, mobile pointer ownership, and offline update isolation. Browser QA verified flight, banking preview, and successful finish at 320×568 and 375×667 with no console errors. Real iOS gesture behavior and initial balance settings still need hands-on playtesting. Fuel, upgrades, drifting debris, and new campaign levels remain deferred. Do not merge or deploy without approval.

## v0.11 — Contracts and shared upgrades

Nine repeatable contracts span Easy, Medium, and Hard jobs: total deposited objects, deposited panels/satellites, and deposited salvage value. Choose one job from the new contract board. Deposits immediately credit a separate career wallet; the first qualifying deposit also pays the bonus and records completion. Continuing pays only additional salvage, while a new run can earn its bonus again. Failure, restart, and menu exit retain deposited earnings and lose carried salvage. Campaign/Endless scores are not imported into the wallet, and only Contracts award spendable money.

The workshop offers three tiers each of reel speed (10/20/30% shorter tether duration) and thruster power (+6/12/18%). Purchased upgrades apply to **Campaign, Endless, and Contracts** at run launch. Reel tiers cost $900/$3,500/$9,000; thrusters cost $1,000/$4,000/$10,000. Second and third tiers require 3 and 6 distinct completed contracts respectively. Replays do not increase the distinct-job count. These are initial playtest settings, not a validated multi-day progression curve.

Career data uses `orbital-cleanup-career-v1`, separate from existing campaign and best-score keys. Blocked storage falls back to session memory with a visible notice. Existing stars and scores are preserved; new runs in all modes benefit from purchased gear. The contract clipboard is an alpha-transparent generated PNG cached for offline use.

Validation: `node tests/acceptance.mjs` covers every contract objective/payout, mixed-type multi-deposit recovery, lost cargo, bonus duplication, campaign/save isolation, purchase requirements and caps, reload and unavailable storage, and gear effects in all modes, plus the existing gameplay/input/PWA checks. Browser QA checked 320×568 and 375×667 menu layouts, contract board, workshop, launch and pause/exit, with no browser warnings/errors observed. Real-device handling and progression pacing need playtesting. This local build has not been merged or deployed.


## v0.12 — Lost Equipment and Heavy Metal

World One now has seven available missions. Lost Equipment requires five deposited tool crates; Heavy Metal requires three deposited rocket fragments. Higher stars also require the type quota, plus $550/$850 or $750/$1,100 banked respectively. Existing Level 5 completion unlocks Level 6 automatically; completing Level 6 unlocks Level 7.

Tool crates use the approved cream case illustration and carry $60–$80 at 8kg. Rocket fragments use the broken engine illustration and carry $130–$170 at 18kg. Campaign missions contain seven crates or five rocket fragments, spaced 12 or 16 seconds apart. Missed targets circle back; collected targets do not respawn until replay. The existing mass-based reel and flight behavior applies. Equipment Return and Engine Recovery add repeatable targeted contracts with $500 and $700 bonuses. New contracts allow one target item in flight, with minimum 12s crate / 16s fragment spawn intervals. Endless introduces one rare item at a time during Scrap pockets (crates, minimum 18s) and High-value passes (fragments, minimum 24s), preserving the opening and recovery fields. New targets no longer appear in random clusters.

Level 7 ends the currently available missions; the World One finale is still planned. Existing save keys and upgrades are preserved.

New crates and rocket fragments share randomized high (25%), middle (50%), and low (25%) orbit spawning across campaign missions, their contracts, and Endless phases. Edge passes pay the upper portion of each item's existing value range and display a value highlight.


## v0.13 — World One finale and Deposit Speed

Sorting Shift (8) requires 3 tool crates and 2 rocket fragments; extra stars require $800/$1,200 banked. Salvage Run (9) requires 4 rocket fragments and $900 banked; extra stars require $1,300/$1,800. Targets use spaced finite pools with two spare items per required type and preserve the shared altitude/risk rules.

Final Sweep (10) contains three assignments: bank six ordinary objects; bank three crates and two fragments; recover and deposit one survey capsule. The capsule appears after 28 seconds near either orbit boundary, after the first station pass, and circles back if missed. Completing an assignment saves the next checkpoint and cumulative bank. Failure or leaving discards only the current assignment's progress; retry restores the checkpoint bank, a fresh field and suit, and the capsule when applicable. Checkpoints persist across reopening when storage is available. Completing all three assignments grants one star, with $1,200/$1,800 total for additional stars. A simple World One Complete screen, campaign badge, and one-time $2,000 wallet reward mark the finale. Replaying starts from assignment one. The concept ending animation is not included.

Deposit Speed tiers reduce each item transfer duration by 15%/30%/45% relative to v0.12. Prices are $800/$3,000/$7,500 with the existing 0/3/6 different-contract gates. It applies on next launch in every mode; Reel Motor and thrust remain separate. Older saves default the new upgrade to tier zero.


## v0.14 — Mission briefings and contract sorting

Selecting a campaign mission expands a connected MISSION BRIEFING directly below its card. Objectives appear as bullets; mixed quotas are separate items, and Final Sweep lists all three assignments with its saved checkpoint. Star requirements remain explicit. Start Mission appears inside the briefing. Selecting another mission moves the briefing and scrolls the selected card into view.

Contracts use the same expandable briefing, with objective bullets, payout terms, and Accept Contract inside the selected card. Only one contract briefing is open at a time. The board automatically sorts Easy, Medium, then Hard, preserving order within each difficulty. Existing objectives, unlocks, saved progress, payouts, and flight behavior are unchanged.

Validation: full acceptance suite and whitespace checks pass; local browser review verified the campaign card, contract objectives, and collapse-on-selection behavior. Brian approved the changes and requested a v0.14 PR targeting production.

## v0.15 — Planned Moon prototype

Brian approved the five lunar salvage sprites and Moon background. Local assets are saved under src/art/lunar/ and previews/lunar-art-v1/ for the next iteration; they are not included in the v0.14 release. Preserve the distant Earth when cropping the Moon background. Next scope: world selector and the first three Moon missions, using the v0.14 inline briefing pattern.
