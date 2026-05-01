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

Nine aliases, six SOTs, three derived.

## Axis-agnostic notation

The algebra supports two notations. **Explicit** names each axis directly (`x`, `w`, `X`). **Agnostic** uses positional roles (`s`, `l`, `e`) that mean the same thing on every axis.

| Role   | Agnostic | x-axis     | y-axis     | z-axis     |
|--------|----------|------------|------------|------------|
| start  | `s`      | `x`        | `y`        | `z`        |
| length | `l`      | `w`        | `d`        | `h`        |
| end    | `e`      | `X`        | `Y`        | `Z`        |
| center | `c`      | `x_center` | `y_center` | `z_center` |

In explicit notation, `X - w` means "far edge minus width" on the x-axis. In agnostic notation, the same relationship is `e - l` — an expression that works on any axis.

### The center letter

`c` is a fourth contextual letter — read-only — that resolves to the midpoint between the start and the end of a direction. The value is computed on every read; nothing is stored.

- Bare `c` resolves to the center of the owning attribute's axis. Cross-axis uses the qualified form (`y.c`, `z.c`); cross-axis on the parent uses the dot-prefixed form (`.y.c`).
- Both write paths (the resolver-level write and the free-constant write) refuse a write through a center reference. A drag whose formula reads a center is also refused.
- A refused drag posts the message "cannot drag a center" to the on-screen status strip at the bottom of the canvas.
- Cycle detection at edit time rejects a formula on a start, end, or length cell that references the same-direction same-SO center. The same-axis self-loop check sits in `set_formula`; cross-direction and cross-SO center references are accepted.
- `c` has no concrete per-axis customer letter — the explicit forms are the internal names `x_center`, `y_center`, `z_center`. Formulas store the bare letter literally; the save format is unchanged.

### Cross-axis references

Bare `s`/`l`/`e` are contextual — they refer to the owning attribute's axis. To reference a different axis, prefix with the axis letter and a dot:

| In x-axis formula  | Meaning                | Explicit equiv |
|--------------------|------------------------|----------------|
| `s`                | x-axis start           | `x`            |
| `l`                | x-axis length          | `w`            |
| `c`                | x-axis center          | `x_center`     |
| `y.l`              | y-axis length          | `d`            |
| `z.e`              | z-axis end             | `Z`            |
| `y.c`              | y-axis center          | `y_center`     |
| `.l`               | parent's x-axis length | `.w`           |
| `.y.l`             | parent's y-axis length | `.d`           |
| `.c`               | parent's x-axis center | `.x_center`    |

### Translation

The translate button (`↔ agnostic` / `↔ explicit`) rewrites every formula on the selected object using the opposite notation. Each axis has its own translation maps.

### Mode detection

To detect whether an object's formulas are explicit or agnostic, stored tokens are scanned. If all reference tokens use agnostic aliases, mode is agnostic. If any use explicit aliases, mode is explicit. Objects with no formula tokens default to agnostic. The detected mode is displayed in the translate button.

### Agnostic display

In agnostic mode, floating labels (`s`, `l`, `e`) appear to the left of the middle row in each attribute group, reinforcing which role each group represents.

### Batch migration

A dev-only tool translates all library files at once: deserializes each object headlessly, rewrites its tokens to agnostic, re-serializes, and downloads the translated `.di` files.

## Reference conventions

| Form   | Meaning       | Example          |
| ------ | ------------- | ---------------- |
| `x`    | self's x      | `X - w`          |
| `.x`   | parent's x    | `.w / 4`         |
| `A.x`  | named SO's x  | `A.x + 10`       |

Bare letter = self. Dot-prefix = parent (like `A.x` with name omitted). Dot notation = explicit SO.

Cross-axis named references use explicit tokens only — `A.d` not `A.y.l` — keeping the compiler simpler.

## Named values

Formulas may reference globally named numbers — for example `wall_thickness` or `door_width`. The named-value table sits beside the formula machinery; bare names that no part in the scene owns resolve to it.

- Locality beats globality. If a sibling under the same parent shares the name, the sibling wins. The named-value table is the fallback when no part owns the name.
- A named value can be locked. A locked value refuses reverse propagation, the same way a locked cell does — a drag whose downstream walk lands on a locked named value finds nothing it can move and does nothing.
- The save format carries the named-value table alongside the scene.

