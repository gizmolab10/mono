# Stipulations

The load-bearing rules the app is built on. Without these written down, work drifts. Anything new should be checked against this list. All entries are guesses pending review.

**Coverage summary:** all fifty-eight rules are now directly covered. Fifty-four are pinned by unit tests; the remaining four — user-interface flows that need real mouse events and a real animation loop — are pinned by browser-driven tests under [`e2e/tests/`](../../e2e/tests/). Coverage judgments are guesses pending review.

ALWAYS: Always update the authoritative count testing is done.

## Format

Every stipulation carries three lines beneath the prose: a stable id (a short kebab-case slug), a `test:` pointer to the test that pins it, and a `code:` pointer to the source file and lines that prove it. The slug is what the test index references back.

The shape:

```text
N. Plain English statement of the rule.
    - id: short-slug-name
    - test: [Test_File.test.ts](../../../src/lib/ts/tests/Test_File.test.ts) test 1
    - code: [src/lib/ts/path/to/source.ts:42-57](../../../src/lib/ts/path/to/source.ts)
```

A real example, fully written:

```text
99. The world is made of blocks called smart objects (SO). Every SO has three directions {x, y, z}.
    - id: so-three-directions
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "an SO has exactly three directions"
    - code: [src/lib/ts/runtime/Smart_Object.ts:9-14](../../../src/lib/ts/runtime/Smart_Object.ts)
```

## Blocks

1. The world is made of blocks called smart objects (SO). Every SO has three dimensions / axes {x, y, z}
    - id: so-three-directions
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "a fresh block has exactly three directions"
    - code: [src/lib/ts/runtime/Smart_Object.ts:9](../../../src/lib/ts/runtime/Smart_Object.ts)
2. Each axis has three attributes: start, length and end
    - id: axis-three-attributes
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "every direction has a near end, a far end, and a length"
    - code: [src/lib/ts/runtime/Axis.ts:14-17](../../../src/lib/ts/runtime/Axis.ts)
3. Two of these (start and end) are defined to be relative to parent's start (except root)
    - id: axis-bounds-parent-relative
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 12: clones reproduce the template z-end stored value"
    - code: [src/lib/ts/runtime/Smart_Object.ts:71-95](../../../src/lib/ts/runtime/Smart_Object.ts)

## Each attribute has several flavors

4. plain number
    - id: plain-number-cells
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "writing a plain number to a cell stores that number unchanged"
    - code: [src/lib/ts/types/Attribute.ts:9](../../../src/lib/ts/types/Attribute.ts)
5. locked number
    - id: locked-number-cells
    - test: [Invariants_and_Locks.test.ts](../../../src/lib/ts/tests/Invariants_and_Locks.test.ts) "test 5: writing to X does not overwrite a locked w"
    - code: [src/lib/ts/types/Attribute.ts:8](../../../src/lib/ts/types/Attribute.ts)
6. a formula computes the number
    - id: formula-computes-cell-value
    - test: [Evaluator.test.ts](../../../src/lib/ts/tests/Evaluator.test.ts) "evaluates a literal"
    - code: [src/lib/ts/types/Attribute.ts:6-7](../../../src/lib/ts/types/Attribute.ts)

## Invariants

7. Always and only one of them is called invariant. It uses a built-in formula
    - id: axis-has-one-invariant
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "the recomputed marker on every direction is a single index pointing at one of the three cells"
    - code: [src/lib/ts/runtime/Axis.ts:9](../../../src/lib/ts/runtime/Axis.ts)
8. If the value of an invariant is directly altered (set) by the user, this causes reverse propagation such that computing the formula results in the new value
    - id: invariant-write-reverse-propagates
    - test: [Invariants_and_Locks.test.ts](../../../src/lib/ts/tests/Invariants_and_Locks.test.ts) "test 2: invariant on x writes x = X minus w"
    - code: [src/lib/ts/algebra/Constraints.ts:670-693](../../../src/lib/ts/algebra/Constraints.ts)

## Root

