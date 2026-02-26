# Algebra — Attribute Aliases

Customers shouldn't have to type `x_min` or `x_max`. They think in position + length.

## Customer-facing attributes

| Customer | Meaning    | Internal | Invariant | Agnostic |
| -------- | ---------- | -------- | --------- | -------- |
| `A.x`    | position x | `x_min`  | X - w     | e - l    |
| `A.y`    | position y | `y_min`  | Y - d     | e - l    |
| `A.z`    | position z | `z_min`  | Z - h     | e - l    |
| `A.w`    | width      | `width`  | X - x     | e - s    |
| `A.d`    | depth      | `depth`  | Y - y     | e - s    |
| `A.h`    | height     | `height` | Z - z     | e - s    |
| `A.X`    | far edge x | `x_max`  | x + w     | s + l    |
| `A.Y`    | far edge y | `y_max`  | y + d     | s + l    |
| `A.Z`    | far edge z | `z_max`  | z + h     | s + l    |

Nine aliases, six SOTs, three derived. See [Enlarged Algebra](./enlarged.algebra.md) for the axis-agnostic notation (`s`/`l`/`e`).

## Reference conventions

| Form   | Meaning       | Example          |
| ------ | ------------- | ---------------- |
| `x`    | self's x      | `X - w`          |
| `.x`   | parent's x    | `.w / 4`         |
| `A.x`  | named SO's x  | `A.x + 10`       |

Bare letter = self. Dot-prefix = parent (like `A.x` with name omitted). Dot notation = explicit SO.

## Where it lives

The alias map goes in `Constraints.resolve` and `.write`. Dot-prefix detection is in the Tokenizer — `.x` tokenizes as `{ object: '', attribute: 'x' }`, bare `x` tokenizes as `{ object: 'self', attribute: 'x' }`. `bind_refs` in Constraints resolves `'self'` → SO's own id, `''` → parent id.

## Resolve rule

**Always read `.value`** — invariant computation happens upstream in `enforce_invariants`. The resolver doesn't care whether an attribute is invariant or direct; it just reads the stored value. This keeps the evaluator simple and stateless.

## Empty-formula default (offset model)

When a child's position attribute has no formula, Constraints treats it as `parent.attribute + offset`. The offset is the difference between child and parent at the time the relationship was established (add-child, or first load). This means children track their parent — move the parent, children follow. The offset is stored on the attribute (`attr.offset`).

- Position attributes (`x_min`, `x_max`, `y_min`, `y_max`, `z_min`, `z_max`): empty formula → `parent.value + offset`
- Length attributes (`width`, `depth`, `height`): empty formula → stored value (no parent tracking)

## Compound imperial literals

The tokenizer handles compound feet-inches and mixed-number inches as single literal values in formulas:

| Input | Parsed as |
|-------|-----------|
| `1 1/2"` | 1.5 inches → mm |
| `5' 3"` | 5 feet 3 inches → mm |
| `5' 3 1/2"` | 5 feet 3.5 inches → mm |
| `1/2"` | 0.5 inches → mm |

Lookahead functions `try_compound_feet()` and `try_compound_inches()` in the Tokenizer scan ahead after reading a number to detect these patterns. `Units.parse_fraction()` handles the fractional part. The result is a single `number` token (already converted to mm).

## Invariant enforcement

`enforce_invariants(so)` in Constraints recomputes the invariant attribute on each axis from the other two. Called after `set_formula`, `propagate`, `propagate_all`, and `rebind_formulas`.

- `invariant=0` (start): `start = end - length`
- `invariant=1` (end): `end = start + length`
- `invariant=2` (length, default): `length = end - start`

Skips attributes with explicit user formulas. For invariant=0 or 1, the length attribute value is the preserved quantity (snapshotted when invariant is changed via UI). If length was never initialized (still 0), falls back to geometry (`end - start`), making enforcement a no-op for that axis. Axis.invariant defaults to 1 (end) in constructor, 2 in deserialization fallback. User sets it by clicking the cross column in D_Selection.

**Root zero-clamp:** After computing invariants, if the SO is root (has a scene but no parent), all start values are forced to 0. Root position is always origin.

### Formula clearing on invariant change

When an attribute becomes invariant, any existing user formula on it must be cleared — invariants are computed, not user-driven.

Two sites handle this:

