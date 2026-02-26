# Formula Translation — Axis Explicit ↔ Agnostic

## What it does

a translate button (`↔ agnostic` / `↔ explicit`) at the bottom of the attributes table. click it and every formula on the selected SO rewrites its tokens between axis-explicit and axis-agnostic notation. the compiled AST doesn't change — just the stored display text.

agnostic is now the default display mode. SOs with no formulas show agnostic invariants.

## Axis-Qualified References

`s`/`e`/`l` are contextual to the owning axis. cross-axis uses a qualifier: `y.l` = y-axis length.

on an x-axis attribute:
- `x` ↔ `s`, `X` ↔ `e`, `w` ↔ `l` — same axis, bare
- `y` ↔ `y.s`, `Y` ↔ `y.e`, `d` ↔ `y.l` — cross-axis, qualified
- `z` ↔ `z.s`, `Z` ↔ `z.e`, `h` ↔ `z.l` — cross-axis, qualified

same pattern for y-axis and z-axis attributes. every alias translates, no exceptions. parent dot-prefix (`.s`, `.y.l`) and explicit SO refs (`ABC123.s`) also translate.

## Implementation

### Translation maps (Constraints.ts)

`to_agnostic[owner_axis]` and `to_explicit[owner_axis]` — flat `Record<string, string>` built from `axis_concrete` at module init. same-axis entries are bare (`x`→`s`), cross-axis have a dot (`d`→`y.l`). reverse for explicit.

### `translate_formulas(so, direction)`

walks each attribute's stored `formula` token array. for each reference token, looks up in the direction map for the owning axis. swaps token `object`/`attribute` fields in place. handles self, parent dot-prefix, axis-qualified, and explicit SO refs. cross-axis explicit SO refs (`SOMEID.y.l`) are skipped (can't represent as 3-part token). no recompile, no propagation.

### `invariant_formula_for(alias, mode)`

optional `mode` param (default `'explicit'`). agnostic returns universal forms: start → `e - l`, end → `s + l`, length → `e - s`.

### `detect_formula_mode(so)` → `'explicit' | 'agnostic' | 'none'`

scans all formula tokens. if refs exist and ALL are agnostic → `'agnostic'`. if any concrete alias found → `'explicit'`. no formula tokens at all → `'none'`.

### UI (D_Attributes.svelte)

**translate button**: pill-shaped, right-aligned, between bounds table and rotations. shows `↔ agnostic` or `↔ explicit`. works on all SOs including root (root toggles invariant display only).

**formula_mode derivation**: detected `'agnostic'` → agnostic. detected `'explicit'` → explicit (overridable). detected `'none'` → defaults to agnostic (overridable). `display_mode_override` resets on selection change.

**agnostic display features**:
- floating `s`/`l`/`e` labels appear left of the middle row in each group (y, d, Y)
- consecutive invariant rows merge: formula cell gets `rowspan`, dividing borders removed, single formula centered vertically. only in agnostic mode.

**invariant wiring**: `fml()` passes `formula_mode` to `invariant_formula_for()`. invariant cells show `e - l` or `X - w` based on mode.

### Batch migration (Scenes.ts — temporary)

`translate_library()`: loops all library files, deserializes each SO headlessly via `Smart_Object.deserialize()`, calls `translate_formulas(so, 'agnostic')`, re-serializes, downloads each `.di` file. no IDB mutation, no scene clobber. copy downloads into `src/assets/`, then delete the method and its button.

## What doesn't change

- compiled AST — untouched, already bound to concrete aliases
- evaluated values — identical either way
- serialization — `attr.serialize()` calls `untokenize(formula)`, reflects current notation
- propagation — nothing to re-propagate

## Files modified

- `Constraints.ts` — translation maps, `translate_formulas`, `invariant_formula_for(mode)`, `detect_formula_mode`
- `D_Attributes.svelte` — button, mode derivation, agnostic labels, invariant merge, invariant wiring
- `Scenes.ts` — `translate_library()` (temporary)
- `D_Library.svelte` — "translate all" button (temporary)
- `Constraints.test.ts` — 85 tests covering round-trips, cross-axis, dot-prefix, SO refs, invariants, mixed mode

## Edge cases

- **no formulas**: `detect_formula_mode` returns `'none'`, defaults to agnostic display
- **dot-prefix same-axis**: `.s` ↔ `.x` — only attribute swaps
- **dot-prefix cross-axis**: `.y.l` ↔ `.d` — tokenizer handles two-dot syntax
- **explicit SO refs**: same-axis translates normally, cross-axis skipped
- **mixed tokens**: counts as explicit, button normalizes to agnostic
- **root SO**: no stored formulas, display defaults to agnostic via `'none'` detection