9. has no parent
    - id: root-has-no-parent
    - test: [Root.test.ts](../../../src/lib/ts/tests/Root.test.ts) "a freshly built topmost block has no parent wired in"
    - code: [src/lib/ts/runtime/Smart_Object.ts:75](../../../src/lib/ts/runtime/Smart_Object.ts)
10. end is always invariant
    - id: root-end-is-invariant
    - test: [Root.test.ts](../../../src/lib/ts/tests/Root.test.ts) "on a fresh block, the recomputed marker on every direction points at the far end"
    - code: [src/lib/ts/runtime/Axis.ts:9](../../../src/lib/ts/runtime/Axis.ts)
11. start is always zero
    - id: root-start-is-zero
    - test: [Root.test.ts](../../../src/lib/ts/tests/Root.test.ts) "after building children, moving children, and running propagation, the near ends are still zero"
    - code: [src/lib/ts/types/Attribute.ts:12](../../../src/lib/ts/types/Attribute.ts)
12. length can be locked
    - id: root-length-can-be-locked
    - test: [Root.test.ts](../../../src/lib/ts/tests/Root.test.ts) "once length is locked, writing to the far end leaves the length unchanged"
    - code: [src/lib/ts/types/Attribute.ts:8](../../../src/lib/ts/types/Attribute.ts)

## Locked attribute

13. The value of a locked attribute must not be altered by propagation
    - id: locked-attribute-protected-from-propagation
    - test: [Invariants_and_Locks.test.ts](../../../src/lib/ts/tests/Invariants_and_Locks.test.ts) "test 6: write_free_constant skips when the target attribute is locked"
    - code: [src/lib/ts/algebra/Constraints.ts:968-981](../../../src/lib/ts/algebra/Constraints.ts)

## Formulas

14. A formula attribute dynamically recomputes the value during propagation
    - id: formula-recomputes-during-propagation
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "changing wall updates door via formula"
    - code: [src/lib/ts/algebra/Constraints.ts:620-630](../../../src/lib/ts/algebra/Constraints.ts)
15. Propagation is initially triggered by some change, somewhere within the scope of its formula
    - id: propagation-triggered-by-change
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "propagation cascades through chain"
    - code: [src/lib/ts/algebra/Constraints.ts:604-638](../../../src/lib/ts/algebra/Constraints.ts)

## Children

16. A block sits inside at most one other block. Inside means its position numbers are written in its parent's frame.
    - id: block-has-at-most-one-parent
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "the parent slot holds a single reference, so wiring a new parent replaces the old"
    - code: [src/lib/ts/types/Interfaces.ts:80](../../../src/lib/ts/types/Interfaces.ts)
17. Moving a parent moves all of its children. Resizing a parent does not change a child's stored numbers.
    - id: parent-move-keeps-child-stored-unchanged
    - test: [Hierarchy.test.ts](../../../src/lib/ts/tests/Hierarchy.test.ts) "shifts a child in space without changing the child's stored numbers"
    - code: [src/lib/ts/runtime/Smart_Object.ts:71-95](../../../src/lib/ts/runtime/Smart_Object.ts)

## Repeaters

18. A block can be marked as repeating along an axis called run. Its first child becomes the master copy. The rest are duplicates of that master.
    - id: repeater-first-child-is-template
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 10: clones have the right width"
    - code: [src/lib/ts/render/Engine.ts:1349-1357](../../../src/lib/ts/render/Engine.ts)
19. Each duplicate has a copy the master's stored numbers. run axis' start attribute is incremented using the run length
    - id: repeater-clone-steps-along-run
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 11: clones step along the run axis"
    - code: [src/lib/ts/render/Engine.ts:1500-1511](../../../src/lib/ts/render/Engine.ts)

## Fire blocks

20. A repeater block can also be told to fill the gaps between duplicates. Each filler is shaped to fit its gap and centered along the z axis.
    - id: fireblocks-fill-gaps
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 14: regular and bookend fireblocks have the right size and position"
    - code: [src/lib/ts/render/Engine.ts:1534-1557](../../../src/lib/ts/render/Engine.ts)

## Formula trees

