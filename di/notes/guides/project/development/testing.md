# Testing

Unit tests for pure logic. Vitest runner.

## Format

Going forward, every entry in this index points back at the stipulations it pins. Every test in the file's tests array carries a `stipulation:` line at the head of its body, naming the stipulation slug it covers. The slug must match an entry in [stipulations.md](./stipulations.md). Existing entries will be migrated to this shape on demand as work next touches their area.

The shape of an index entry:

```text
- **Name** — one-line description of what the file covers.
    - stipulation: slug-one, slug-two, slug-three
```

The shape of a test inside the file:

```text
test('the rule the test pins', () => {
    // stipulation: so-three-directions
    // ...
});
```

A real example, fully written:

```text
- **Data_Layout** — the structure each SO carries by construction.
    - stipulation: so-three-directions, axis-three-attributes, plain-number-attributes
```

The legacy bullet shape (just the `**Name** — description` line) stays valid until the entry is migrated; it just lacks the stipulation pointer.

## Current tests

Each line names what the file in `src/lib/ts/tests/` covers.

- **Angle** — angle normalization, conversion, comparison.
- **Camera** — clicking the screen becomes a ray into the world; projecting a known world point and clicking that spot gives a ray that passes back through it; the two viewing modes (3D and 2D) project a known point at non-zero depth to noticeably different screen spots; the saved camera does not record which mode was on.
    - stipulation: camera-projects-world-to-screen, camera-unprojects-screen-to-ray, camera-two-viewing-modes
- **Center** — the bare letter `c` in a formula resolves to start-plus-end-over-two on the host direction; axis-qualified forms read other directions; center is read-only end to end (all three write paths refuse — the upstream walker, the resolver-level write, and the free-constant write); a refused write posts "cannot drag a center" to the status strip; a formula on a start, end, or length cell that references the same-direction same-SO center is rejected at the moment it is typed; the formula text saved with the bare letter survives a re-compile and a translation round trip; a multi-line debug summary on each SO includes the center alongside the start, end, and length of every direction.
    - stipulation: center-letter-formula-conventions
- **Colors** — color parsing, blending, conversion between RGB and HSL.
- **Compiler** — the formula tokenizer and compiler that turn typed text into an evaluable tree.
    - stipulation: formula-text-tokenized, formula-tokens-built-to-tree
- **Constraints** — the constraints manager: formula binding, evaluation, cycle detection, propagation across objects, formula-clears-lock, and the bare-name resolver walking up the parent chain.
    - stipulation: formula-recomputes-during-propagation, propagation-triggered-by-change, unrelated-SO-untouched-by-change, formula-cycle-refused, formula-clears-lock, bare-name-resolver-walks-parent-chain
- **Cut** — the cut routine that splits the selected smart object in half along its longest direction: longest-direction selection by stored length value, equal halves on the cut direction, the new sibling becomes selected with a numeric-suffix name, the five refusal cases (root, clone, template, has-children-not-repeater, tied-longest), the repeater exception (a cut on a repeater produces two repeaters each with its own template), formula behavior per invariant case, and formulas on the two non-cut directions copied unchanged. Includes assertions on the can-cut flag the details panel uses to show or hide the cut button.
    - stipulation: cut-so-in-half
- **Coordinates** — point, size, and rectangle math; coordinate transformations.
- **Data_Layout** — the structure each SO carries by construction: three directions, three numbers per direction, a single parent slot, plain-number cells, exactly one recomputed marker per direction, visibility flags, and the eight-corner / twelve-edge / six-face shape.
    - stipulation: so-three-directions, axis-three-attributes, plain-number-attributes, axis-has-one-invariant, block-has-at-most-one-parent, block-visibility-flags, so-shaped-as-eight-corner-box
- **Drag_math** — pure math helpers used by drag (ray-plane intersection, decomposing a screen delta onto two face edges).
    - stipulation: face-drag-confined-to-plane, face-drag-ray-becomes-plane-hit, face-drag-decomposed-to-two-edges
- **Engine_Behaviors** — engine-level rules that run end-to-end through the running app: deleting an SO removes its subtree and clears every formula that pointed at any deleted SO; changing the precision setting snaps every plain-number cell while leaving formula-driven cells alone.
    - stipulation: delete-clears-formulas-and-subtree, precision-change-snaps-value-fields