1. **Runtime** (`D_Selection.set_invariant`): calls `constraints.clear_formula(so, attr_name)` before setting `axis.invariant`. This ensures `enforce_invariants` can overwrite the value.
2. **Deserialization** (`Constraints.rebind_formulas`): loops through all axes at the top and clears `formula`/`compiled` on any attribute whose index matches `axis.invariant`. This catches stale formulas saved before the clearing logic existed.

Without this, a persisted formula on an invariant attribute would prevent `enforce_invariants` from computing the correct value (it skips attributes with `attr.compiled`).

## Files

| File | Role |
|------|------|
| `algebra/Nodes.ts` | Node types — literal, reference, binary, unary |
| `algebra/Tokenizer.ts` | String → token stream, unit suffixes, compound imperial |
| `algebra/Compiler.ts` | Recursive descent parser — expression/term/factor/atom |
| `algebra/Evaluator.ts` | Forward eval, reverse propagation, cycle detection |
| `algebra/Constraints.ts` | Glue — formula management, resolve/write, propagation, invariant enforcement |
| `algebra/Orientation.ts` | Compute orientation from bounds, recompute max bounds from rotation |

## Tests

4 files, 154 tests.

| File | Tests | Covers |
| ---- | ----: | ------ |
| `Compiler.test.ts` | 36 | Tokenizer (18): bare numbers, decimals, operators, parens, references, unit suffixes (in/ft/mm/cm), mixed expressions, end token, errors, bare self-refs, dot-prefix parent-refs. Compiler (18): AST shape for literals, refs, precedence, parens, unary minus, unit expressions, bare+dotted+dot-prefix, errors. |
| `Evaluator.test.ts` | 20 | Forward eval (10): literal, ref, four ops, div-by-zero → 0, unary minus, precedence, parens. Reverse propagation (8): solve for single unknown through each op, nested, throws on zero/multiple refs. Cycle detection (5+): acyclic, direct, indirect, self-ref, isolation. |
| `Constraints.test.ts` | 85 | Formula on Attribute (6): set+eval, store, null compiled, bad formula error, cycle error, clear keeps value. Propagation (3): source→dependent, chain cascade, unrelated untouched. Serialize (5): round-trip, omit when absent, deserialize recompiles AST. Orientation (2): copy angles, survives serialize. Add child (4): min bounds track parent, update on move, max bounds, half-smallest-dimension cube. Alias resolution (8): resolve x/X/w/h/d + fallthrough, write x/w + fallthrough. Dot-prefix parent (11): .x binding, explicit SO, mixed, .w alias, no parent → 0, propagation, .w→parent width, add_child_so flow. Bare self (3): x self-ref, w self-width, mixed .x+x. Invariant formulas (5): lookup x/w/X, null for unknown, eval with self. Enforce invariants (8): inv=0/1/2, no override formulas, set_formula triggers, propagate triggers, multi-axis. Contextual aliases (9): self cross-axis, parent cross-axis, tokenizer round-trips, propagation. Translate formulas (21): same-axis bare (all 3 axes), cross-axis, parent dot-prefix, explicit SO refs, invariant agnostic/explicit, mixed mode normalization, values unchanged. |
| `Orientation.test.ts` | 13 | from_bounds (6): flat→identity, non-square angle, 45° around each axis, 30° staircase. Use case S (1): staircase orientation stable on stretch. Use case W (2): fixed dimensions, slides with origin. recompute_max_bounds (3): 45°/30° redistribution, diagonal preserved. |

## Face–Axis Mapping

Faces are indexed 0–5. Each pair shares an axis normal. XY = bottom/top, XZ = front/back, YZ = left/right.

| Index | Name | Normal | Fixed Axis | Editable Axes | Opposite |
|-------|--------|--------|-----------|---------------|----------|
| 0 | bottom | (0,0,-1) | z | x, y | 1 (top) |
| 1 | top | (0,0,+1) | z | x, y | 0 (bottom) |
| 2 | left | (-1,0,0) | x | y, z | 3 (right) |
| 3 | right | (+1,0,0) | x | y, z | 2 (left) |
| 4 | front | (0,+1,0) | y | x, z | 5 (back) |
| 5 | back | (0,-1,0) | y | x, z | 4 (front) |

Vertices 0–3 sit at z_min (bottom face), 4–7 at z_max (top face). Within each quad: (x_min,y_min), (x_max,y_min), (x_max,y_max), (x_min,y_max). Opposite faces pair via XOR: `index ^ 1`.