21. The text of a formula is first broken into pieces — numbers, names, operators.
    - id: formula-text-tokenized
    - test: [Compiler.test.ts](../../../src/lib/ts/tests/Compiler.test.ts) "tokenizes bare numbers"
    - code: [src/lib/ts/algebra/Tokenizer.ts:33](../../../src/lib/ts/algebra/Tokenizer.ts)
22. The pieces are assembled into a small tree.
    - id: formula-tokens-built-to-tree
    - test: [Compiler.test.ts](../../../src/lib/ts/tests/Compiler.test.ts) "compiles a bare number"
    - code: [src/lib/ts/algebra/Compiler.ts:19](../../../src/lib/ts/algebra/Compiler.ts)
23. Walking the tree computes the number from the formula.
    - id: formula-tree-evaluates-forward
    - test: [Evaluator.test.ts](../../../src/lib/ts/tests/Evaluator.test.ts) "evaluates a literal"
    - code: [src/lib/ts/algebra/Evaluator.ts:28](../../../src/lib/ts/algebra/Evaluator.ts)
24. The same tree can be walked backwards: starting from a target number T, the system finds the one editable number E inside the tree whose value can be changed so as to make the formula compute T, and writes it to E.
    - id: formula-tree-propagates-backward
    - test: [Evaluator.test.ts](../../../src/lib/ts/tests/Evaluator.test.ts) "propagates through subtraction: a = b - 6\" → change a, update b"
    - code: [src/lib/ts/algebra/Evaluator.ts:57](../../../src/lib/ts/algebra/Evaluator.ts)

## Camera and projection

25. The world is shown through one camera. The camera defines how every point in the world corresponds to a spot on the screen.
    - id: camera-projects-world-to-screen
    - test: [Camera.test.ts](../../../src/lib/ts/tests/Camera.test.ts) "a ray cast from the screen spot of a known world point passes through that point"
    - code: [src/lib/ts/render/Render.ts:838](../../../src/lib/ts/render/Render.ts)
26. The same definition runs the other way: any spot on the screen becomes a ray that starts at the camera and points into the world. Thus a given mouse location corresponds to a ray piercing straight into the scene. Whatever objects are encountered along that ray are identified in the hits 3D manager
    - id: camera-unprojects-screen-to-ray
    - test: [Camera.test.ts](../../../src/lib/ts/tests/Camera.test.ts) "clicking the center of the screen gives a ray pointing straight at the camera target"
    - code: [src/lib/ts/render/Camera.ts:53](../../../src/lib/ts/render/Camera.ts)

## Dragging

27. A drag of a face of an SO is confined to that face's flat plane.
    - id: face-drag-confined-to-plane
    - test: [Drag_math.test.ts](../../../src/lib/ts/tests/Drag_math.test.ts) "ray straight down onto a horizontal floor hits directly below"
    - code: [src/lib/ts/editors/Drag.ts:18-29](../../../src/lib/ts/editors/Drag.ts)
28. The drag's screen motion becomes a ray into the world. The ray's hit point on the face's plane is the new position for the dragged point.
    - id: face-drag-ray-becomes-plane-hit
    - test: [Drag_math.test.ts](../../../src/lib/ts/tests/Drag_math.test.ts) "hit on a tilted plane lies on the plane"
    - code: [src/lib/ts/editors/Drag.ts:18-29](../../../src/lib/ts/editors/Drag.ts)
29. That position is broken down along two directions defined by the face. Each part of the breakdown drives one editable number.
    - id: face-drag-decomposed-to-two-edges
    - test: [Drag_math.test.ts](../../../src/lib/ts/tests/Drag_math.test.ts) "delta along the first edge produces a result along the first local edge"
    - code: [src/lib/ts/editors/Drag.ts:33-49](../../../src/lib/ts/editors/Drag.ts)

## Wider behavior

30. A change to one cell never quietly changes a cell on another block unless that other block has a formula referring to the first.
    - id: unrelated-cell-untouched-by-change
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "unrelated SOs are not affected"
    - code: [src/lib/ts/algebra/Constraints.ts:604-638](../../../src/lib/ts/algebra/Constraints.ts)
