# Units

The units module is in charge of storing every length the app knows about as a single integer-friendly number — millimetres — and then translating that number into whatever the user wants to read on screen. It also does the reverse: read whatever the user types in and turn it back into millimetres.

Citation: `src/lib/ts/types/Units.ts`.

## What the system stores

Every length anywhere in the app is a millimetre count. The user-facing unit is a separate setting, persisted in browser storage, that governs only display and parsing. When the user changes the unit, no stored number changes — only the formatting rule changes.

Citation: `Units.ts` lines 11-38 (the conversion table) and lines 421-429 (the persisted reactive store).

## What the system knows

Twenty-two units across four families.

- **Imperial.** Inch, foot, yard, mile.
- **Metric.** Angstrom, nanometre, micrometre, millimetre, centimetre, metre, kilometre.
- **Marine.** Fathom, nautical mile.
- **Archaic.** Hand, span, cubit, ell, rod, perch, chain, furlong, league.

For each unit the system carries a millimetre factor and a display symbol. The user chooses a family, not a single unit; within the family the system picks the right unit on each side of the screen based on the value's size.

Citation: `Units.ts` lines 11-71 (factors and symbols), lines 77-82 (family membership).

## Reading a number out

Given a millimetre count and a chosen family, the system writes a string the user can read.

- For metric, marine, and archaic, the system walks the family from largest to smallest unit and picks the first unit at which the value reaches one. The value is rounded to the chosen precision (zero to three decimal places).
- For imperial the system uses the compound feet-and-inches form. The inches part is fractional with a denominator chosen by the precision setting — feet only at the coarsest setting, then whole inches, halves, quarters, eighths, sixteenths, thirty-seconds, sixty-fourths.
- A value smaller than a foot is written as inches only. An exact whole-foot value drops the inches. A fraction-only inch value drops the whole part. A whole-inch value drops the fraction.

Citation: `Units.ts` lines 173-202 (the system-aware writer), lines 135-163 (the compound feet-and-inches writer), line 124 (the imperial precision-to-denominator table).

## Reading a number in

Given a string the user typed and the chosen family, the system tries three parses in order.

1. **Compound imperial.** A string with a foot tick or inch tick (`5' 3 1/4"`) goes through the compound parser, which can read whole feet, whole feet plus inches, whole feet plus mixed-fraction inches, an inches-only string, and a feet-only string.
2. **Any unit suffix.** Every unit's display symbol is checked as a suffix; the first match strips the symbol and reads the remainder as a number. This works across families — `5 cm` is parsed as five centimetres regardless of the chosen family.
3. **Bare number.** Anything that parses as a decimal or fraction is read as the family's default unit: foot for imperial, metre for metric, fathom for marine, cubit for archaic.

The number reader handles whole-and-fraction (`5 1/4`), bare fractions (`1/4`), and decimals.

Citation: `Units.ts` lines 298-324 (the system-aware parser), lines 392-415 (the compound reader), lines 367-390 (the number reader), lines 327-334 (the family default unit).

## Snapping and grid spacing

Two helpers turn the precision setting into a grid.

- **Snap.** A millimetre value is snapped to the nearest grid point. Imperial snaps to the nearest fraction of an inch (or nearest foot at the coarsest precision). Metric, marine, and archaic snap to the nearest decimal place in the best display unit.
- **Grid spacing.** The size in millimetres of one cell of the grid. Imperial returns one over the denominator (or one foot at the coarsest setting). Metric returns one over ten to the power of the precision in the best display unit.

Citation: `Units.ts` lines 211-239 (snap), lines 249-265 (grid spacing).

## How the unit family is stored

The chosen unit family is a single-value reactive store, persisted in browser storage under a typed preference key. A subscriber writes any change back to storage immediately.

Citation: `Units.ts` lines 421-429.

## Tests

Round-trip behavior is pinned down in `src/lib/ts/tests/Units.test.ts`.
