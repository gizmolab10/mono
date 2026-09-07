# Change Propagation

## Core Idea

Two modes of the same system, distinguished by traversal direction:

- **Forward** (existing): x is fixed (parent bounds, givens). Derive y (child values). "Given the world, compute where everything is." Starts at root, traverses down.
- **Reverse** (new, inside `set_bound`): y is fixed (the target value). Derive x (parent bounds, givens). "Given where the user wants this, compute what the world must become." Starts at the target attribute, traverses up through references, across through invariants.

In forward mode, formulas and givens are independent — they drive values. In reverse mode, they're dependent — they adjust to satisfy the user's intent. Each operator is inverted along the way.

### Reversed traversal

For y = ax + b, the forward AST:

```
    +
   / \
  *    b
 / \
a    x
```

Reverse propagation starts from x, NOT the root. Beginning at **`x`**, we go up and encounter **`*`**. We invert that to **`/`**. But we need the other operand first — so we go up again to **`+`**, invert that to **`-`**, and grab its sibling: **`b`**. Now we can compute **`y - b`**. Back down at the **`*`** level, we grab its sibling **`a`** and apply the inverted **`/`**: **`(y - b) / a`**.

The reversed AST — the order of computation:

```
    /
   / \
  -    a
 / \
y    b
```

`Evaluator.propagate` already does this within a single formula. The new part is the multi-hop, cross-SO version: following the chain of formulas across multiple attributes and multiple SOs, delegating to `Evaluator.propagate` for the algebra at each step.

## Proposal

Reverse propagation lives inside `set_bound` itself. Every call to `set_bound(bound, value)` becomes: "make this bound reach this absolute value by tracing the formula chain and adjusting whatever free variables are necessary." No formula: set directly. Has formula: reverse propagate.

Every drag type — face drag, stretch drag, corner drag, dimension editor — calls `set_bound`. Stretch vs move intent is implicit in which bounds the caller sets. For stretch, the caller sets both the dragged edge and the derived dimension (e.g., `set_bound(z_length, opposite - target)` then `set_bound(z_min, target)`); each call does reverse prop independently. Face drag sets all six bounds. Calling order: **dimensions before positions** — reverse prop on a dimension adjusts givens, reverse prop on a position adjusts parent bounds, forward prop then settles everything.

Invariants become system formulas (`e - s`, `s + l`, `e - l`) so forward prop handles them uniformly — no separate `enforce_invariants` step. Reconstruct from `axis.invariant` during deserialization; don't serialize. Important: the invariant attribute is never the target of `set_bound` — only of forward prop. Invariant formulas have two self-references (`e - s`), which `Evaluator.propagate` can't solve (requires one unknown). The caller sets the dimension and the edge; the invariant is always computed, never set.

Root start bounds are always 0. This is the one special case `set_bound` must handle: root start has no formula (plain value), so "no formula -> set directly" would allow negative values. Instead, `set_bound` on a root start bound redirects to the corresponding end bound and shifts children's offsets to preserve absolute positions.

### Implementation

1. Convert invariants to system formulas so all constraints are in the AST
2. Add optional `parent` pointer to `Node` type (set during compile or bind_refs)
3. Rewrite `set_bound` in Smart_Object: no formula -> set directly; has formula -> reverse propagate
4. Forward propagation runs after as usual to cascade changes to dependents

Replaces ~175 lines: `try_solve_given`, `solve_given_attr`, `freeze_non_givens`, `enforce_invariants` (+ 6 call sites), invariant clearing in `rebind_formulas`, `stretch` lambda complexity, root-specific stretch logic in Drag.ts.

Survives: `Evaluator.propagate` / `solve_for_reference` (core inverse algebra), `apply_stretch_absolute` (delta + reset), `propagate_all` (forward cascade).

### Tests

**Reverse propagation:**

- No formula -> sets value directly
- Formula referencing a given -> solves for the given
- Formula referencing parent -> adjusts parent bound
- Formula `parent.z_min`, parent is root -> expands root
- Root start bound -> redirects to end, children preserve absolute positions
- Two-hop chain: child refs parent, parent refs given -> solves given
- No solvable free variable -> no-op or error
- Complex formula (`given * 2 + 5`) -> solves via `Evaluator.propagate`
- Multiple calls (face drag: all 6) -> all move, no invariant conflict
- Dimensions-before-positions ordering -> opposite edge stays fixed

**Invariants as formulas:**

- Setting invariant 0/1/2 writes correct system formula
- Changing invariant clears old, writes new
- Evaluates correctly in forward propagation
- Not serialized -- reconstructed on deserialize
- User formula replaces system formula
- Reverse prop through invariant -> adjusts sibling attributes

**Regression:** all 85 Constraints tests, all 20 Evaluator tests, undo/redo round-trip.

## Maybe

**`is_root` flag on Smart_Object** -- ~20 places check `!so.scene?.parent`. A boolean set during scene construction would be clearer. Not serialized.

**Mouse delta compensation** -- root symmetric stretch doubles the delta (mouse moves n, edge moves 2n). With reverse prop redirecting start->end, the cursor drifts from the pinned edge. Detect and apply 2x in Drag.ts -- UX concern, not constraint concern.

## Phase 2 Bugs

### Bug 1: Top edge moves opposite to mouse

Dragging z_max on bottom drawer. The DFS takes the invariant path (z_max = z_min + length). Tries z_min first (fails at root), then height (succeeds, sets given). But the given value keeps growing each frame (374, 387, 400...) while z_max_target stays constant at 285.8. The visual effect is the opposite edge moving or no movement. Root cause: interaction between `apply_stretch_absolute`'s per-frame reset to initial bounds and the DFS solving against stale/reset state. The given persists between frames but bounds are reset, creating a mismatch.