31. Undo brings the world back to exactly the state it was in before the last user action. Nothing is recomputed.
    - id: undo-restores-prior-state
    - test: [History.test.ts](../../../src/lib/ts/tests/History.test.ts) "walks back five and forward five, landing where it started"
    - code: [src/lib/ts/managers/History.ts:18-23](../../../src/lib/ts/managers/History.ts)
32. Saving and loading is a round trip: the world after a save-then-load matches the world before the save, after the load-time recompute runs.
    - id: save-load-round-trip
    - test: [Save_Load.test.ts](../../../src/lib/ts/tests/Save_Load.test.ts) "a parent and a child come back with the same stored numbers and parent link"
    - code: [src/lib/ts/managers/Scenes.ts:31-92](../../../src/lib/ts/managers/Scenes.ts)

## Orientation and units

33. Each axis on a block carries an angle. The block's overall rotation is the composition of those three angles, applied in a recorded order. The order matters — applying the same three angles in different orders produces different visible results.
    - id: rotation-composition-order-matters
    - test: [Rotation.test.ts](../../../src/lib/ts/tests/Rotation.test.ts) "two quarter turns around different axes give different results when the order is swapped"
    - code: [src/lib/ts/runtime/Smart_Object.ts:362-370](../../../src/lib/ts/runtime/Smart_Object.ts)
34. Stored position numbers are in millimeters. The user can type a value in inches or feet; the parser converts to millimeters before storage. Anything that reads a stored value receives millimeters.
    - id: units-stored-in-millimeters
    - test: [Units.test.ts](../../../src/lib/ts/tests/Units.test.ts) "inches to mm"
    - code: [src/lib/ts/types/Units.ts:90](../../../src/lib/ts/types/Units.ts)

## Givens and formula safety

35. The user can define named values outside any block — call them ALPHA, BETA. Formulas can reference these names the same way they reference a block's cells. The named values are saved with the scene and restored on load before any formula is recomputed.
    - id: named-values-referenced-by-formulas
    - test: [Givens.test.ts](../../../src/lib/ts/tests/Givens.test.ts) "a formula that names a defined value evaluates to that value"
    - code: [src/lib/ts/algebra/Givens.ts:16](../../../src/lib/ts/algebra/Givens.ts)
36. Formula references must not form a loop. If one cell's formula reads a second cell, and the second cell's formula reads the first, the system refuses the loop rather than recomputing forever.
    - id: formula-cycle-refused
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "returns error on cycle"
    - code: [src/lib/ts/algebra/Evaluator.ts:186](../../../src/lib/ts/algebra/Evaluator.ts)
37. When a formula tree is walked backwards from a target number, exactly one writable cell inside the tree receives the new value. If there is no writable cell — for example because every candidate is locked — the write is refused. There is never more than one writable target.
    - id: reverse-propagation-single-or-refused
    - test: [Evaluator.test.ts](../../../src/lib/ts/tests/Evaluator.test.ts) "throws on multiple references"
    - code: [src/lib/ts/algebra/Evaluator.ts:57](../../../src/lib/ts/algebra/Evaluator.ts)

## Display, history, and repeater details

38. Every block has a visibility flag. A block also has a flag that hides all of its children. Hidden blocks do not render but still participate in the rule pipeline (formulas, layout, save and load).
    - id: block-visibility-flags
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "flipping the visibility flag and the hide-children flag preserves both values"
    - code: [src/lib/ts/runtime/Smart_Object.ts:12-13](../../../src/lib/ts/runtime/Smart_Object.ts)
39. When the user drags an edge, corner, or face, the resulting new value is rounded to the current precision grid before it is written to storage.
    - id: drag-snaps-to-precision-grid
    - test: [Snap.test.ts](../../../src/lib/ts/tests/Snap.test.ts) "an edge drag stores a value rounded by the snap function"
    - code: [src/lib/ts/runtime/Smart_Object.ts:274](../../../src/lib/ts/runtime/Smart_Object.ts)
