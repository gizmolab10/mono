# Algebra — Attribute Aliases

Customers shouldn't have to type `x_min` or `x_max`. They think in position + length.

## Customer-facing attributes

| Customer | Meaning    | Internal | For Invariant |
| -------- | ---------- | -------- | ------------- |
| `A.x`    | position x | `x_min`  | X - w         |
| `A.y`    | position y | `y_min`  | Y - h         |
| `A.z`    | position z | `z_min`  | Z - d         |
| `A.w`    |            | `width`  | X - x         |
| `A.h`    |            | `height` | Y - y         |
| `A.d`    |            | `depth`  | Z - z         |
| `A.X`    | far edge x | `x_max`  | x + X         |
| `A.Y`    | far edge y | `y_max`  | y + Y         |
| `A.Z`    | far edge z | `z_max`  | z + Z         |

Nine aliases, six SOTs, three derived.

## Where it lives

The alias map goes in `Constraints.resolve` and `.write` — the glue layer between the algebra engine and the scene. Tokenizer, compiler, and evaluator stay untouched.

## Tests

4 files, 119 tests.

| File | Tests | Covers |
| ---- | ----: | ------ |
| `Compiler.test.ts` | 40 | Tokenizer (17): literals, unit suffixes, operators, parens, dotted refs, bare refs, errors. Compiler (23): AST shape for literals, refs, precedence, parens, unary minus, unit expressions, bare+dotted, errors. |
| `Evaluator.test.ts` | 26 | Forward eval (10): literal, ref, four ops, div-by-zero → 0, unary minus, precedence, parens. Reverse propagation (9): solve for single unknown through each op, nested, throws on zero/multiple refs. Cycle detection (7): acyclic, direct, indirect, self-ref, isolation. |
| `Constraints.test.ts` | 40 | Formula on Attribute (6): set+eval, store, null compiled, bad formula error, cycle error, clear keeps value. Propagation (3): source→dependent, chain cascade, unrelated untouched. Serialize (4): round-trip, omit when absent, deserialize recompiles AST. Orientation (2): copy angles, survives serialize. Add child (4): min bounds track parent, update on move, max bounds, half-smallest-dimension cube. Alias resolution (9): resolve x/X/w/h/d + fallthrough, write x/w + fallthrough. Bare attribute (6): parent binding, explicit SO, mixed, w alias, no parent → 0, propagation. Invariant (6): lookup x/w/X, null for unknown, eval with parent, self-ref identity. |
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
