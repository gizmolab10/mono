# Testing

Unit tests for pure logic. Vitest runner.

## Current tests

Each line names what the file in `src/lib/ts/tests/` covers.

- **Angle** — angle normalization, conversion, comparison.
- **Camera** — clicking the screen becomes a ray into the world, and projecting a known world point and clicking that spot gives a ray that passes back through it.
- **Colors** — color parsing, blending, conversion between RGB and HSL.
- **Compiler** — the formula tokenizer and compiler that turn typed text into an evaluable tree.
- **Constraints** — the constraints manager: formula binding, evaluation, cycle detection, propagation across objects.
- **Coordinates** — point, size, and rectangle math; coordinate transformations.
- **Data_Layout** — the structure each block carries by construction: three directions, three numbers per direction, a single parent slot.
- **Drag_math** — pure math helpers used by drag (ray-plane intersection, decomposing a screen delta onto two face edges).
- **Errors** — the formula-error classifier and the suggestion list it surfaces in the panel.
- **Evaluator** — the evaluator that walks a compiled tree to a number, and the reverse-propagation path that finds and writes a free constant during drag.
- **Extensions** — small utility extensions on numbers and arrays.
- **Hierarchy** — what happens to a child when its parent is moved or resized.
- **History** — the snapshot-and-restore stack behind undo and redo, with a stubbed scene manager.
- **Hits_3D** — pure 3D hit-testing geometry: point in polygon, segment proximity, front-facing detection.
- **Invariants_and_Locks** — behavior around stored values, the invariant rule, the lock, and the load-time recompute. Each test names a single behavior; together they cover the bug shapes seen in recent sessions.
    - **Test 1 — storage round-trip.** Set a value to a cell on a child. Read the cell. Assert: same value back.
    - **Test 2 — invariant rule, marker on the near end.** Set far = 7, length = 4, near = 999 (deliberately wrong). Run the invariant pass on the child. Assert: near is now 3.
    - **Test 3 — invariant rule, marker on the far end.** near = 3, length = 4, far = 999. Run the pass. Assert: far is now 7.
    - **Test 4 — invariant rule, marker on the length.** near = 3, far = 7, length = 999. Run the pass. Assert: length is now 4.
    - **Test 5 — locked length is protected.** Child has length locked at 6. Write a different value to its far end. Assert: length is still 6.
    - **Test 6 — reverse propagation refuses a locked target.** Lock a cell on a child. Trigger the reverse-propagation path that would otherwise write to it. Assert: its value did not change.
    - **Test 7 — writing the length does not stomp on other cells.** Child's invariant marker on the near end. far = 17, length = 5. Type 8 into the length cell. Run the invariant pass. Assert: far is still 17, length is 8, near is now 9.
    - **Test 8 — writing the length when the far end carries a formula.** Same as test 7 but the child's far end carries a formula tracking the parent's far end. Set the parent's far end to 17. Type 8 into the length cell. Run the pass. Assert: far is 17 (matching the parent), length is 8, near is 9.
    - **Test 9 — invariant cell is recomputed on load.** Build a saved scene where the invariant cell on a child carries a wrong stored value. Run the load-time pass. Assert: after load, the invariant cell's value matches the rule, not the wrong saved value.
- **Repeaters** — behavior of linear repeaters: clones share the template, step along the run axis, follow formulas at depth, sync is idempotent, and fireblocks fill the gaps.
    - **Test 10 — clones have the right width.** A wall sits inside the root and is marked as a linear repeater along its x-axis. A stud template sits inside the wall with width 2. Trigger the repeater sync. Assert: each clone of the stud template has width stored value 2.
    - **Test 11 — clones step along the run axis.** Same setup as test 10, with step size 2 (the stud width and no gap). Trigger the sync. Assert: the second stud's near-x stored value is 2 greater than the first stud's, the third's is 4 greater than the first's, and so on.
    - **Test 12 — clone's z-end follows the formula at depth.** The wall is a child of a child of the root, so the stud template lives two levels below the root. The stud template's z-end carries the formula that says "follow my parent's z-end". Trigger the repeater sync. Assert: each clone's z-end stored value equals the template's z-end stored value.
    - **Test 13 — re-running the sync does not change the template.** Wall with stud template configured as a linear repeater. Record the template's stored values for every direction. Run the repeater sync several times in a row. Assert: the template's stored values are exactly what they were at the start.
    - **Test 14 — fireblocks have the right size and position.** Wall is a child of the root, marked as a linear repeater with the firewall option on, run-axis is x, spacing is 4. The stud template inside the wall has width 1. The wall has width 12 along the run-axis. Trigger the repeater sync. The repeat produces studs at x = 0, 4, 8, plus a bookend stud at x = 11. The bays between the studs are filled by fireblocks. Two assertions in this one test: (a) the first fireblock — the one in the bay right after the first stud — has width 3 (the bay length, equal to spacing minus the stud width) and starts at x = 1 (right after the first stud's right edge); (b) the fractional extra filler — the fireblock in the leftover bay between the third stud and the bookend stud — has width 2 (the leftover bay length) and starts at x = 9 (right after the third stud's right edge).
- **Root** — conventions about the topmost block: it has nothing above it, its recomputed cell on each direction is the far end, its length can be locked, and its near ends stay at zero through normal scene operations.
- **Save_Load** — capturing a small world, replaying it the same way the running app does, and confirming the stored numbers, parent links, locked lengths, and camera all come back identical (including a trip through a string and back).
- **Testworthy_Utilities** — generic helpers worth pinning.
- **Topology** — pure geometry helpers extracted from the topology pipeline.
- **Units** — unit parsing across millimeters, inches, feet, and compound forms; rounding for each system.
- **Versions** — the saved-scene migration that converts older save formats forward to the current one.

---
## Methodology

### Location

`src/lib/ts/tests/*.test.ts`

### Run

```bash
yarn test              # all tests
yarn test --run        # single run (no watch)
yarn test --run src/lib/ts/tests/hits_3d.test.ts  # single file
```

### Style

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

### When adding a new test

1. Create `<name>.test.ts` in `src/lib/ts/tests/`.
2. Import from source: `import { Thing } from '../types/Thing'`.
3. If a method needs to be tested, make it public. Do not copy the function into the test file.

## Visual testing (future)

Vitest runs in Node — no browser, no canvas. For visual regression testing, add Playwright:

```bash
yarn add -D @playwright/test
npx playwright install
```

Workflow: captures screenshots, diffs against baseline images in repo. Update baselines with `--update-snapshots`.

---

## Stipulation coverage

Each rule in [`stipulations.md`](stipulations.md) is now annotated in place with the test file that pins it down. The remaining untested rules are either user-interface behavior or thin structural assertions whose violation would be caught by ordinary use; no high-priority items remain.