## Parse errors

Every parse failure carries a message and a character span into the source. The failing cell shows a red underline under the bad span; hovering reveals the message. Errors persist on a cell until the cell is edited or cleared.

The classifier distinguishes several shapes: unknown attribute on a known SO, unknown SO, leading dot at the start of a name, unexpected dot inside a path, bare SO name with no attribute, and a bare SO name typed where the user meant "self." Fuzzy-match suggestions help with typos in SO names.

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

## AST

**`Abstract Syntax Tree`** — hierarchal data structure that `Compiler.ts` builds out of a formula's text

### Node Types

Four node types in `Nodes.ts`, discriminated on `type`:

| Type | Fields | Example source | Example tree |
|------|--------|----------------|--------------|
| `literal` | `value: number` | `42` | `{ type: 'literal', value: 42 }` |
| `reference` | `object: string, attribute: string` | `.w` | `{ type: 'reference', object: 'parent_id', attribute: 'width' }` |
| `unary` | `operator: '-', operand: Node` | `-x` | `{ type: 'unary', operator: '-', operand: <ref> }` |
| `binary` | `operator: + - * /, left: Node, right: Node` | `.w / 4` | `{ type: 'binary', operator: '/', left: <ref>, right: <literal> }` |

`object` in a reference is resolved during `bind_refs`: `'self'` → the SO's own id, `''` → parent id, anything else → a named SO's id. After binding, `object` is always a concrete id (or the givens sentinel).

### Pipeline

```
formula string
  → Tokenizer.tokenize()         → Token[]
  → Tokenizer.fuse_name_tokens() → Token[] (adjacent tokens collapsed into single token)
  → Compiler.compile()           → Node (recursive descent)
  → Constraints.bind_refs()      → Node (self/parent/bare refs → concrete ids)
  → stored on Attribute.compiled
```

### Grammar

```
expression  →  term (('+' | '-') term)*
term        →  factor (('*' | '/') factor)*
factor      →  '-' factor | atom
atom        →  NUMBER | BARE_NUMBER | REFERENCE | '(' expression ')'
```

Precedence: unary minus > multiply/divide > add/subtract. Parentheses override.

### Forward Evaluation

`Evaluator.evaluate(node, resolve)` — recursive tree walk. References call `resolve(object, attribute)` which reads `attr.value` via `Constraints.resolve`. Literals return their value. Binary/unary apply the operator. Division by zero returns 0.

### Reverse Propagation

`Evaluator.propagate(node, target, resolve, write)` — solves for a single unknown reference. Collects all references in the tree; throws if zero or more than one. Inverts the expression algebraically: walks the tree from root, at each binary node determines which child contains the reference, solves for that child's value, recurses. Writes the solved value via `write(object, attribute, value)`.

Used by `try_solve_given` to adjust a given so a formula evaluates to a target value.

### Cycle Detection

`Evaluator.detect_cycle(formulas)` — DFS over the formula dependency graph. Each formula's references point to other `object.attribute` keys. Returns the cycle path (e.g. `["wall.height", "door.height", "wall.height"]`) or null. Run before accepting a new formula in `set_formula`.

### Freeze

`Constraints.freeze_non_givens(node)` — replaces all non-given references with their current literal values. The result is a simplified tree with only given references remaining. Used before reverse propagation so the solver only sees the given as the unknown.

## Files

| File | Role |
|------|------|
| `algebra/Nodes.ts` | Node types — literal, reference, binary, unary |
| `algebra/Tokenizer.ts` | String → token stream, unit suffixes, compound imperial |
| `algebra/Compiler.ts` | Recursive descent parser — expression/term/factor/atom |
| `algebra/Evaluator.ts` | Forward eval, reverse propagation, cycle detection |
| `algebra/Constraints.ts` | Glue — formula management, resolve/write, propagation, invariant enforcement, translation maps, `translate_formulas()`, `detect_formula_mode()`, center-letter resolver branch and self-loop check |
| `algebra/Orientation.ts` | Compute orientation from bounds, recompute max bounds from rotation |
| `algebra/Givens.ts` | Global table of named numerical values that any formula can reference; lock flag protects a value from reverse propagation |
| `algebra/Errors.ts` | Parse-error classification — message text, span into the source, fuzzy-match suggestions for unknown SO names |

## Tests

