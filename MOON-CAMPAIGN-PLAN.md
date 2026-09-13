# Moon campaign — missions 2-4 through 2-10

Planning draft, following approval to deploy v0.15. Missions 2-1 through 2-3 introduce lunar scenery, rover wheels, and oxygen tanks. Complete the ten-mission Moon campaign before adding lunar contracts. Extend Endless Orbit to follow the player's active campaign world in the subsequent mode update.

## Proposed mission progression

| Mission | Working title | Starting objective | Intended challenge |
| --- | --- | --- | --- |
| 2-4 | Field Research | Bank 3 lunar instrument packages | Introduce the approved antenna-box sprite in the safer middle band. Packages are light, valuable, and spaced apart; missed targets return. |
| 2-5 | Landing Debris | Bank 3 lander legs | Introduce the approved gold strut sprite and heavier cargo. Teach short trips before placing these targets at the edges. |
| 2-6 | Workshop Delivery | Bank 3 rover wheels and 2 tool crates | Mix Moon and Earth salvage. Choosing the types still needed matters more than collecting everything. |
| 2-7 | Off Course | Bank 3 drifting instrument packages | Introduce gentle vertical movement on selected targets, within safe altitude limits. Ordinary salvage stays familiar. |
| 2-8 | Catch the Window | Bank 4 instrument packages | Instruments cross ahead of the station. Offer a timing decision: reel one more target or deposit the current load. Missed packages return; no hard deadline. |
| 2-9 | Heavy Recovery | Bank 3 lander legs and 2 rocket fragments | Combine the two heavy types. Cargo management and station alignment provide the challenge rather than raising the target count dramatically. |
| 2-10 | Last Rover | Complete three checkpointed assignments | Clear 6 tanks and 3 wheels; recover 2 legs and 2 instrument packages; then recover and bank the abandoned rover chassis. |

Objective counts are initial design suggestions, not approved balance values. Retain the current optional bank-value star structure, with all mission quotas required for every star. Set value thresholds after measuring first-star completion pacing. Keep missions achievable with standard gear; upgrades should help rather than gate access.

## Salvage and encounter rules

- Instruments: a light, high-value salvage class with the already approved instrument-package artwork. Their identifying feature is the antenna, not a reused crate silhouette.
- Lander legs: heavy cargo using the already approved gold-strut artwork. Start around the existing rocket-fragment mass, with values tuned against wheel/tank rewards.
- Rover chassis: a unique finale target, heavier than a leg but recoverable with standard gear and the existing tether. No new control or mandatory upgrade.
- Finite mission pools should include two spare targets per required type. Keep deliberate spacing and circle missed items back, preserving the successful World One recovery behavior.
- Prototype drift in one mission first. Bound the full sprite/collision shape inside the recoverable field. Tether motion, visible target position, and collision position must agree.
- Avoid stacking vertical drift and timed station encounters on the same targets in their introductory missions.
- Reuse the Moon horizon and distant Earth; retain foreground readability and existing lunar Surface Impact feedback.

## Finale and rewards

Reuse checkpoint behavior, generalized per world: bank totals and assignment progress persist at assignment boundaries; failure discards only the current assignment. The unique rover appears after an initial station pass, returns if missed, and returns on checkpoint retry. Do not reuse Earth-only finale assumptions or World One's reward claim flag. Give Moon completion its own badge, a one-time wallet reward with a separate claim flag, and a short completion beat. Reward amount and ending presentation remain design choices.

## Subsequent mode update

After missions 2-1 through 2-10 are implemented and playtested:

1. Add lunar contracts using wheels, tanks, instruments, and lander legs, retaining inline briefings and Easy → Medium → Hard sorting. Keep the rover special to the finale initially.
2. Make Endless Orbit use the player's active campaign world. Proposed rule: entering Moon campaign progression sets Moon as the active world; browsing world pages, accepting a contract, or replaying Earth does not silently switch it back. Finishing the Moon leaves it active. Label the destination on the Endless menu card before launch.
3. Lunar Endless should use the lunar environment and salvage mix, with staged introduction of new items and retained rare-item spacing. Preserve existing bank/deposit milestones and shared gear where appropriate.
4. Keep Earth and Moon Endless best scores separate, preserving existing Earth scores. Keep spendable earnings in Contracts under the existing economy policy.

The exact active-world rule is a recommendation for review. The user has requested Moon Endless while actively progressing through Moon missions; it must not depend merely on the last viewed world page.

## Suggested implementation batches

- First: 2-4 through 2-6, using existing objective and spawn systems with the new instrument/leg sprites.
- Second: 2-7 through 2-9, playtesting vertical drift and station timing separately.
- Third: 2-10, per-world checkpoint/reward handling, completion presentation, and a full ten-mission balance pass.
- Then: lunar Contracts and world-aware Endless Orbit.

Missions 2-4 through 2-6 are approved and deployed. Missions 2-7 through 2-9 are now implemented for playtesting in v0.15.3. Mission 2-10 and mode changes remain planned.

## Next destination: Mars

Brian confirmed Mars as World Three after the Moon is complete. Finish the Moon campaign and its Contracts/Endless mode support before beginning Mars. Carry forward ten missions per world, world navigation, and inline briefings. Mars-specific salvage, mechanics, art, and mission design remain open.

## Density principle

Carry World One’s manageable object density across worlds, while allowing different exact values. Prefer small support fields, capped satellites, finite spaced mission pools with spare targets, and staggered mixed types. Avoid random clusters of mission targets.
