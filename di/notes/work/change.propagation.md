# Change Propagation

Bug analysis and design discussion for how bound changes propagate through the constraint system.

i think this bug can be solved by reversing the role of independent and dependent. normal propagation computes all the value fields in attributes. start at the root, traverse it all, done. that's where the parent is the "default independent variable" in the sense of x in the equation y = ax + b. y here is the derived value, x is fixed. that's normal propagation: derive all the values.

reverse propagation starts from an x, NOT the root. it is how x SHOULD respond to a change in value. It traverses backwards. This traversal also derives values, for those without formulas and for givens.
## Proposal

Implement reverse propagation. Two modes of the same system:

- **Forward** (existing): x is fixed (parent bounds, givens). Derive y (child values). "Given the world, compute where everything is." Starts at root, traverses down.
- **Reverse** (new): y is fixed (drag target). Derive x (parent bounds, givens). "Given where the user wants this, compute what the world must become." Starts at the dragged attribute, traverses up through references, across through invariants.

In forward mode, formulas and givens are independent — they drive values. In reverse mode, they're dependent — they adjust to satisfy the user's intent. Attributes without formulas and givens become the free variables.

This replaces `try_solve_given`, `freeze_non_givens`, `solve_given_attr`, `grow_to_children`, and `to_relative` (~130 lines) with a single reverse traversal that handles root expansion and given adjustment atomically. See "Backwards Propagation" section below for the full trace through the drawer bug.

## The Bug: Stretch Drag on Formula-Locked Bounds

**Scenario:** Two drawer cabinet. Bottom drawer's z_min = `parent.z_min` (formula, no given). z_length = `drawer_height` (given). Invariant = 1 (end derived: z_max = z_min + z_length).

**Expected:** Drag bottom edge of bottom child down → drawer grows taller (z_min moves down, z_max stays, length increases). Root grows to accommodate.

**Actual symptoms (in sequence of attempted fixes):**

1. **Original code:** Bottom edge doesn't move, top edge accelerates upward, destroys layout.
   - Cause: `try_solve_given` indirect path finds z_length's given, solves it with wrong target (absolute/relative mismatch), given changes dramatically, `propagate_all` re-evaluates everything wrong.

2. **After blocking indirect path when direct is formula-locked:** Root grows, but drawer translates instead of enlarging.
   - Cause: `set_bound` moves z_min, `grow_to_children` expands root, but z_length (given) stays the same. Invariant: z_max = z_min + same_length → whole drawer shifts down.

## Root Cause

Three systems interact during stretch drag:

1. **Formula evaluation** — z_min is locked to `parent.z_min`, can't be directly changed
2. **Invariant enforcement** — z_max = z_min + z_length, so length is preserved
3. **Root expansion** — `grow_to_children` expands root when child exceeds bounds

The problem is **ordering**: the length given needs to increase by the same amount the root expands, but root expansion happens after the solve attempt.

## `try_solve_given` Absolute/Relative Mismatch

`try_solve_given` receives absolute values from `stretch()`. But `solve_given_attr` needs formula-space values:
- For start/end: formula-space is parent-relative (offset from parent origin)
- For length: formula-space is intrinsic (the actual length value)

For direct children of root (parent origin = 0), the conversion is a no-op. For deeper children, the mismatch causes wrong given values.

A `to_formula_space` helper was added to `try_solve_given` that converts absolute → relative for start/end and passes length through unchanged. This fixes the direct path but the indirect path also needs correct conversion at the `solve_given_attr` boundary.

## Proposed Solutions (Unresolved)

**Option A: Reorder — grow root first, then indirect solve**

Expand root before trying to solve length givens. With root expanded, z_min's formula evaluates to the new (lower) root z_min. Then the indirect solve computes the correct target length.

- Pro: Uses existing solve machinery
- Con: Requires restructuring the drag pipeline; indirect solve still has abs/rel complexity

**Option B: After grow, increase length given by growth amount**

After `grow_to_children`, directly increase the length given by the amount root expanded.

- Pro: Simple, predictable
- Con: Only works for plain given references (not complex formulas like `drawer_height * 2`); couples grow logic to given system

## Backwards Propagation

The bug is a multi-hop constraint problem. The current `try_solve_given` is a flat, single-hop search — it looks at the dragged attribute and its axis siblings. It can't trace through a reference to the parent and also adjust a sibling's given in the same operation.

### The two paths

Dragging z_min down requires two things to change simultaneously:

1. **Up through references** — z_min is `parent.z_min`, so trace up: root.z_min must decrease. This is root expansion.
2. **Across through the invariant** — z_max must stay fixed (stretch semantics). z_max = z_min + z_length, so z_length must increase. z_length = `drawer_height` (given), so solve: `drawer_height = z_max_original - new_z_min`.

```
desired: z_min_abs = target
  → z_min formula = parent.z_min
    → propagate UP: need parent.z_min = target
      → parent is root: expand root.z_min ✓

constraint: z_max_abs stays fixed (stretch)
  → z_max = z_min + z_length
    → z_length = z_max_original - target
      → z_length formula = drawer_height (given)
        → propagate THROUGH given: drawer_height = z_max_original - target ✓
```

### Why the current system can't do this

`try_solve_given` operates on a single SO. It checks one attribute and its axis siblings. It can't:
- Follow a reference to a parent SO (the upward path)
- Coordinate changes across two different targets (root expansion + given adjustment)
- Know that "stretch" means hold the opposite edge fixed

Each attempted fix addressed one path but broke the other. The indirect solve adjusted the given but didn't expand root. The grow_to_children expanded root but didn't adjust the given.

