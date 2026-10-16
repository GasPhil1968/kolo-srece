# Night Latch — Automated playtest report

Generated 2026-10-16T20:04:02.362Z by `npm run playtest:sweep` (`tools/playtest.ts`): 6 campaign(s) of 2000 runs, seed(s) 1, 2, 3, 4, 5, 6, Node v22.22.0.

> **These are automated simulations, not human playtests.** Each run is a scripted or randomized virtual player driving the real game logic (`src/engine` + `src/content`, the same code the browser build runs) through `Game.perform()`, the entry point every mouse click uses. Rendering, input, animation timing and audio are exercised separately by the Playwright browser tests: see [BROWSER_TEST_REPORT.md](BROWSER_TEST_REPORT.md).

## Summary

| | |
|---|---|
| Runs executed | **12000** |
| Passed | **12000** |
| Failed | **0** |
| Game endings reached | 9509 |
| Chapter transitions | 61645 |
| Player actions simulated | 5,950,381 |
| Dialogue choices | 1,246,944 |
| Wrong item / combination attempts | 1,030,792 |
| Out-of-order attempts | 491,626 |
| Saves / loads (fresh Game per load) | 231100 / 316213 |
| Autosaves written | 229358 |
| Room changes | 1,813,867 |
| Exceptions | 0 |
| Runs with invariant violations | 0 |
| Failed chapter transitions | 0 |
| Softlock candidates | 0 |
| Save/load failures | 0 |
| Average actions to finish the game | 602 |
| Average walkthrough steps to finish | 149 |
| Wall-clock time | 79 s |

## Campaigns

| Seed | Runs | Passed | Failed | Actions |
|---|---|---|---|---|
| 1 | 2000 | 2000 | 0 | 994,886 |
| 2 | 2000 | 2000 | 0 | 990,735 |
| 3 | 2000 | 2000 | 0 | 995,277 |
| 4 | 2000 | 2000 | 0 | 986,562 |
| 5 | 2000 | 2000 | 0 | 991,992 |
| 6 | 2000 | 2000 | 0 | 990,929 |

## Categories

| Category | What it does | Runs | Passed | Failed | Avg actions |
|---|---|---|---|---|---|
| critical | Critical path: walkthrough steps executed in a random valid order, no detours. | 960 | 960 | 0 | 177 |
| explorer | Random valid order plus bursts of random actions between steps: every hotspot and NPC, wrong items on everything, wrong item combinations, repeated and random dialogue, random evidence, random deductions and timeline orders, wrong codes. | 2640 | 2640 | 0 | 772 |
| saveload | Save and load into a brand-new Game after milestones, reload the latest autosave, and roll back to older saves. | 1680 | 1680 | 0 | 383 |
| chapter | Start from each chapter’s opening save, play randomly for 40–250 actions, then the solver must still finish the chapter (softlock detection). | 2880 | 2880 | 0 | 161 |
| chaos | Long random sessions (150–600 actions incl. rapid travel and save/load) from a random chapter; the solver must then finish the whole game. | 1440 | 1440 | 0 | 457 |
| rapid | Rapid location switching: 10–40 random exits/map hops between every step. | 960 | 960 | 0 | 1553 |
| outoforder | Before each step, try the actions of up to three steps that are not available yet (out-of-order triggers), then continue. | 1440 | 1440 | 0 | 339 |

## Invariants checked after every action

- no exceptions; no script errors (unknown items, rooms, dialogs, nodes, points…); the interpreter is idle again
- inventory has no duplicates or unknown items; nothing is both held and confiscated
- the room, clues, deductions and map pins all exist
- chapters only move forward, one at a time, after the previous chapter’s completion condition, through the next chapter’s locked room
- an open objective exists at all times, so the hint button always has something to say
- save → load round-trips are lossless, and play continues correctly in a brand-new `Game` built from the save
- softlock detection: from wherever random play leaves the game, the solver must still be able to finish the chapter or the game

## Coverage across all runs

| Content | Reached | Total |
|---|---|---|
| Rooms | 27 | 27 |
| Clues | 86 | 86 |
| Deductions | 6 | 6 |
| Documents read | 21 | 22 |
| Items held | 51 | 51 |
| Dialogue options chosen | 161 | — |
| Hotspots interacted with | 249 | — |
| Map locations travelled to | 14 | 14 |

### Never reached

Nothing: every room, location, clue, deduction, item, document, dialogue option and hotspot was reached by at least one simulated player.

## Failures

None. All 12000 runs reached their goal without exceptions, invariant violations, failed transitions or softlocks.

## Bugs the automated tests found (all fixed)

