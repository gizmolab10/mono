# Testing

Unit tests for pure logic. Vitest runner.

## Location

`src/lib/ts/tests/*.test.ts`

## Run

```bash
yarn test              # all tests
yarn test --run        # single run (no watch)
yarn test --run src/lib/ts/tests/hits_3d.test.ts  # single file
```

## Current tests

Each line names what the file in `src/lib/ts/tests/` covers.

- **Angle** — angle normalization, conversion, comparison.
- **Colors** — color parsing, blending, conversion between RGB and HSL.
- **Compiler** — the formula tokenizer and compiler that turn typed text into an evaluable tree.
- **Constraints** — the constraints manager: formula binding, evaluation, cycle detection, propagation across objects.
- **Coordinates** — point, size, and rectangle math; coordinate transformations.
- **Drag_math** — pure math helpers used by drag (ray-plane intersection, decomposing a screen delta onto two face edges).
- **Errors** — the formula-error classifier and the suggestion list it surfaces in the panel.
- **Evaluator** — the evaluator that walks a compiled tree to a number, and the reverse-propagation path that finds and writes a free constant during drag.
- **Extensions** — small utility extensions on numbers and arrays.
- **History** — the snapshot-and-restore stack behind undo and redo, with a stubbed scene manager.
- **Hits_3D** — pure 3D hit-testing geometry: point in polygon, segment proximity, front-facing detection.
- **Testworthy_Utilities** — generic helpers worth pinning.
- **Topology** — pure geometry helpers extracted from the topology pipeline.
- **Units** — unit parsing across millimeters, inches, feet, and compound forms; rounding for each system.
- **Versions** — the saved-scene migration that converts older save formats forward to the current one.

## Style

```typescript
import { describe, it, expect } from 'vitest';

describe('function_name', () => {
  it('does specific thing', () => {
    expect(result).toBe(expected);
  });
});
```

- One `describe` per function or concept.
- Test names describe behavior, not implementation.
- Use `toBeCloseTo` for floating point.
- Inline helper functions for test data (e.g., `proj(x, y, z, w)`).

## Adding tests

1. Create `<name>.test.ts` in `src/lib/ts/tests/`.
2. Import from source: `import { Thing } from '../types/Thing'`.
3. If a method needs to be tested, make it public. Do not copy the function into the test file.

---

## Proposed tests — not yet written

These pin down behavior around stored values, the invariant rule, the lock, and the load-time recompute. Each test names a single behavior. They cover the bug shapes seen in recent sessions.

### Storage round-trip

**Test 1.** Set a value to a cell on a child. Read the cell. Assert: same value back.

### Invariant rule on this object's own three cells

**Test 2.** Child has its invariant marker on its x-axis pointing at x. Set X = 7, w = 4, x = 999 (deliberately wrong). Run the invariant pass on the child. Assert: x is now 3.

**Test 3.** Same shape, marker on X. x = 3, w = 4, X = 999. Run the pass. Assert: X is now 7.

**Test 4.** Same shape, marker on w. x = 3, X = 7, w = 999. Run the pass. Assert: w is now 4.

### Locked w is protected

**Test 5.** Child has w locked at 6. Write a different value to its X. Assert: w is still 6.

### Reverse propagation refuses a locked target

**Test 6.** Lock an attribute on a child. Trigger the reverse-propagation path that would otherwise write to it. Assert: its value did not change.

### w write does not stomp on other cells

**Test 7.** Child's invariant marker on x. X = 17. w = 5. Type 8 into the w cell. Run the invariant pass. Assert: X is still 17, w is 8, x is now 9.

### w write with a formula on X

**Test 8.** Same as test 7 but child's X carries the formula `.e`. Set the parent's X to a known value (say 17). Type 8 into the w cell. Run the invariant pass. Assert: X is 17 (matching the parent), w is 8, x is 9.

### Invariant cell is recomputed on load

**Test 9.** Build a saved scene where the invariant cell on a child carries a wrong stored value. Run the load-time pass. Assert: after load, the invariant cell's value matches the rule, not the wrong saved value.

### Linear repeater — clones have the right width

**Test 10.** A wall sits inside the root and is marked as a linear repeater along its x-axis. A stud template sits inside the wall with width 2. Trigger the repeater sync. Assert: each clone of the stud template has width stored value 2.

### Linear repeater — clones step along the run axis

**Test 11.** Same setup as test 10, with step size 2 (the stud width and no gap). Trigger the sync. Assert: the second stud's x stored value is 2 greater than the first stud's x stored value, the third's is 4 greater than the first's, and so on.

### Linear repeater at depth — clone's z-end follows the formula

**Test 12.** The wall is a child of a child of the root, so the stud template lives two levels below the root. The stud template's z-end carries the formula that says "follow my parent's z-end". Trigger the repeater sync. Assert: each clone's z-end stored value equals the template's z-end stored value.

### Linear repeater — re-running the sync does not change the template

**Test 13.** Wall with stud template configured as a linear repeater. Record the template's stored values for x, X, w, y, Y, d, z, Z, h. Run the repeater sync several times in a row. Assert: the template's stored values are exactly what they were at the start.

### Linear repeater fireblocks — size and position

**Test 14.** Wall is a child of the root, marked as a linear repeater with the firewall option on, run-axis is x, spacing is 4. The stud template inside the wall has width 1. The wall has width 12 along the run-axis. Trigger the repeater sync. The repeat produces studs at x = 0, 4, 8, plus a bookend stud at x = 11. The bays between the studs are filled by fireblocks. Two assertions in this one test:

(a) The first fireblock — the one in the bay right after the first stud — has width 3 (the bay length, equal to spacing minus the stud width) and starts at x = 1 (right after the first stud's right edge).

(b) The fractional extra filler — the fireblock in the leftover bay between the third stud and the bookend stud — has width 2 (the leftover bay length) and starts at x = 9 (right after the third stud's right edge).

## Visual testing (future)

Vitest runs in Node — no browser, no canvas. For visual regression testing, add Playwright:

```bash
yarn add -D @playwright/test
npx playwright install
```

Workflow: captures screenshots, diffs against baseline images in repo. Update baselines with `--update-snapshots`.