### Bidirectional constraint propagation

The solution: parent pointers on AST nodes, enabling traversal from any node upward through the dependency chain. From the drag intent, a single traversal walks:

- **Up** through formula references to the root — discovering what parent bounds must change
- **Across** through the axis invariant — discovering what given must change to preserve the opposite edge

Both changes are computed from the same drag delta and applied atomically. No ordering problem, no feedback loop.

This is classic parametric CAD constraint solving. The AST becomes a constraint graph. Dragging a point sends a ripple both up (through references) and across (through invariants) to find the minimal set of changes.

### Implementation sketch

1. Add optional `parent` pointer to `Node` type (set during compile or bind_refs)
2. New `solve_stretch(so, bound, target_abs)` in Constraints:
   - Walk the dragged bound's formula upward through references to find the root ancestor
   - Compute the required root expansion (delta between target and current)
   - Walk across the axis to the length attribute, compute the required given adjustment
   - Apply both: expand root, set given
3. Call `solve_stretch` from `stretch()` in Drag.ts instead of `try_solve_given`
4. `propagate_all` after — all formulas re-evaluate with new root bounds and new given

Parent pointers aren't strictly necessary (could build an adjacency map or trace references via the resolver), but they make upward traversal natural.

### Dead code

Reverse propagation replaces ~130 lines:

| Code | Lines | File |
|------|------:|------|
| `try_solve_given` | 50 | Constraints.ts |
| `solve_given_attr` | 15 | Constraints.ts |
| `freeze_non_givens` | 15 | Constraints.ts |
| `to_formula_space` | 5 | Constraints.ts |
| `grow_to_children` | 40 | Engine.ts |
| `to_relative` | 6 | Smart_Object.ts |
| `stretch` lambda complexity | 5 | Drag.ts |

The `stretch` lambda in Drag.ts simplifies to calling the new reverse propagation instead of the try/else pattern.

What survives and gets reused:

- `Evaluator.propagate` / `solve_for_reference` — core inverse algebra, reverse prop builds on it
- `apply_stretch_absolute` — still computes delta and resets to initial
- `propagate_all` — still needed after reverse prop applies changes
- `enforce_invariants` — eliminated if invariants become formulas (see below)

### Invariants as formulas

Currently `enforce_invariants` is a separate post-evaluation step that recomputes the invariant attribute from the other two. It exists because invariants aren't expressed as formulas — they're a hardcoded rule (`length = end - start`, etc.) that runs after formula evaluation. This creates problems:

- Reverse propagation needs special "walk across invariant" logic — it can't just follow formulas
- `enforce_invariants` has 6 call sites and interacts badly with undo (we had to skip it during restore)
- Invariants are invisible in the formula system — they're a parallel constraint mechanism

**Proposal:** When the user sets an invariant, write an actual formula on that attribute:

| Invariant | Attribute | System formula |
|-----------|-----------|----------------|
| 0 (start) | start | `e - l` |
| 1 (end) | end | `s + l` |
| 2 (length) | length | `e - s` |

Self-referencing formulas using agnostic aliases. The formula system already handles self-references.

**What changes:**

- `enforce_invariants` disappears (~30 lines, 6 call sites). Forward propagation evaluates invariant formulas like any other.
- Reverse propagation follows invariant formulas naturally — no special case.
- `rebind_formulas` no longer needs to clear formulas on invariant attributes (lines 374-383) — the invariant IS the formula.

**What needs care:**

- **System vs user formulas.** Invariant formulas are generated, not user-written. `axis.invariant` already identifies which attribute is derived — the UI already uses this to show it as non-editable. No new flag needed. When the user writes their own formula on an invariant attribute, it replaces the system formula.
- **Serialization.** Don't serialize invariant formulas — reconstruct them from `axis.invariant` during deserialization. Keeps file format unchanged. Only user formulas are persisted.
- **Evaluation order.** The two source attributes must evaluate before the invariant. Forward propagation already handles this — `propagate_all` evaluates formulas per-SO, and the invariant formula references siblings that were just set by `set_bound` or other formulas.
- **Cycle detection.** Only one invariant per axis, and it references the other two. No cycle possible within one axis. Cross-axis invariant formulas don't reference each other.

**When the user changes the invariant:**

1. Clear the old invariant formula
2. Write the new invariant formula (system-generated)

No explicit propagation needed — `stores.tick()` after the UI click triggers re-render, which evaluates the new formula naturally. The stale value between click and tick is never visible.

**Additional dead code from this change:**

| Code | Lines | File |
|------|------:|------|
| `enforce_invariants` | 30 | Constraints.ts |
| 6 call sites | ~6 | Constraints.ts |
| invariant clearing in `rebind_formulas` | 8 | Constraints.ts |

Combined with the reverse propagation dead code (~130 lines), total elimination is ~175 lines replaced by uniform formula handling.

## Related Fixes (Completed)

### Undo/Redo

Undo was broken because formula-bearing attributes didn't serialize their runtime values. Three fixes:

1. **Attribute.ts** — `serialize()` always includes `value` alongside formula text
2. **Constraints.ts** — `rebind_formulas(so, parent_id, skip_eval)` skips formula evaluation and invariant enforcement during undo
3. **Engine.ts** — `load_scene(saved, recompute)` gates `propagate_all`, `rebind_formulas` eval, and `fit_to_children` on the `recompute` flag (true for file load, false for undo/redo)

### Root Expansion During Drag

`grow_to_children()` added to Engine — runs after `propagate(changed)` in drag handler. Scans direct children, expands root bounds where children exceed, snapshots/restores children's absolute positions to prevent offset drift.