### Bug 2: Root doesn't grow when child stretches

Dragging z_min (bottom edge, formula-locked to root). DFS fails at root start (immovable). Length fallback adjusts the given — drawer resizes. But root stays the same size. The child can exceed root bounds. Root expansion needs to happen alongside the given adjustment.

### Bug (resolved): Root Start Redirect

Child edge locked to root start (e.g., `z_min = parent.z_min`). Dragging it down: `reverse_set_bound` recurses to root z_min, tries to set it negative. Root redirect fires: grows root end, shifts children. But `clamp_root` resets root start to 0, and the dragged child's formula re-evaluates to 0 + same offset = original position. Nothing moved.

The problem: the redirect shifts ALL children equally, including the one being dragged. The dragged child ends up back where it started.

Correct behavior for dragging a root-start-locked child downward by delta D:
1. Root end grows by D (root gets bigger)
2. All children EXCEPT the dragged one shift up by D (their offsets increase by D)
3. The dragged child's offset stays the same (it stays at root start = 0)
4. Net effect: root is D taller, dragged child is at the bottom, everything else shifted up

This requires `reverse_set_bound` to know WHICH child triggered the recursion, so it can exclude it from the shift. Or: don't shift in `reverse_set_bound` at all — let `propagate_all` handle it, but make sure children's absolute positions are preserved through a snapshot/restore pattern (like `fit_to_children` does).

## Completed

**Undo/Redo** -- `serialize()` always includes value alongside formula; `rebind_formulas` skips eval during undo; `load_scene` gates propagation on `recompute` flag.

## Implementation Phases

### 1: Invariants as formulas

First attempt replaced `enforce_invariants` in one shot. Failed: system formulas evaluate to absolute values but `attr.value` stores relative; `set_bound`'s length sync skipped when `compiled` was set; evaluation order within an SO was wrong.

Incremental approach:

#### **1a: Infrastructure (no behavior change)** -- DONE

`axis.invariant_node` stores the pre-built AST separately from `attr.compiled` (avoids interfering with the many places that check `compiled`). `axis.apply_invariant_formula(id)` builds it using concrete SO id -- no `bind_refs` needed. Called from Smart_Object constructor, deserialize, and `clone_so_from_template`. `enforce_invariants` untouched, forward prop skips these nodes. `is_system` flag was tried on `attr.compiled` but caused cascading bugs (length sync, get_bound/set_bound offset paths, repeater clones) -- removed in favor of the separate `invariant_node` field.

#### **1b: Shadow mode**

In `propagate_all`, after `enforce_invariants`, also evaluate system formulas via `set_bound` and compare results to what `enforce_invariants` computed. Log mismatches (should be zero). No behavior change -- validates the formulas are correct before relying on them.

#### **1c: Swap**

Remove `enforce_invariants` call sites one at a time, letting system formula evaluation take over. Extract `clamp_root` from `enforce_invariants` as a standalone step (root start=0 is a hard constraint, not an invariant formula). Update `set_bound`'s length sync to check `is_system` instead of `!compiled`. Test after each removal.

#### **1d: Clean up**

Remove `enforce_invariants` method. Remove invariant clearing from `rebind_formulas` (system formulas don't need clearing -- they're rebuilt by `apply_invariant_formula`). Update P_Attributes `set_invariant`. Update tests.

### 2: Reverse propagation in `set_bound`

- Add the root start redirect (the one special case)
- When `set_bound` encounters a formula, trace the reference chain and call `set_bound` recursively on the referenced SO's attribute
- For formulas with a solvable given, delegate to `Evaluator.propagate`

### 3: Dead code removal

- Remove `try_solve_given`, `solve_given_attr`, `freeze_non_givens` from Constraints.ts
- Simplify `stretch` lambda in Drag.ts to just `set_bound` calls
- Remove root-specific stretch logic in Drag.ts

### 4: Tests

- Add the test cases from the doc

## Circular Dependency

When a cycle, self-reference, or unresolvable formula is detected, navigate to the problem and show it inline.

**Self-reference:** A formula that references its own attribute (e.g., `l + 50` on the width attribute expands to `width + 50` — width references itself). Detected in `set_formula` before cycle detection. Message: "this formula references itself". Suggestion: "remove this formula". Previously this was accidentally allowed because alias expansion (`l` → `w`) didn't match the internal name (`width`) in the formula map. Now that aliases expand to internal names, the self-reference is visible.

### **Detection points:**

1. **Formula entry** -- `set_formula` → `detect_cycle`. Caught immediately. User is already looking at the attribute.
2. **File load** -- scan for cycles after `rebind_formulas` + `propagate_all`. Catches legacy files with cycles.
3. **Drag** -- safety net. `reverse_set_bound` visited set catches cycles that slipped through 1 and 2. Drag returns false.

### **How to show it:**

1. Select the offending SO (`hits_3d.set_selection`)
2. Details panel shows that SO's attributes; the offending row gets the error overlay
3. Error message: "the formula `{formula_display}` for `{attr_alias}` of `{so_name}` cannot resolve"
4. Suggestion: "remove this formula" -- clears the formula on that attribute, keeps the current value

The user is now looking at the problem. They can accept the suggestion or manually edit the formula.

For drag-time detection: the drag is interrupted (returns false), the view switches to the offending SO, the error appears on the attribute. The user fixes it before resuming.

**Rule:** never modify an attribute that isn't currently visible. The error always navigates TO the problem first, then offers a fix on what's now on screen.

### **Risk assessment:**

- Low: detection at formula entry (detect_cycle already exists, extend to cover invariant paths), error message format (string template), "remove this formula" suggestion (clear_formula exists)
- Medium: selecting offending SO during drag (interrupts drag state machine — need clean abort before switching selection), file load detection (scan after scene load without slowing startup)
- High: none