40. After undo, redo brings the world forward to the state that was just undone. Like undo, redo restores stored values; nothing is recomputed during the restore.
    - id: redo-restores-undone-state
    - test: [History.test.ts](../../../src/lib/ts/tests/History.test.ts) "walks back five and forward five, landing where it started"
    - code: [src/lib/ts/managers/History.ts:25-30](../../../src/lib/ts/managers/History.ts)
41. A repeater carries its own spacing parameter, separate from the master block's run-direction length. Duplicates step along the run direction by the spacing, which need not equal the master's run-direction length.
    - id: repeater-spacing-independent-from-master
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 14: regular and bookend fireblocks have the right size and position"
    - code: [src/lib/ts/render/Engine.ts:1391-1398](../../../src/lib/ts/render/Engine.ts)
42. A fire block's size on the cross direction (the direction perpendicular to the run that is the tallest non-run side of the master) matches the master's size on that direction. The fire block is centered along that direction.
    - id: firewall-cross-direction-matches-master
    - test: [Repeaters.test.ts](../../../src/lib/ts/tests/Repeaters.test.ts) "test 14: regular and bookend fireblocks have the right size and position"
    - code: [src/lib/ts/render/Engine.ts:1534-1557](../../../src/lib/ts/render/Engine.ts)

## Cell modes and name resolution

43. Setting a formula on a cell clears any lock that cell carried. Once the cell's value comes from a formula, the lock that previously protected its plain number is cleared.
    - id: formula-clears-lock
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "a cell that was locked has its lock cleared once a formula is set on it"
    - code: [src/lib/ts/algebra/Constraints.ts:441-510](../../../src/lib/ts/algebra/Constraints.ts)
44. When a formula uses a bare name to refer to another SO, the resolver starts at the formula's host SO and walks up the parent chain. At each level, it looks among the children of that level for an SO with the matching name. The first match wins.
    - id: bare-name-resolver-walks-parent-chain
    - test: [Constraints.test.ts](../../../src/lib/ts/tests/Constraints.test.ts) "a bare name in a formula resolves to the closest sibling with that name, not a more distant SO"
    - code: [src/lib/ts/algebra/Constraints.ts:719](../../../src/lib/ts/algebra/Constraints.ts)

## Save format and named-value locks

45. A repeater's duplicates are not saved with the scene. The master is saved along with the repeater configuration; the duplicates are rebuilt from the master after load.
    - id: repeater-clones-not-saved
    - test: [Save_Load.test.ts](../../../src/lib/ts/tests/Save_Load.test.ts) "the saved snapshot of a repeater scene contains only the master, not the duplicates"
    - code: [src/lib/ts/managers/Scenes.ts:64-79](../../../src/lib/ts/managers/Scenes.ts)
46. A locked named value is protected from reverse propagation, the same way a locked cell is. Reverse propagation that would otherwise change the named value refuses the write.
    - id: locked-named-value-protected
    - test: [Givens.test.ts](../../../src/lib/ts/tests/Givens.test.ts) "a locked named value refuses reverse-propagation writes"
    - code: [src/lib/ts/algebra/Constraints.ts:968-980](../../../src/lib/ts/algebra/Constraints.ts)

## Geometry, viewing modes, and error state

47. Every SO is shaped like a box with eight corners, twelve edges between them, and six faces.
    - id: so-shaped-as-eight-corner-box
    - test: [Data_Layout.test.ts](../../../src/lib/ts/tests/Data_Layout.test.ts) "the standard cube wiring connects those eight corners with twelve edges"
    - code: [src/lib/ts/runtime/Smart_Object.ts:138](../../../src/lib/ts/runtime/Smart_Object.ts)
48. The camera has two viewing modes — 3D mode (the normal view where things farther from the camera look smaller) and 2D mode (a flat view where things at different distances keep their real size). The choice is stored as a user preference outside the saved scene file.
    - id: camera-two-viewing-modes
    - test: [Camera.test.ts](../../../src/lib/ts/tests/Camera.test.ts) "switching between 3D mode and 2D mode changes where a known world point lands on the screen"
    - code: [src/lib/ts/render/Camera.ts:95-103](../../../src/lib/ts/render/Camera.ts)