- **Errors** — the formula-error classifier and the suggestion list it surfaces in the panel; an error reported on a cell stays there until explicitly cleared.
    - stipulation: error-stays-until-cleared
- **Evaluator** — the evaluator that walks a compiled tree to a number, and the reverse-propagation path that finds and writes a free constant during drag.
    - stipulation: formula-computes-value-field, formula-tree-evaluates-forward, formula-tree-propagates-backward, reverse-propagation-single-or-refused
- **Extensions** — small utility extensions on numbers and arrays.
- **Givens** — named values defined outside any SO that formulas can reference; locked named values are protected from reverse-propagation writes.
    - stipulation: named-attributes-referenced-by-formulas
- **Hierarchy** — what happens to a child when its parent is moved or resized.
    - stipulation: parent-move-keeps-child-stored-unchanged
- **History** — the snapshot-and-restore stack behind undo and redo, with a stubbed scene manager.
    - stipulation: undo-restores-prior-state, redo-restores-undone-state
- **Hits_3D** — pure 3D hit-testing geometry: point in polygon, segment proximity, front-facing detection.
- **Invariants_and_Locks** — behavior around stored values, the invariant rule, the lock, and the load-time recompute. Each test names a single behavior; together they cover the bug shapes seen in recent sessions.
    - stipulation: locked-number-fields, invariant-write-reverse-propagates, locked-attribute-protected-from-propagation
    - **Test 1 — storage round-trip.** Set a value to a cell on a child. Read the cell. Assert: same value back.
    - **Test 2 — invariant rule, marker on the near end.** Set far = 7, length = 4, near = 999 (deliberately wrong). Run the invariant pass on the child. Assert: near is now 3.
    - **Test 3 — invariant rule, marker on the far end.** near = 3, length = 4, far = 999. Run the pass. Assert: far is now 7.
    - **Test 4 — invariant rule, marker on the length.** near = 3, far = 7, length = 999. Run the pass. Assert: length is now 4.
    - **Test 5 — locked length is protected.** Child has length locked at 6. Write a different value to its far end. Assert: length is still 6.
    - **Test 6 — reverse propagation refuses a locked target.** Lock a cell on a child. Trigger the reverse-propagation path that would otherwise write to it. Assert: its value did not change.
    - **Test 7 — writing the length does not stomp on other cells.** Child's invariant marker on the near end. far = 17, length = 5. Type 8 into the length cell. Run the invariant pass. Assert: far is still 17, length is 8, near is now 9.
    - **Test 8 — writing the length when the far end carries a formula.** Same as test 7 but the child's far end carries a formula tracking the parent's far end. Set the parent's far end to 17. Type 8 into the length cell. Run the pass. Assert: far is 17 (matching the parent), length is 8, near is 9.
    - **Test 9 — invariant cell is recomputed on load.** Build a saved scene where the invariant cell on a child carries a wrong stored value. Run the load-time pass. Assert: after load, the invariant cell's value matches the rule, not the wrong saved value.
- **Preferences** — values written to browser storage round-trip on read, removed values come back as missing, and different keys do not collide.
    - stipulation: preferences-persist-via-browser-storage