Every bug below was found by one of the automated checks: the static validator, the playtest
simulations or the Playwright browser tests. Each was fixed, and the suite that found it was
re-run until it passed.

### Found by the playtest simulations

| # | Bug | How it showed up | Fix |
|---|---|---|---|
| 1 | Hiding an NPC after a scene removed it **from every room for good**. Delaney never appeared on the clock tower roof, and Nora never appeared at the dawn epilogue. | Every full run stuck in chapter 8 (softlock) | `hide` now releases the NPC to its default placements; scene staging is reset at each chapter start |
| 2 | After Frank's surrender the rooftop conversation stayed open, and the surrender could play again. | Dialogue loop in the critical-path run | Rooftop options only exist before the surrender |
| 3 | The live broadcast had **no way out**. A player who didn't know which evidence to show was stuck in the conversation, without access to the notebook. | Random players hit the 200-choice dialogue guard | "(Cover the microphone and check my notes.)" leaves; the microphone and the transmitter key resume the broadcast |
| 4 | Using the booth key again after leaving the broadcast only said "We're on the air." | Steps kept failing in chaos runs | The transmitter now resumes the broadcast |
| 5 | Actions on **hidden hotspots** were executed by the logic layer. Example: the key ring before Danny moves it, which skipped the timeline. The player then missed "for Sgt. Rook" and could not finish chapter 8. | Out-of-order runs: confession impossible (softlock) | The engine ignores look/use/item on hotspots whose condition is false; map travel needs an open street exit |
| 6 | **Evelyn's phone number was missable.** Taking the case before asking how to reach her made the chapter 3 reverse-directory puzzle unsolvable. | Explorer runs: step kept failing (softlock) | Evelyn leaves her number when Rook takes the case |
| 7 | The step for Kessler's test was offered while Rook was still locked in the cold store. | Steps kept failing in random orders | Walkthrough precondition corrected; the solver retries steps after progress |

### Found by the static validator

| # | Bug | Fix |
|---|---|---|
| 8 | Talking to Nora at the mission, or to Vivian, Kroll, Vey, Crane or Morrow, referenced dialogues that don't exist | Default lines for every character |
| 9 | The Halcyon House and Pier 4 map pins pointed at arrival points that don't exist | Arrival points set to `start` |
| 10 | A condition tested a flag that is never set (`c4_van`) | Removed |
| 11 | The holding-cell key ring is painted in two places but had one hotspot | Split into `keys` / `keys_near` |
| 12 | 14 painted hotspots had no look or use text (old bar, trolley, fresh grave, bell rope, fire notice, service stairs, two clocks, cabin calendar, ship's clock, sea chest, engineer's chair, ash-can, oak) | Descriptions and interactions written. The Halcyon gate is now explorable rather than an instant cutscene |
| 13 | Three sound effects used by the game were missing from the audio set | Added to the audio build |
| 14 | State objects existed in the art but were never shown (`carbon_gone`, the 9 o'clock booth clock) | Wired to their story flags |

### Found by the Playwright browser tests

| # | Bug | How it showed up | Fix |
|---|---|---|---|
| 15 | **Loading a save while a game was running** (pause menu → Load) hung. The queued shutdown of the old room tore down the freshly loaded one. | Gallery test could not load a second room | Wait for the old game's scenes to stop before building the new one |
| 16 | **After loading, the inventory looked empty.** The HUD kept references to the destroyed slot icons of the previous game. | Empty inventory in screenshots | The HUD resets completely on every start; a test now checks the icons after loading |
| 17 | On the second combination lock, the digits did not change on screen when turning the wheels | Page errors during the browser playthrough | Close-up scene state is reset on every opening |
| 18 | The N, M and Esc shortcuts stopped working: the key that opened an overlay closed it again in the same frame | "N opens the notebook" check failed | Overlay close keys ignore the first 200 ms |
| 19 | Music changing twice within 0.7 s crashed the cross-fade every frame, freezing the chapter card | Playthrough stuck on a chapter card | Volume fades run on the game clock and survive scene changes |
| 20 | Character animation timers fired on sprites destroyed by a reload, and UI refreshes ran after returning to the title | Page errors | Guards on destroyed sprites and stopped scenes |
| 21 | The notebook's lists could be scrolled past the end | Deduction clicks drifted | Scrolling is clamped |

## Reproducing

```
npm run validate        # static content/art/audio contract check
npm run playtest        # one campaign: 2000 runs, seed 1 (~15 s)
npm run playtest:sweep  # six campaigns, seeds 1-6 (this report when it lists six seeds)
npm run e2e             # Playwright browser tests (after npm run build)
```

Per-run results: `reports/playtest-runs.csv`; machine-readable summary: `reports/playtest-report.json`.
