# Enlarged Algebra — Axis-Agnostic Notation

the algebra system supports two notations for the same nine attributes. **explicit** names each axis directly (`x`, `w`, `X`). **agnostic** uses positional roles (`s`, `l`, `e`) that mean the same thing on every axis.

## The two notations

every attribute maps to a role: start, length, or end.

| Role   | x-axis | y-axis | z-axis | Agnostic |
|--------|--------|--------|--------|----------|
| start  | `x`    | `y`    | `z`    | `s`      |
| length | `w`    | `d`    | `h`    | `l`      |
| end    | `X`    | `Y`    | `Z`    | `e`      |

in explicit notation, `X - w` means "far edge minus width" on the x-axis. in agnostic notation, the same relationship is `e - l` — and that expression works identically on any axis.

## Cross-axis references

bare `s`/`l`/`e` are contextual — they refer to the owning attribute's axis. to reference a different axis, prefix with the axis letter and a dot:

| From x-axis attr | Meaning         | Explicit equivalent |
|-------------------|-----------------|---------------------|
| `s`               | x-axis start    | `x`                 |
| `l`               | x-axis length   | `w`                 |
| `y.l`             | y-axis length   | `d`                 |
| `z.e`             | z-axis end      | `Z`                 |

parent references use the same pattern with a leading dot: `.l` (parent's same-axis length), `.y.l` (parent's y-axis length).

## Translation

the translate button (`↔ agnostic` / `↔ explicit`) rewrites every formula on the selected object between notations. only the display tokens change — the compiled expression and computed values are identical.

translation maps are built per owning axis. same-axis aliases become bare contextual (`x` → `s`), cross-axis become qualified (`d` → `y.l`). the reverse maps go the other direction.

explicit SO references translate same-axis normally (`SOMEID.x` ↔ `SOMEID.s`). cross-axis explicit SO refs are left as-is (no three-part token form exists).

## Invariant formulas

invariant attributes (marked with ✕ in the separator column) display a derived formula that isn't user-editable.

| Invariant | Explicit (x-axis) | Agnostic (any axis) |
|-----------|-------------------|---------------------|
| start     | `X - w`           | `e - l`             |
| end       | `x + w`           | `s + l`             |
| length    | `X - x`           | `e - s`             |

in agnostic mode, consecutive invariant rows within a group merge into a single visual span — one formula centered across the rows, dividing borders removed.

## Mode detection

the system detects whether an object's formulas are explicit or agnostic by scanning its stored tokens. if all reference tokens use agnostic aliases, the mode is agnostic. if any use explicit aliases, the mode is explicit. objects with no formula tokens default to agnostic display.

the user can override the detected mode with the translate button. the override resets when selecting a different object.

## Agnostic display

in agnostic mode, floating labels (`s`, `l`, `e`) appear to the left of the middle row in each attribute group (next to `y`, `d`, `Y`), reinforcing which role each group represents.

## Batch migration

a dev-only tool translates all library files at once: deserializes each object headlessly, rewrites its tokens to agnostic, re-serializes, and downloads the translated `.di` files. the migrated files replace the bundled defaults in `src/assets/`.

## Named references

the attribute whose formula is being interpreted is on a particular axis, that's the context. so `A.l` on an x-axis attribute refers to `length` on A's x-axis, thus `A.l`  is identical to  `A.w`.

when an attribute is on one axis, and its formula grabs a value on a different axis, it could use something like `A.y.l` (length on the y axis of A). we've decided not to bulk out our compiler. `A.d` is fine, so we keep the explicit tokens around.

## Files

| File | What it adds |
|------|-------------|
| `Constraints.ts` | translation maps, `translate_formulas()`, `invariant_formula_for(mode)`, `detect_formula_mode()` |
| `D_Attributes.svelte` | translate button, mode derivation, agnostic labels, invariant merge |
| `Scenes.ts` | `translate_library()` (temporary, for batch migration) |
