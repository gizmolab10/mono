# Algebra — Attribute Aliases

Customers shouldn't have to type `x_min` or `x_max`. They think in position + length.

## Customer-facing attributes

| Customer | Meaning    | Internal | For Invariant |
| -------- | ---------- | -------- | ------------- |
| `A.x`    | position x | `x_min`  | X - w         |
| `A.y`    | position y | `y_min`  | Y - d         |
| `A.z`    | position z | `z_min`  | Z - h         |
| `A.w`    |            | `width`  | X - x         |
| `A.d`    |            | `depth`  | Y - y         |
| `A.h`    |            | `height` | Z - z         |
| `A.X`    | far edge x | `x_max`  | x + w         |
| `A.Y`    | far edge y | `y_max`  | y + d         |
| `A.Z`    | far edge z | `z_max`  | z + h         |

Nine aliases, six SOTs, three derived.

## Reference conventions

| Form   | Meaning       | Example          |
| ------ | ------------- | ---------------- |
| `x`    | self's x      | `X - w`          |
| `.x`   | parent's x    | `.w / 4`         |
| `A.x`  | named SO's x  | `A.x + 10`       |

Bare letter = self. Dot-prefix = parent (like `A.x` with name omitted). Dot notation = explicit SO.

## Where it lives

The alias map goes in `Constraints.resolve` and `.write`. Dot-prefix detection is in the Tokenizer — `.x` tokenizes as `{ object: '', attribute: 'x' }`, bare `x` tokenizes as `{ object: 'self', attribute: 'x' }`. `bind_refs` in Constraints resolves `'self'` → SO's own id, `''` → parent id.

## Invariant enforcement

`enforce_invariants(so)` in Constraints recomputes the invariant attribute on each axis from the other two. Called after `set_formula`, `propagate`, `propagate_all`, and `rebind_formulas`.

- `invariant=0` (start): `start = end - length`
- `invariant=1` (end): `end = start + length`
- `invariant=2` (length, default): `length = end - start`

Skips attributes with explicit user formulas. For invariant=0 or 1, the length attribute value is the preserved quantity (snapshotted when invariant is changed via UI). If length was never initialized (still 0), falls back to geometry (`end - start`), making enforcement a no-op for that axis. Axis.invariant defaults to 1 (end) in constructor, 2 in deserialization fallback. User sets it by clicking the cross column in D_Selection.

## Tests

4 files, 134 tests.

| File | Tests | Covers |
| ---- | ----: | ------ |
| `Compiler.test.ts` | 45 | Tokenizer (20): literals, unit suffixes, operators, parens, dotted refs, bare self-refs, dot-prefix parent-refs, errors. Compiler (25): AST shape for literals, refs, precedence, parens, unary minus, unit expressions, bare+dotted+dot-prefix, errors. |
| `Evaluator.test.ts` | 26 | Forward eval (10): literal, ref, four ops, div-by-zero → 0, unary minus, precedence, parens. Reverse propagation (9): solve for single unknown through each op, nested, throws on zero/multiple refs. Cycle detection (7): acyclic, direct, indirect, self-ref, isolation. |
| `Constraints.test.ts` | 52 | Formula on Attribute (6): set+eval, store, null compiled, bad formula error, cycle error, clear keeps value. Propagation (3): source→dependent, chain cascade, unrelated untouched. Serialize (4): round-trip, omit when absent, deserialize recompiles AST. Orientation (2): copy angles, survives serialize. Add child (4): min bounds track parent, update on move, max bounds, half-smallest-dimension cube. Alias resolution (9): resolve x/X/w/h/d + fallthrough, write x/w + fallthrough. Dot-prefix parent (8): .x binding, explicit SO, mixed, .w alias, no parent → 0, propagation, .w→parent width, add_child_so flow. Bare self (3): x self-ref, w self-width, mixed .x+x. Invariant formulas (6): lookup x/w/X, null for unknown, eval with self, self-ref identity. Enforce invariants (7): inv=0/1/2, no override formulas, set_formula triggers, propagate triggers, multi-axis. |
| `Orientation.test.ts` | 13 | from_bounds (5): flat→identity, non-square angle, 45° around each axis, 30° staircase. Use case S (2): variable angle updates on stretch. Use case W (2): fixed dimensions, slides with origin. recompute_max_bounds (3): 45°/30° redistribution, diagonal preserved. |

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
