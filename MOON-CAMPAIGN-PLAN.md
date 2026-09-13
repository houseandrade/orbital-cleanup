# Moon campaign — implementation record

Status: complete and deployed through v0.15.5. All ten Moon missions, lunar Contracts, and world-aware Endless Orbit are approved and live. Brian reported that the campaign and mode updates played well. This document records the delivered design; future Mars proposals live in [the roadmap](ROADMAP.md#v016--mars-proposal).

## Delivered mission progression

| Mission | Working title | Starting objective | Intended challenge |
| --- | --- | --- | --- |
| 2-4 | Field Research | Bank 3 lunar instrument packages | Introduce the approved antenna-box sprite in the safer middle band. Packages are light, valuable, and spaced apart; missed targets return. |
| 2-5 | Landing Debris | Bank 3 lander legs | Introduce the approved gold strut sprite and heavier cargo. Teach short trips before placing these targets at the edges. |
| 2-6 | Workshop Delivery | Bank 3 rover wheels and 2 tool crates | Mix Moon and Earth salvage. Choosing the types still needed matters more than collecting everything. |
| 2-7 | Off Course | Bank 3 drifting instrument packages | Introduce gentle vertical movement on selected targets, within safe altitude limits. Ordinary salvage stays familiar. |
| 2-8 | Catch the Window | Bank 4 instrument packages | Instruments cross ahead of the station. Offer a timing decision: reel one more target or deposit the current load. Missed packages return; no hard deadline. |
| 2-9 | Heavy Recovery | Bank 3 lander legs and 2 rocket fragments | Combine the two heavy types. Cargo management and station alignment provide the challenge rather than raising the target count dramatically. |
| 2-10 | Last Rover | Complete three checkpointed assignments | Clear 6 tanks and 3 wheels; recover 2 legs and 2 instrument packages; then recover and bank the abandoned rover chassis. |

The listed objective counts are implemented and approved through playtesting. Higher stars use bank-value thresholds after the mission objectives are met. Keep missions achievable with standard gear; upgrades should help rather than gate access.

## Salvage and encounter rules

- Instruments: a light, high-value salvage class with the already approved instrument-package artwork. Their identifying feature is the antenna, not a reused crate silhouette.
- Lander legs: heavy cargo using the already approved gold-strut artwork. Start around the existing rocket-fragment mass, with values tuned against wheel/tank rewards.
- Rover chassis: a unique finale target, heavier than a leg but recoverable with standard gear and the existing tether. No new control or mandatory upgrade.
- Finite mission pools should include two spare targets per required type. Keep deliberate spacing and circle missed items back, preserving the successful World One recovery behavior.
- Prototype drift in one mission first. Bound the full sprite/collision shape inside the recoverable field. Tether motion, visible target position, and collision position must agree.
- Avoid stacking vertical drift and timed station encounters on the same targets in their introductory missions.
- Reuse the Moon horizon and distant Earth; retain foreground readability and existing lunar Surface Impact feedback.

## Finale and rewards

Reuse checkpoint behavior, generalized per world: bank totals and assignment progress persist at assignment boundaries; failure discards only the current assignment. The unique rover appears after an initial station pass, returns if missed, and returns on checkpoint retry. Do not reuse Earth-only finale assumptions or World One's reward claim flag. Give Moon completion its own badge, a one-time wallet reward with a separate claim flag, and a short completion beat. The deployed v0.15.4 finale uses a $2,000 reward and a rover-secured completion result with a Moon badge.

## Delivered mode update

Implemented and deployed in v0.15.5 after campaign approval:

1. Added lunar contracts using wheels, tanks, instruments, and lander legs, retaining inline briefings and Easy → Medium → Hard sorting. Keep the rover special to the finale initially.
2. Endless Orbit uses the player's active campaign world. Implemented rule: starting a Moon campaign mission sets Moon as the active world; browsing world pages, accepting a contract, or replaying Earth does not silently switch it back. Finishing the Moon leaves it active. Label the destination on the Endless menu card before launch.
3. Lunar Endless uses the lunar environment and salvage mix, with staged introduction of new items and retained rare-item spacing. Preserve existing bank/deposit milestones and shared gear where appropriate.
4. Earth and Moon Endless best scores are separate, preserving existing Earth scores. Keep spendable earnings in Contracts under the existing economy policy.

The active-world rule above is approved and deployed in v0.15.5. The user has requested Moon Endless while actively progressing through Moon missions; it must not depend merely on the last viewed world page.

## Completed implementation batches

- First: 2-4 through 2-6, using existing objective and spawn systems with the new instrument/leg sprites.
- Second: 2-7 through 2-9, playtesting vertical drift and station timing separately.
- Third: 2-10, per-world checkpoint/reward handling, completion presentation, and a full ten-mission balance pass.
- Then: lunar Contracts and world-aware Endless Orbit.

Missions 2-4 through 2-6 are approved and deployed. Missions 2-7 through 2-9 are approved and deployed in v0.15.3. Mission 2-10 is approved and deployed in v0.15.4, using the three assignments above, a 22kg rover, $1,800/$2,400 higher-star targets, and an independent one-time $2,000 reward. Moon contracts and world-aware Endless are approved and deployed in v0.15.5.

## Next destination: Mars

Moon campaign and mode work is complete. Mars is now the next planning focus. See the roadmap for v0.16 salvage, art, gameplay, upgrade, and mission proposals. None of those proposals is implemented yet.

## Density principle

Carry World One’s manageable object density across worlds, while allowing different exact values. Prefer small support fields, capped satellites, finite spaced mission pools with spare targets, and staggered mixed types. Avoid random clusters of mission targets.

## Briefing guideline

Use Heavy Metal’s concise style: clear goals, relevant cargo behavior, and missed-item recovery rules. Do not reveal exact timing, altitude, or spawn patterns. Detailed tuning belongs in developer notes, not player briefings.

## Moon mode implementation — v0.15.5

Six lunar contracts: Tank Return (5 tanks, $220 bonus), Wheel Run (3 wheels, $280), Research Order (4 instruments, $650), Lunar Cleanup (12 objects, $600), Lander Recovery (4 legs, $1,100), and Lunar Payday ($1,800 banked, $1,500 bonus). These settings are implemented, playtested, and approved in v0.15.5. The board separates worlds and sorts each by difficulty; Moon access follows World Two unlock. Briefings retain concise goals/recovery rules.

Moon Endless cycles at existing bank milestones through familiar salvage, wheels/tanks, instruments, and legs. It retains the same five-object budget with reserved rare-item slots, lunar scenery, and Surface Impact behavior. A separate score preserves Earth history. No rover spawns outside the finale and no wallet earnings from Endless.
