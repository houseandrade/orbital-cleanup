# Mars campaign — v0.17.0 review

Production is v0.16.0. Brian requested missions 4–10, followed by Mars Contracts and Endless after campaign review. This batch completes the campaign for playtesting; it is not merged or deployed.

## Feedback driving this batch

Brian found it too easy to remain in the middle and rarely faced danger. Mars now spreads ordinary support salvage across the flight area, while finite mission pools guarantee outer-band targets. Sample Return and Survey Recovery retain some central targets, but no longer offer enough central targets to complete the quota. Mixed orders in 3-6, 3-9 and the finale put required types at opposite altitudes. Power Reserve requires four arrays from a pool with three at each extreme, so both bands must be visited with standard gear.

The arrival mission remains forgiving. Earth and Moon spawn layouts are unchanged in this batch. Shared cargo momentum applies in every world and mode, giving existing heavy-cargo missions more risk too.

## Mission tuning

| Mission | Name | Banked objective | Higher stars | Recovery design |
| --- | --- | --- | --- | --- |
| 3-1 | Red Arrival | $250 | $450 / $700 | Familiar support, now broader altitude variety |
| 3-2 | Sample Return | 5 samples | $550 / $800 | 7 targets; middle/high/low distribution |
| 3-3 | Survey Recovery | 3 drones | $600 / $900 | 5 targets; high/low/middle distribution |
| 3-4 | Power Salvage | 3 arrays | $750 / $1,050 | 5 targets; introduces heavier loads and early braking |
| 3-5 | Habitat Recovery | 3 frames | $900 / $1,250 | 5 targets; 20kg structural cargo |
| 3-6 | Research Manifest | 4 samples + 2 drones | $850 / $1,200 | 6 upper samples and 4 lower drones, staggered |
| 3-7 | Survey Window | 4 drones | $850 / $1,200 | One upper drone aligned with each station pass; at most 6 recoveries |
| 3-8 | Power Reserve | 4 arrays + $1,000 | $1,350 / $1,750 | 6 arrays split between both extremes; additional support value needed |
| 3-9 | Heavy Lift | 3 frames + 2 rocket fragments | $1,350 / $1,800 | 5 upper frames and 4 lower fragments, staggered |
| 3-10 | Last Ascent | Three assignments, below | $2,300 / $3,000 | Independent checkpoints, unique engine and world reward |

All higher stars also require the objective. Missed finite targets return and collected targets do not replenish. Five support slots remain bounded, with at most two tool crates and two satellites. Survey Window reserves one of its five slots for the timed drone. Engine salvage never appears outside the final assignment.

Technical tuning: outer target bands are y=105–120 and 325–338, inside the existing 75/360 failure boundaries. The existing ±4px wobble remains. Required mixed bands remain farther apart than twice the standard 82px tether reach even under the closest possible wobble. Finite target spacing is 480px at 30px/s; mixed pools are staggered by 240px. Introductory samples retain 420px spacing. Public briefings describe goals, cargo behavior, and missed-item return without exact timing or spawn hints.

Array sections: 14kg, $140–170. Habitat frames: 20kg, $180–220. Ascent engine: 24kg, $550. Existing sample/drone values and masses remain unchanged. Station behavior uses the introductory Mars configuration.

## Last Ascent

1. Secure the research: 3 lower samples and 2 upper drones, with two spares of each type.
2. Recover the infrastructure: 2 upper arrays and 2 lower frames, with two spares of each type.
3. Bring the engine home: one delayed ascent engine in a forgiving central band, so the final heavy return is the focus. Missed engine passes return; failed carried-engine attempts restore the single target.

The `marsFinale` checkpoint stores completed assignment stage and banked value independently of Earth `finale` and `moonFinale`. Failure rolls back only the unfinished assignment. The scanner follows the current assignment. Completing the finale awards the Mars badge and a one-time $2,000 reward tracked by `worldThreeReward`; replays and reloads cannot repeat it. Older saves default to no Mars reward and unlock 3-4 after the existing 3-3 completion.

## Cargo momentum

The existing controls remain: release thrust to brake an upward climb, hold thrust to brake a descent. No random damage or boundary-triggered acceleration was added.

Additional velocity retention ramps smoothly from zero at speed 30 to full strength at speed 80. Load contribution rises to full strength at 60kg. The cargo stabilizer reduces this extra retention alongside existing mass penalties; unloaded motion and motion below speed 30 retain their previous physics. Actual cargo mass, salvage values, collision sizes and reel times are unchanged. Additional damping retention is capped at 0.996.

Fast approaches with at least 14kg aboard show a direction-specific braking cue when a conservative stopping-distance estimate reaches the remaining boundary margin. Warnings supplement the existing escape/surface warnings and do not resize the flight header.

Validation includes actual trajectories: heavy cargo needs more braking distance than an empty suit; stabilization helps; standard gear arrests both early climbs and descents; late braking can cross either boundary; behavior is consistent at 30/120Hz. Hands-on feedback should assess whether the margin feels fair, especially with repeated heavy pickups.

## Review access and checks

Open http://127.0.0.1:8089/previews/v017/playtest.html for standard gear or the scanner, with all Mars missions accessible and a $3,000 test wallet. Preview campaign/career saves are backed up and can be restored. The helper is excluded from production deployment.

`node tests/acceptance.mjs` and `git diff --check` pass. Browser review verified the ten mission cards, braking introduction, array flight artwork at the upper band, and the three-assignment finale briefing. No browser warnings or errors were reported. Hands-on mission balance and momentum feedback are still needed.

## Next

Playtest campaign pacing, outer-band travel, loaded braking, and finale checkpoints. Then create Mars Contracts and Mars Endless using the established per-world patterns. Until then, the menu explicitly offers Moon Endless to active Mars players. Horizontal drone speed variation, suit reinforcement, and upgrade illustrations remain deferred.