7 files cover the algebra subsystem. The full project test count sits at six hundred thirty-one across all subsystems.

| File | Covers |
| ---- | ------ |
| `Compiler.test.ts` | Tokenizer: bare numbers, decimals, operators, parens, references, unit suffixes (in/ft/mm/cm), mixed expressions, end token, errors, bare self-refs, dot-prefix parent-refs. Compiler: AST shape for literals, refs, precedence, parens, unary minus, unit expressions, bare+dotted+dot-prefix, errors. |
| `Evaluator.test.ts` | Forward eval: literal, ref, four ops, div-by-zero → 0, unary minus, precedence, parens. Reverse propagation: solve for single unknown through each op, nested, throws on zero/multiple refs. Cycle detection: acyclic, direct, indirect, self-ref, isolation. |
| `Constraints.test.ts` | Formula on Attribute: set+eval, store, null compiled, bad formula error, cycle error, clear keeps value. Propagation: source→dependent, chain cascade, unrelated untouched. Serialize: round-trip, omit when absent, deserialize recompiles AST. Orientation: copy angles, survives serialize. Add child: min bounds track parent, update on move, max bounds, half-smallest-dimension cube. Alias resolution: resolve x/X/w/h/d + fallthrough, write x/w + fallthrough. Dot-prefix parent: .x binding, explicit SO, mixed, .w alias, no parent → 0, propagation, .w→parent width, add_child_so flow. Bare self: x self-ref, w self-width, mixed .x+x. Invariant formulas: lookup x/w/X, null for unknown, eval with self. Enforce invariants: inv=0/1/2, no override formulas, set_formula triggers, propagate triggers, multi-axis. Contextual aliases: self cross-axis, parent cross-axis, tokenizer round-trips, propagation. Translate formulas: same-axis bare (all 3 axes), cross-axis, parent dot-prefix, explicit SO refs, invariant agnostic/explicit, mixed mode normalization, values unchanged. |
| `Orientation.test.ts` | from_bounds: flat→identity, non-square angle, 45° around each axis, 30° staircase. Use case S: staircase orientation stable on stretch. Use case W: fixed dimensions, slides with origin. recompute_max_bounds: 45°/30° redistribution, diagonal preserved. |
| `Center.test.ts` | Forward reads (cross-direction, cross-SO, with-literal arithmetic, mixed-form sums, freshness on changes). Self-loop rejection at edit time (start, end, length on same direction; qualified-self form). Self-loop acceptance (cross-direction same-SO; cross-SO same-direction). Both write paths refuse to write through a center reference. Status-strip messages on a refused drag — walker, resolver-level write, free-constant write — with dedup. Save-and-reparse round trip and explicit-to-agnostic round trip preserve the bare letter. |
| `Givens.test.ts` | Define and read a named value. Reference resolution (a bare name resolves to the named-value table when no part owns the name). Reverse propagation through a formula updates the referenced named value. A locked named value refuses reverse propagation. Sibling SO name beats a same-spelled named value at the local level (locality wins). |
| `Errors.test.ts` | Parse-error classification (unknown attribute, unknown SO, leading dot, unexpected dot, bare SO without attribute, bare-SO-as-self). Span computation lands on the offending fragment. Fuzzy-match suggestions for unknown SO names. Errors persist on a cell until the cell is edited or cleared. |

## Face-Axis Mapping

Faces are indexed 0-5. Each pair shares an axis normal. XY = bottom/top, XZ = front/back, YZ = left/right.

| Index | Name | Normal | Fixed Axis | Editable Axes | Opposite |
|-------|--------|--------|-----------|---------------|----------|
| 0 | bottom | (0,0,-1) | z | x, y | 1 (top) |
| 1 | top | (0,0,+1) | z | x, y | 0 (bottom) |
| 2 | left | (-1,0,0) | x | y, z | 3 (right) |
| 3 | right | (+1,0,0) | x | y, z | 2 (left) |
| 4 | front | (0,+1,0) | y | x, z | 5 (back) |
| 5 | back | (0,-1,0) | y | x, z | 4 (front) |

Vertices 0-3 sit at z_min (bottom face), 4-7 at z_max (top face). Within each quad: (x_min,y_min), (x_max,y_min), (x_max,y_max), (x_min,y_max). Opposite faces pair via XOR: `index ^ 1`.
