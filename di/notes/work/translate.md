# Formula Translation — Axis Explicit ↔ Agnostic

## Problem

formulas currently store whatever the user typed — `x`, `.w`, `s`, `.l`, whatever. there's no way to see the same formula in the other notation. if i wrote `.w - inset * 2` and later want the agnostic form, i have to manually retype `.l - inset * 2`.

## Goal

a translate button at the bottom of the attributes table. click it, and every formula on the selected SO rewrites its tokens between axis-explicit and axis-agnostic forms. the compiled AST doesn't change — just the stored display text.

## Axis-Qualified References

`s`/`e`/`l` alone are contextual to the owning axis. cross-axis references use an axis qualifier: `y.l` means "y-axis length" regardless of which axis owns the formula.

on an x-axis attribute:
- `x` ↔ `s`, `X` ↔ `e`, `w` ↔ `l` — same axis, bare
- `y` ↔ `y.s`, `Y` ↔ `y.e`, `d` ↔ `y.l` — cross-axis, qualified
- `z` ↔ `z.s`, `Z` ↔ `z.e`, `h` ↔ `z.l` — cross-axis, qualified

on a y-axis attribute:
- `y` ↔ `s`, `Y` ↔ `e`, `d` ↔ `l` — same axis, bare
- `x` ↔ `x.s`, `X` ↔ `x.e`, `w` ↔ `x.l` — cross-axis, qualified
- `z` ↔ `z.s`, `Z` ↔ `z.e`, `h` ↔ `z.l` — cross-axis, qualified

every alias translates. no exceptions.

### implemented

axis-qualified references are live. both self (`y.l`) and parent (`.y.l`) forms work.

**tokenizer**: extended dot-prefix parser to handle `.axis.attr` — when `.identifier` is followed by another `.identifier`, the first is the axis qualifier (object=`'.y'`), the second is the attribute. untokenize reconstructs `.y.l` automatically.

**bind_refs**: three new cases before the standard logic:

- object is `.x`/`.y`/`.z` → axis-qualified parent reference, expand using specified axis
- object is `x`/`y`/`z` → axis-qualified self reference, expand using specified axis

SO ids are `NEW...`-prefixed, so no collision with single-letter axis names.

**tests**: 9 new tests covering self cross-axis, parent cross-axis, tokenizer round-trips, and propagation. 404 tests pass.

## How It Works

### Token rewrite function

new method on `Constraints`: `translate_formulas(so, direction)` where direction is `'agnostic' | 'explicit'`.

for each attribute with stored formula tokens:
1. determine the owning axis via `attribute_to_axis[attr.name]`
2. walk the token array
3. for each reference token:
   - **→ agnostic**:
     - same-axis alias (`x` on x-axis attr) → bare contextual (`s`)
     - cross-axis alias (`d` on x-axis attr) → qualified contextual (`y.l`)
   - **→ explicit**:
     - bare contextual (`s`) → same-axis alias (`x` on x-axis attr)
     - qualified contextual (`y.l`) → cross-axis alias (`d`)
4. if any token changed, update `attr.formula` (the token array — no recompile needed, AST is unchanged)

### Translation maps

built from existing `axis_concrete` and `attribute_to_axis` tables.

**→ agnostic** (per owning axis): for each of the 9 aliases, determine if same-axis or cross-axis, emit bare or qualified form.

```
// owning axis = x:
//   x → s,  X → e,  w → l           (same axis, bare)
//   y → y.s, Y → y.e, d → y.l       (cross-axis y, qualified)
//   z → z.s, Z → z.e, h → z.l       (cross-axis z, qualified)
```

**→ explicit**: reverse — `s`→same-axis start, `y.s`→`y`, `y.e`→`Y`, `y.l`→`d`, etc.

### UI — translate button

a small button below the bounds table in `D_Attributes.svelte`. two states:
- shows "s e l" when formulas are currently explicit → click translates to agnostic
- shows "x X w" when formulas are currently agnostic → click translates to explicit

detection: scan all formula tokens on the selected SO. if any reference uses a contextual alias (`s`/`e`/`l`) or axis-qualified form (`y.l`), the SO is in agnostic mode. otherwise explicit. mixed mode counts as explicit (button click normalizes everything to agnostic).

### What doesn't change

- compiled AST — untouched, already bound to concrete aliases
- evaluated values — identical either way
- serialization — `attr.serialize()` calls `untokenize(formula)`, so saved files reflect the current notation
- propagation — nothing to re-propagate

## Files

**Modify:**
- `di/src/lib/ts/algebra/Constraints.ts` — add `translate_formulas(so, direction)`, update `bind_refs` for axis-qualified refs
- `di/src/lib/svelte/details/D_Attributes.svelte` — add translate button below bounds table

**No new files.**

## Edge Cases

- **no formulas**: button disabled or hidden when no formulas exist on the SO
- **dot-prefix same-axis**: `.s` ↔ `.x` — works, only the attribute swaps
- **dot-prefix cross-axis**: `.y.l` ↔ `.d` — works, tokenizer handles two-dot syntax
- **explicit SO references**: `ABC123.s` ↔ `ABC123.x` — works the same way
- **invariant formulas**: invariant formulas DO translate. `invariant_formula_for()` currently returns axis-explicit strings (`'X - w'`). in agnostic mode, the pattern is the same for every axis:
  - start invariant → `e - l`
  - end invariant → `s + l`
  - length invariant → `e - s`
  add a `mode` parameter to `invariant_formula_for(alias, mode)` — when `'agnostic'`, return the generic form. the UI already has `attr_index` in the `fml()` call, so it knows which slot is invariant.
- **constant naming**: all algebraic token characters are DISALLOWED as names of user supplied constants. suggest a good UX.

## Migration Steps

1. **Translation maps** (Constraints.ts) — build `to_agnostic` and `to_explicit` maps per axis from existing `axis_concrete` / `contextual_aliases` tables. same-axis bare (`x`→`s`), cross-axis qualified (`d`→`y.l`). reverse for explicit.
2. **`translate_formulas(so, direction)`** (Constraints.ts) — walk each attribute's stored `formula` token array. for each reference token, look up `attribute` (and `object` for axis-qualified) in the direction map for that attribute's owning axis. swap token fields in place. no recompile, no propagation.
3. **`invariant_formula_for(alias, mode)`** (Constraints.ts) — add optional `mode: 'explicit' | 'agnostic'` param (default `'explicit'`). when `'agnostic'`, return universal form: start→`e - l`, end→`s + l`, length→`e - s`.
4. **Tests** (Constraints.test.ts) — round-trip (explicit → agnostic → explicit), same-axis bare, cross-axis qualified, dot-prefix, explicit SO refs, invariant agnostic, mixed mode normalization.
5. **`detect_formula_mode(so)`** (Constraints.ts) — scan all formula tokens on the SO. if any reference uses a contextual alias (`s`/`e`/`l`) or axis-qualified form (`y.l`), return `'agnostic'`. mixed counts as explicit.
6. **Translate button** (D_Attributes.svelte) — below bounds table, above rotations. label reflects current mode: `s e l` when explicit, `x X w` when agnostic. calls `translate_formulas`, `tick`, `save`. disabled when no formulas or root.
7. **Invariant display wiring** (D_Attributes.svelte) — pass detected mode to `invariant_formula_for(label, mode)` in `fml()`. invariant cells show `e - l` or `X - w` based on mode. still disabled, display-only.
