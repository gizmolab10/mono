# DI Codebase Cruft

## Quick wins (delete or one-liner)

NB: LEAVE THESE ALONE!

| What                             | Where                                                           | Why                                            |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Unused `sizeOf_svgPath`          | `common/Extensions.ts:151`                                      | Never called anywhere                          |
| Commented-out boilerplate        | `common/Extensions.ts:464-471`                                  | Dead code                                      |
| Inconsistent `hash()` descriptor | `Extensions.ts:146` — uses `writable:true, enumerable:true`     | Every other extension uses `false/false/false` |
| `debug = false` flag             | `Render.ts:20`                                                  | Face debug colors never enabled, dead path     |
| `hid_unknown = 1000000000000`    | `Constants.ts:14`                                               | Magic debug number, unused                     |

## Redundancy worth consolidating

| What | Where | Savings |
|------|-------|---------|
| Coordinate method explosion | `Coordinates.ts` (468 lines) — `offsetByXY`, `spreadByXY`, `multiply_xBy`, `multiply_yBy`, `extendedByX`, `extendedByY`, etc. | A single `map(fn)` or `transform({x, y})` replaces 10+ methods |
| Verbose/description getters | `Point.verbose`, `Point.pixelVerbose`, `Size.verbose`, `Rect.verbose` — near-identical formatting across 3 classes | Extract one formatter, parameterize |
| Timer properties | `Mouse_Timer.ts` — 5 separate timer properties + 5 start/stop pairs | Replace with `Map<string, Timeout>` + generic `start(name, fn, ms)` / `stop(name)` |
| Extension.ts (472 lines) | Repetitive `Object.defineProperty` boilerplate | A helper `define(proto, name, fn)` cuts this by 60% |

## Over-engineering

| What                      | Where                                                                                  | Simplification                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| S_Component debug logging | `S_Component.ts` — 70+ lines of debug methods, hardcoded type dictionaries             | Rip out to a central `Debug` util with a global toggle                                           |
| Components nested dict    | `Components.ts` — `Dictionary<Dictionary<S_Component>>` with manual cache              | `Map<string, Map<number, S_Component>>` + merge `createUnique` into lookup with optional factory |
| Custom color math         | `Colors.ts` (394 lines) — full RGB/HSB, srgb/linear defined inline in multiple methods | Already imports `color2k`. Use it. Remove custom                                                 |
| S_Component class         | Extends S_Hit_Target, adds only `hid` + `component_id` getter                          | Could be a factory or just fields on S_Hit_Target                                                |

## Inconsistency

| What                     | Details                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Store scattering         | `w_` stores defined in Hits (4), Hits_3D (2), Events (5), Setup (6+). No single "state" module. Hard to trace reactive flow  |
| Persistence pattern      | Some stores subscribe and write to localStorage, others don't. No consistent "persistent store" abstraction                  |
| Setup.ts is a god module | Imports from 7+ modules, owns stores + init + scale + precision + solid + dimensionals. Split into Stores.ts` + `Startup.ts` |

## Structural

| What | Risk |
|------|------|
| Circular dep hack | `S_Hit_Target.ts:8-12` — forward-declares `hits` as `any`, runtime-injected via `setHitsManager()`. Fragile |
| Import chains | Types -> Managers -> Render -> Signals -> Types. Not broken yet, but one wrong import away from a cycle |
| CSS constants in TS | `Constants.ts:17` has `prevent_selection_style` as a string. Styling should live in CSS |

## Not worth touching

- `Coordinates.ts` core math — ugly but correct and heavily used
- `Extensions.ts` prototype augmentation — disagreeable pattern but deep in the codebase, high-risk refactor for low reward
- `Angle.ts` quadrant methods — readable as-is, consolidation would hurt clarity