- **Repeaters** — behavior of linear repeaters: clones share the template, step along the run axis, follow formulas at depth, sync is idempotent, and fireblocks fill the gaps.
    - stipulation: axis-bounds-parent-relative, repeater-first-child-is-template, repeater-clone-steps-along-run, fireblocks-fill-gaps, repeater-spacing-independent-from-master, firewall-cross-direction-matches-master
    - **Test 10 — clones have the right width.** A wall sits inside the root and is marked as a linear repeater along its x-axis. A stud template sits inside the wall with width 2. Trigger the repeater sync. Assert: each clone of the stud template has width stored value 2.
    - **Test 11 — clones step along the run axis.** Same setup as test 10, with step size 2 (the stud width and no gap). Trigger the sync. Assert: the second stud's near-x stored value is 2 greater than the first stud's, the third's is 4 greater than the first's, and so on.
    - **Test 12 — clone's z-end follows the formula at depth.** The wall is a child of a child of the root, so the stud template lives two levels below the root. The stud template's z-end carries the formula that says "follow my parent's z-end". Trigger the repeater sync. Assert: each clone's z-end stored value equals the template's z-end stored value.
    - **Test 13 — re-running the sync does not change the template.** Wall with stud template configured as a linear repeater. Record the template's stored values for every direction. Run the repeater sync several times in a row. Assert: the template's stored values are exactly what they were at the start.
    - **Test 14 — fireblocks have the right size and position.** Wall is a child of the root, marked as a linear repeater with the firewall option on, run-axis is x, spacing is 4. The stud template inside the wall has width 1. The wall has width 12 along the run-axis. Trigger the repeater sync. The repeat produces studs at x = 0, 4, 8, plus a bookend stud at x = 11. The bays between the studs are filled by fireblocks. Two assertions in this one test: (a) the first fireblock — the one in the bay right after the first stud — has width 3 (the bay length, equal to spacing minus the stud width) and starts at x = 1 (right after the first stud's right edge); (b) the fractional extra filler — the fireblock in the leftover bay between the third stud and the bookend stud — has width 2 (the leftover bay length) and starts at x = 9 (right after the third stud's right edge).
- **Root** — conventions about the topmost SO: it has nothing above it, its recomputed cell on each direction is the far end, its length can be locked, and its near ends stay at zero through normal scene operations.
    - stipulation: root-has-no-parent, root-end-is-invariant, root-start-is-zero, root-length-can-be-locked
- **Rotation** — each direction on an SO carries an angle; the overall rotation is the composition of the three angles in a recorded order; the order matters.
    - stipulation: rotation-composition-order-matters
- **Save_Load** — capturing a small world, replaying it the same way the running app does, and confirming the stored numbers, parent links, locked lengths, and camera all come back identical (including a trip through a string and back); a repeater's duplicates are excluded from the saved snapshot.
    - stipulation: save-load-round-trip, repeater-clones-not-saved, so-id-stable-across-save-load
- **Snap** — drag results round to the current precision grid before they are stored.
    - stipulation: drag-snaps-to-precision-grid
- **Testworthy_Utilities** — generic helpers worth pinning.
- **Topology** — pure geometry helpers extracted from the topology pipeline.
- **Units** — unit parsing across millimeters, inches, feet, and compound forms; rounding for each system; internal storage is always in millimeters regardless of input unit.
    - stipulation: units-stored-in-millimeters
- **Versions** — the saved-scene migration that converts older save formats forward to the current one.

### Browser-driven tests

Live in `e2e/tests/*.spec.ts`. Each pins a user-interface flow that needs real mouse events and a real animation loop.

- **editing_lock** — the editing-lock toggle blocks canvas clicks while on; toggling off lets a click pick a part.
    - stipulation: editing-lock-blocks-canvas-clicks
- **view_mode_switch** — toggling from the three-dimensional view to the flat view and back restores the prior orientation.
    - stipulation: view-mode-switch-saves-and-restores-orientation
- **rotation_snap** — a tumble drag with rotation-snap on lands on a face-aligned orientation; turning snap off restores the prior orientation.
    - stipulation: rotation-snap-aligns-to-face
- **drag_vs_tumble** — a drag on empty canvas tumbles the camera; a drag with a selection edits the selection.
    - stipulation: drag-edits-selection-or-tumbles-camera

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

## Browser-driven tests (planned)

The unit-test runner has no real browser, no canvas, and no event loop. Three rules in the catalog describe user-interface flows the unit runner cannot exercise: the editing-lock toggle that blocks clicks on the canvas, the camera animation that fires when the rotation-snap toggle changes or when the user switches between the three-dimensional and the flat views, and the drag-versus-tumble decision that depends on whether anything is currently selected. The plan below pins those down with a browser-driven runner.

### Plan-of-record

The runner is Playwright. It opens a real browser, drives real mouse and keyboard events, and asserts on what the running app actually does.

#### Folder layout

```text
di/
├── e2e/
│   ├── tests/
│   │   ├── editing-lock.spec.ts
│   │   ├── view-mode-switch.spec.ts
│   │   ├── rotation-snap.spec.ts
│   │   └── drag-vs-tumble.spec.ts
│   ├── fixtures/
│   │   └── known-scene.json     (a tiny scene the tests start from)
│   └── playwright.config.ts     (browser, dev-server, baseline path)
└── src/...
```

