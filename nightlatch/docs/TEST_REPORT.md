# Night Latch — Automated playtest report

Generated 2026-10-16T19:02:47.711Z by `npm run playtest` (`tools/playtest.ts`), seed 11, Node v22.22.0.

> **These are automated simulations, not human playtests.** Each run is a scripted or randomized virtual player driving the real game logic (`src/engine` + `src/content`, the same code the browser build runs) through `Game.perform()`, the entry point every mouse click uses. Rendering, animation timing and audio are exercised separately by the Playwright browser tests (see the end of this report).

## Summary

| | |
|---|---|
| Runs executed | **400** |
| Passed | **400** |
| Failed | **0** |
| Game endings reached | 314 |
| Chapter transitions | 2037 |
| Player actions simulated | 197,759 |
| Dialogue choices | 36,594 |
| Wrong item / combination attempts | 34,713 |
| Out-of-order attempts | 16,380 |
| Saves / loads (fresh Game per load) | 7573 / 10260 |
| Autosaves written | 7589 |
| Room changes | 60,682 |
| Exceptions | 0 |
| Runs with invariant violations | 0 |
| Failed chapter transitions | 0 |
| Softlock candidates | 0 |
| Save/load failures | 0 |
| Average actions to finish the game | 598 |
| Average walkthrough steps to finish | 147 |
| Wall-clock time | 4 s |

## Categories

| Category | What it does | Runs | Passed | Failed | Avg actions |
|---|---|---|---|---|---|
| critical | Critical path: walkthrough steps executed in a random valid order, no detours. | 32 | 32 | 0 | 177 |
| explorer | Random valid order plus bursts of random actions between steps: every hotspot and NPC, wrong items on everything, wrong item combinations, repeated and random dialogue, random evidence, random deductions and timeline orders, wrong codes. | 88 | 88 | 0 | 776 |
| saveload | Save and load into a brand-new Game after milestones, reload the latest autosave, and roll back to older saves. | 56 | 56 | 0 | 369 |
| chapter | Start from each chapter’s opening save, play randomly for 40–250 actions, then the solver must still finish the chapter (softlock detection). | 96 | 96 | 0 | 167 |
| chaos | Long random sessions (150–600 actions incl. rapid travel and save/load) from a random chapter; the solver must then finish the whole game. | 48 | 48 | 0 | 428 |
| rapid | Rapid location switching: 10–40 random exits/map hops between every step. | 32 | 32 | 0 | 1574 |
| outoforder | Before each step, try the actions of up to three steps that are not available yet (out-of-order triggers), then continue. | 48 | 48 | 0 | 338 |

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
| Dialogue options chosen | 149 | — |
| Hotspots interacted with | 248 | — |
| Map locations travelled to | 14 | 14 |

### Never reached

- **docs** (1): gus_statement
- **dialogOptions** (12): deacon.piano, deacon.lullaby_early, mabel.drugged, mabel.pad, mabel.fake, mabel.nurse, mabel.frank, mabel.escaped, mabel.plan, sal.sorry, pruett.pad, frank_talkback.wait
- **hotspots** (1): ledge

## Failures

None. All 400 runs reached their goal without exceptions, invariant violations, failed transitions or softlocks.

## Reproducing

```
npm run validate      # static content/art/audio contract check
npm run playtest      # this report (400 runs)
npm run e2e           # Playwright browser tests
```

Per-run results: `reports/playtest-runs.csv`; machine-readable summary: `reports/playtest-report.json`.