49. An error reported on a cell stays on that cell until it is explicitly cleared.
    - id: cell-error-stays-until-cleared
    - test: [Errors.test.ts](../../../src/lib/ts/tests/Errors.test.ts) "an error written on one cell of an SO is still there after later operations on other cells"
    - code: [src/lib/ts/algebra/Errors.ts:223-235](../../../src/lib/ts/algebra/Errors.ts)

## Identity, persistence, and deletion

50. Every SO carries a unique identifier that stays the same across save and load. Formulas, parent links, and the saved selection all point at SOs by this identifier; identifier stability is what lets save and load round-trip the world.
    - id: so-id-stable-across-save-load
    - test: [Save_Load.test.ts](../../../src/lib/ts/tests/Save_Load.test.ts) "a parent and a child come back with the same stored numbers and parent link"
    - code: [src/lib/ts/managers/Scenes.ts:64-79](../../../src/lib/ts/managers/Scenes.ts)
51. Deleting an SO removes every descendant of that SO too. Every formula inside the deleted subtree is cleared, and every formula on a surviving SO that referenced any deleted SO is also cleared.
    - id: delete-clears-formulas-and-subtree
    - test: [Engine_Behaviors.test.ts](../../../src/lib/ts/tests/Engine_Behaviors.test.ts) "a surviving SO whose formula referenced a deleted SO has its formula gone after delete"
    - code: [src/lib/ts/render/Engine.ts:590](../../../src/lib/ts/render/Engine.ts)

## Precision and grid

52. Changing the precision setting snaps every plain-number cell in the scene to the new grid. Cells that hold a formula are not touched.
    - id: precision-change-snaps-plain-cells
    - test: [Engine_Behaviors.test.ts](../../../src/lib/ts/tests/Engine_Behaviors.test.ts) "a plain-number cell is rounded to the new grid; a formula-driven cell is not touched"
    - code: [src/lib/ts/render/Engine.ts:570-590](../../../src/lib/ts/render/Engine.ts)

## Editing lock and decorations

53. There is an editing-lock toggle. While the lock is on, clicks on the canvas do nothing; the cursor stays as the open-grab-hand.
    - id: editing-lock-blocks-canvas-clicks
    - test: [editing-lock.spec.ts](../../../e2e/tests/editing-lock.spec.ts) "a click on the canvas while the lock is on does not pick a part"
    - code: [src/lib/ts/events/Events_3D.ts](../../../src/lib/ts/events/Events_3D.ts)

## View-mode and rotation

54. Switching from the normal three-dimensional view to the flat view snaps the camera onto the front-most face of the topmost SO and saves the prior orientation. Switching back restores that saved orientation.
    - id: view-mode-switch-saves-and-restores-orientation
    - test: [view-mode-switch.spec.ts](../../../e2e/tests/view-mode-switch.spec.ts) "toggling from 3D to 2D and back restores the orientation"
    - code: [src/lib/ts/render/Camera.ts](../../../src/lib/ts/render/Camera.ts)
55. When the rotation-snap toggle is on, releasing a tumble drag animates the orientation to the nearest face-aligned orientation. Turning the toggle off restores the orientation that was in place before the snap was last turned on.
    - id: rotation-snap-aligns-to-face
    - test: [rotation-snap.spec.ts](../../../e2e/tests/rotation-snap.spec.ts) "a tumble drag with rotation-snap on lands on a face-aligned orientation"
    - code: [src/lib/ts/render/Engine.ts](../../../src/lib/ts/render/Engine.ts)

## Drag

56. A drag with a current selection edits that selection — moves a corner, an edge, or a face. A drag with nothing selected tumbles the camera around the topmost SO.
    - id: drag-edits-selection-or-tumbles-camera
    - test: [drag-vs-tumble.spec.ts](../../../e2e/tests/drag-vs-tumble.spec.ts) "a drag of empty canvas changes the camera angle; a drag with a selection in place leaves the selection intact"
    - code: [src/lib/ts/events/Events_3D.ts](../../../src/lib/ts/events/Events_3D.ts)