The browser-test tree sits beside the source tree, separate from the unit tests, so the two runners do not collide.

#### The four tests

1. **Editing-lock blocks clicks.** Open the running app, turn the lock on through the toolbar, click somewhere on the canvas, assert that no selection exists and the cursor stayed as the open-grab-hand. Turn the lock off, click the same spot, assert that a selection appears.
2. **View-mode switch saves and restores the angle.** Rotate the world to a known angle in three-dimensional mode. Switch to two-dimensional mode and assert the camera lands flat on the front face. Switch back and assert the angle returns to the one before the switch.
3. **Rotation-snap animation lands on a face.** With the rotation-snap toggle on, drag the canvas to a slightly off-axis angle and release. Wait for the animation to settle, then assert the final angle is one of the six face-aligned ones. Repeat with the toggle off and assert the angle stays where the user left it.
4. **Drag with versus without a selection.** Without a selection, drag the canvas, assert the world rotated and no SO moved. Click an SO to select it, drag the canvas, assert the SO's stored numbers changed and the camera angle did not.

#### Read hooks the tests need

The running app does not currently publish its internal state to the page. The four tests need a small, read-only hook on the page that turns on when a query parameter is present in the URL — off by default, on only when the test starts the app. The hook publishes:

- The current camera angle (the same four-number list the saved scene already carries).
- The current selection (the SO's identifier and the face index, or empty).
- The current view mode (the string two-dimensional or three-dimensional).
- The current state of the editing-lock toggle (on or off).
- A signal that goes from "animating" to "settled" so the rotation-snap test can wait without racing the animation.

Writing to the toggles uses the existing on-screen buttons. We do not need a write hook.

#### Wiring to the development server

The browser-test config tells the runner to start the development server (`yarn dev`) at the start of the run, wait for a healthy response on the development port, run the four tests, then stop the server. One browser is enough — Chromium covers the four flows. Three browsers would slow the run threefold without buying much for an internal tool.

#### Install (one-time, on each developer's machine)

```bash
yarn add -D @playwright/test
npx playwright install chromium
```

The browser binary fetched by the second command is cached in the developer's home folder; later runs reuse it.

#### Daily usage

```bash
yarn e2e
```

Runs the four browser-driven tests against the development server. The unit tests stay on `yarn test` and remain the fast feedback loop.

#### Continuous-integration step

The browser tests run on every commit. A new continuous-integration step starts the development server, runs the four tests, and fails the build if any of them fails. Total runtime — I AM GUESSING — twenty to forty seconds for all four, dominated by the development server starting up. The browser binary is cached between runs to avoid re-downloading on every build.

### Risks and trade-offs

- **Slower than unit tests.** Five hundred ninety-five unit tests run in three to four seconds today. Four browser tests will take roughly an order of magnitude longer per test. Total continuous-integration time goes up by less than a minute.
- **Animation-timing flake.** A test that moves on before the animation has settled becomes intermittently red. The "settled" signal in the read hooks is the safeguard. If a test still flakes, lengthening the wait is the easy lever.
- **The read hooks are a small test-only API.** Keeping them small and read-only — no write paths from tests, no shape that callers in production rely on — keeps the maintenance cost low.

### Stipulation coverage after browser tests land

The catalog summary will move from "fifty-four of fifty-seven directly covered" to "all fifty-seven directly covered." The four UI rules will list `e2e/tests/...` as their coverage source instead of the current "not unit-tested" note.

---

## Stipulation coverage

Each rule in [`stipulations.md`](stipulations.md) is annotated in place with the test file that pins it down. As of the most recent pass, fifty-eight of sixty-two rules are directly covered. (!) Fifty-four are pinned by unit tests in `src/lib/ts/tests/`; four — the user-interface flows that need real mouse events and the running animation loop — are pinned by browser-driven tests in [`e2e/tests/`](../../e2e/tests/). The browser tests run via `yarn e2e`. The remaining four (the drawing silhouette and the three printing rules) are not yet test-backed.

(!) ALWAYS: Always update this authoritative count each time testing is done.
