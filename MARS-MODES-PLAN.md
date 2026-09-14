# Mars modes — v0.18.0 review

Mars Contracts unlock after the Moon finale, alongside Mars campaign access. The board supports Earth, Moon, and Mars navigation. Browsing or playing contracts does not change the active campaign world.

| Contract | Difficulty | Bank requirement | Bonus |
| --- | --- | --- | --- |
| Sample Order | Easy | 5 sample canisters | $300 |
| Survey Return | Easy | 3 survey drones | $400 |
| Array Recovery | Medium | 4 solar arrays | $800 |
| Expedition Cleanup | Medium | 12 objects | $650 |
| Habitat Recovery | Hard | 4 habitat frames | $1,200 |
| Expedition Payday | Hard | $2,000 | $1,600 |

Targeted jobs use finite, spaced pools with two spares, cycling high/low/middle altitude. Sample spacing is 420px; other targets use 480px at 30px/s. Five support objects retain the campaign artwork and values. General jobs have one recurring sample or frame at a time, at minimum 16/24-second intervals. Banking pays salvage immediately, with one bonus per completed run. Replays remain repeatable and shared upgrades apply.

Mars Endless follows the persistent active world and uses its own `orbital-cleanup-mars-endless-best-v1` score. Existing Earth/Moon records remain intact. The repeating $750 cycle uses Sample field ($0), Survey equipment ($150), Power salvage ($300), and Habitat recovery ($500). Each has five total debris slots and one rare arrival at a time; sample/drone/array/frame intervals are 16/18/20/24 seconds. Phase changes apply after choosing Keep Salvaging and preserve existing objects and tethers. Recurring targets alternate boundaries, support spans both sides, and cargo momentum applies. Endless pays no career currency. The ascent engine remains finale-only.

Validation: full acceptance suite passes, including locks, six payouts, bonus isolation, saved completions, campaign preservation, all Mars phases, rare-item caps, boundary coverage, and separate best scores. Browser review verified the six-job Mars board, the array briefing and $800 bonus, the Mars destination label, and the Sample field launch/surface-failure screen. Balance remains subject to playtesting.

Local review: http://127.0.0.1:8090/previews/v018/playtest.html. Preview saves are backed up and restorable. Select Mars, then Contracts or Endless Orbit. Production remains v0.17.0 pending approval.