## Preferences layer

57. A long list of user preferences persists across reloads through browser storage: chosen unit system, theme colors, the view mode, edge thickness, grid opacity, the precision level, the editing-lock toggle, which decorations are visible, which parts table tab is open, the parts hide list, which detail panels are showing, and several more. Preferences are not part of the saved scene file — they belong to the user, not the design.
    - id: preferences-persist-via-browser-storage
    - test: [Preferences.test.ts](../../../src/lib/ts/tests/Preferences.test.ts) "a written value survives a fresh read — same value comes back"
    - code: [src/lib/ts/managers/Preferences.ts](../../../src/lib/ts/managers/Preferences.ts)

## Center letter in formulas

58. A formula may reference the center of any direction using the bare letter `c` (host direction) or the axis-qualified form `<direction>.c` for a different direction. The center resolves to start-plus-end-over-two on the named direction, computed fresh on every read. Center references are read-only — reverse propagation refuses to write through a center, and a drag on a cell whose formula reads a center posts the message "cannot drag a center" to the on-screen status strip. A formula on a start, end, or length cell that references the same-direction same-SO center is rejected at the moment it is typed.
    - id: center-letter-formula-conventions
    - test: [Center.test.ts](../../../src/lib/ts/tests/Center.test.ts) "the bare letter c on a host direction resolves to the host direction's center"
    - code: [src/lib/ts/algebra/Constraints.ts:139](../../../src/lib/ts/algebra/Constraints.ts)

## Expand scope

### **Strong candidates**

these have tests already in the test index but no rule citing them, so the tests are quietly proving behavior the catalogue does not name:

- **Angle math** (`types/Angle.ts`) — there's a test file pinning angle normalisation, conversion, and comparison, but no rule names what those tests prove. Possible rule: "angles normalise to a canonical range; the same angle written two ways compares equal."
- **Coordinate math** (`types/Coordinates.ts`) — point/size/rectangle helpers, with tests, no rule.
- **Hit testing** (`events/Hits_3D.ts`) — there's a test file for 3D hit geometry (point-in-polygon, segment proximity, front-facing detection), no rule. The click-stack drill-down behaviour (each click rotates through stacked parts under the cursor) is described in the handoff but not in the catalogue.
- **Topology** (`render/Topology.ts`) — there's a test file ("Topology") for the unified-endpoint pipeline, no rule.
- **Save-format migrations** (`managers/Versions.ts`) — there's a test file ("Versions") for the v1-through-v9 chain, no rule. The catalogue says scenes round-trip but does not say "every old save format has a one-way upgrade to the current shape."

### **Plausible candidates**

load-bearing behaviour that no rule pins:

- **Selection-as-list semantics** — the "plain click replaces, command-click toggles, multi-select hides the three-tab strip" behaviour is described in the handoff but is not a catalogue rule.
- **Parts tree walks** (`managers/Parts.ts`) — the collapsed-rows model, the visible-row count, the hide-list generation — there are invariants (e.g. "collapsing a row hides every descendant; the visible-row count equals total minus hidden") that are not pinned.
- **Orientation math** (`algebra/Orientation.ts`) — sits in algebra (the explicit-yes area in the development process), no rule.

### **Out of scope per the development process:**

- Visual layout, colour, animation tick (`utilities/Colors.ts`, `render/Animation.ts`, the `R_*` decoration files, `editors/*` for inline editing widgets, `common/Constants.ts` for sizes and fonts) — the development process explicitly says these resist formalisation.
- Pure plumbing — type-alias files, prototype extensions, event plumbing without a clear invariant.

How the development process expects this to play out: don't extract them in a sweep. When work next touches one of these modules, write the rules its code assumes and add them at that point.

The validator and dashboard will keep the catalogue honest in the meantime — the strong candidates above are visible as a tell, since their tests sit in the test index without a `stipulation:` back-pointer.