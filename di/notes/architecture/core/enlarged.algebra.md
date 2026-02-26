# Enlarged Algebra — Axis-Agnostic Notation

the algebra system supports two notations for the same nine attributes. **explicit** names each axis directly (`x`, `w`, `X`). **agnostic** uses positional roles (`s`, `l`, `e`) that mean the same thing, but apply to every axis.

## The two notations

every attribute maps to a role: start, length, or end.

| Role | Agnostic | x-axis | y-axis | z-axis |
|----|----|----|----|----|
| start | `s` | `x` | `y` | `z` |
| length | `l` | `w` | `d` | `h` |
| end | `e` | `X` | `Y` | `Z` |

in explicit notation, `X - w` means "far edge minus width" on the x-axis. in agnostic notation, the same relationship is `e - l` an expression that means the same on any axis.

## Cross-axis references

bare `s`/`l`/`e` are contextual — they refer to the owning attribute's axis. to reference a different axis, prefix with the axis letter and a dot:

| x-axis Agnostic | Meaning | Explicit |
|----|----|----|
| `s` | x-axis start | `x` |
| `l` | x-axis length | `w` |
| `y.l` | y-axis length | `d` |
| `z.e` | z-axis end | `Z` |
| `.l` | parent’s x-axis length | .d |
| `.y.l` | parent's y-axis length | w |

## Translation

the translate button (`↔ agnostic` / `↔ explicit`) rewrites every formula on the selected object using the opposite notation. each axis has its own translation maps (two, one for each direction).

## Invariant formulas

invariant attributes (marked with ✕ in the separator column) display a derived formula that isn't user-editable.

| Invariant | Explicit (x-axis) | Agnostic (any axis) |
|----|----|----|
| start | `X - w` | `e - l` |
| end | `x + w` | `s + l` |
| length | `X - x` | `e - s` |

in agnostic mode, consecutive invariant rows within a group merge into a single visual span — one formula centered across the rows, dividing borders removed.

## Mode detection

to detect whether an object's formulas are explicit or agnostic, its stored tokens are scanned. if all reference tokens use agnostic aliases, the mode is agnostic. if any use explicit aliases, the mode is explicit. objects with no formula tokens default to agnostic display. the detected mode is displayed in the translate button. clicking that button translates all the formulas for that SO.

## Agnostic tables

in agnostic mode, floating labels (`s`, `l`, `e`) appear to the left of the middle row in each attribute group (next to `y`, `d`, `Y`), reinforcing which role each group represents.

## Batch migration

a dev-only tool translates all library files at once: deserializes each object headlessly, rewrites its tokens to agnostic, re-serializes, and downloads the translated `.di` files. the migrated files replace the bundled defaults in `src/assets/`.

## Named references

each attribute is on a particular axis, and that's its context. `A.l` in an x-axis attribute formula refers to the value of `length` on A's x-axis and is identical to  `A.w`.

however, when an attribute is on one axis (say x), and its formula grabs a value (say d) on a different axis (y), it could use something like `A.y.l` (length on the y axis of A). to support that, our compiler would need more complexity. NOPE! since `A.d` is fine, we keep the explicit tokens around, and our compiler is simpler and more robust.

## Files

| File | What it adds |
|----|----|
| `Constraints.ts` | translation maps, `translate_formulas()`, `invariant_formula_for(mode)`, `detect_formula_mode()` |
| `D_Attributes.svelte` | translate button, mode derivation, agnostic labels, invariant merge |
| `Scenes.ts` | `translate_library()` (temporary, for batch migration) |
