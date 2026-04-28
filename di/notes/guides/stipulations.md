# Stipulations

The load-bearing rules the app is built on. Without these written down, work drifts. Anything new should be checked against this list. All entries are guesses pending review.

**Coverage summary:** of forty-nine rules, all forty-nine are directly covered by tests. Coverage judgments are guesses pending review.

## Blocks

1. The world is made of blocks called smart objects (SO). Every SO has three dimensions / axes {x, y, z}
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
2. Each axis has three attributes: start, length and end
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
3. Two of these (start and end) are defined to be relative to parent's start (except root)
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 12

## Each attribute has several flavors

4. plain number
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
5. locked number
    - Covered: [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) test 5
6. a formula computes the number
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts) and [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)

## Invariants

7. Always and only one of them is called invariant. It uses a built-in formula
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
8. If an invariant is mutated by the user, this causes reverse propagation "un-computing the number"
    - Covered: [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) tests 2, 3, 4, 9

## Root

9. has no parent
    - Covered: [Root.test.ts](../../src/lib/ts/tests/Root.test.ts)
10. end is always invariant
    - Covered: [Root.test.ts](../../src/lib/ts/tests/Root.test.ts)
11. start is always zero
    - Covered: [Root.test.ts](../../src/lib/ts/tests/Root.test.ts)
12. length can be locked
    - Covered: [Root.test.ts](../../src/lib/ts/tests/Root.test.ts)

## Locked attribute

13. The value of a locked attribute must not be altered by propagation
    - Covered: [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) test 6

## Formulas

14. A formula attribute dynamically recomputes the value during propagation
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts) — "changing wall updates door via formula"
15. Propagation is initially triggered by some change, somewhere within the scope of its formula
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts) — "propagation cascades through chain"

## Children

16. A block sits inside at most one other block. Inside means its position numbers are written in its parent's frame.
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
17. Moving a parent moves all of its children. Resizing a parent does not change a child's stored numbers.
    - Covered: [Hierarchy.test.ts](../../src/lib/ts/tests/Hierarchy.test.ts)

## Repeaters

18. A block can be marked as repeating along an axis called run. Its first child becomes the master copy. The rest are duplicates of that master.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 10
19. Each duplicate has a copy the master's stored numbers. run axis' start attribute is incremented using the run length
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 11

## Fire blocks

20. A repeater block can also be told to fill the gaps between duplicates. Each filler is shaped to fit its gap and centered along the z axis.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14

## Formula trees

21. The text of a formula is first broken into pieces — numbers, names, operators.
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts)
22. The pieces are assembled into a small tree.
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts)
23. Walking the tree computes the number from the formula.
    - Covered: [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)
24. The same tree can be walked backwards: starting from a target number T, the system finds the one editable number E inside the tree whose value can be changed so as to make the formula compute T, and writes it to E.
    - Covered: [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)

## Camera and projection

25. The world is shown through one camera. The camera defines how every point in the world corresponds to a spot on the screen.
    - Covered: [Camera.test.ts](../../src/lib/ts/tests/Camera.test.ts)
26. The same definition runs the other way: any spot on the screen becomes a ray that starts at the camera and points into the world. Thus a given mouse location corresponds to a ray piercing straight into the scene. Whatever objects are encountered along that ray are identified in the hits 3D manager
    - Covered: [Camera.test.ts](../../src/lib/ts/tests/Camera.test.ts)

## Dragging

27. A drag of a face of an SO is confined to that face's flat plane.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)
28. The drag's screen motion becomes a ray into the world. The ray's hit point on the face's plane is the new position for the dragged point.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)
29. That position is broken down along two directions defined by the face. Each part of the breakdown drives one editable number.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)

## Wider behavior

30. A change to one cell never quietly changes a cell on another block unless that other block has a formula referring to the first.
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts) — "unrelated SOs are not affected" pins down the no-formula case; "changing wall updates door via formula" pins down the with-formula case. The cross-cell-on-same-axis case is in [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) tests 7 and 8.
31. Undo brings the world back to exactly the state it was in before the last user action. Nothing is recomputed.
    - Covered: [History.test.ts](../../src/lib/ts/tests/History.test.ts) — "walks back five and forward five, landing where it started"
32. Saving and loading is a round trip: the world after a save-then-load matches the world before the save, after the load-time recompute runs.
    - Covered: [Save_Load.test.ts](../../src/lib/ts/tests/Save_Load.test.ts) covers stored numbers, parent links, locked lengths, and camera.

## Orientation and units

33. Each axis on a block carries an angle. The block's overall rotation is the composition of those three angles, applied in a recorded order. The order matters — applying the same three angles in different orders produces different visible results.
    - Covered: [Rotation.test.ts](../../src/lib/ts/tests/Rotation.test.ts)
34. Stored position numbers are in millimeters. The user can type a value in inches or feet; the parser converts to millimeters before storage. Anything that reads a stored value receives millimeters.
    - Covered: [Units.test.ts](../../src/lib/ts/tests/Units.test.ts)

## Givens and formula safety

35. The user can define named values outside any block — call them ALPHA, BETA. Formulas can reference these names the same way they reference a block's cells. The named values are saved with the scene and restored on load before any formula is recomputed.
    - Covered: [Givens.test.ts](../../src/lib/ts/tests/Givens.test.ts)
36. Formula references must not form a loop. If one cell's formula reads a second cell, and the second cell's formula reads the first, the system refuses the loop rather than recomputing forever.
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts) — "returns error on cycle"
37. When a formula tree is walked backwards from a target number, exactly one writable cell inside the tree receives the new value. If there is no writable cell — for example because every candidate is locked — the write is refused. There is never more than one writable target.
    - Covered: the locked-target refusal is in [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) test 6. The single-target uniqueness is in [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts) — "throws on no references" and "throws on multiple references".

## Display, history, and repeater details

38. Every block has a visibility flag. A block also has a flag that hides all of its children. Hidden blocks do not render but still participate in the rule pipeline (formulas, layout, save and load).
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
39. When the user drags an edge, corner, or face, the resulting new value is rounded to the current precision grid before it is written to storage.
    - Covered: [Snap.test.ts](../../src/lib/ts/tests/Snap.test.ts)
40. After undo, redo brings the world forward to the state that was just undone. Like undo, redo restores stored values; nothing is recomputed during the restore.
    - Covered: [History.test.ts](../../src/lib/ts/tests/History.test.ts) — "walks back five and forward five"
41. A repeater carries its own spacing parameter, separate from the master block's run-direction length. Duplicates step along the run direction by the spacing, which need not equal the master's run-direction length.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14 uses a master width of one and spacing of four.
42. A fire block's size on the cross direction (the direction perpendicular to the run that is the tallest non-run side of the master) matches the master's size on that direction. The fire block is centered along that direction.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14.

## Cell modes and name resolution

43. Setting a formula on a cell clears any lock that cell carried. Once the cell's value comes from a formula, the lock that previously protected its plain number is cleared.
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts)
44. When a formula uses a bare name to refer to another SO, the resolver starts at the formula's host SO and walks up the parent chain. At each level, it looks among the children of that level for an SO with the matching name. The first match wins.
    - Covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts)

## Save format and named-value locks

45. A repeater's duplicates are not saved with the scene. The master is saved along with the repeater configuration; the duplicates are rebuilt from the master after load.
    - Covered: [Save_Load.test.ts](../../src/lib/ts/tests/Save_Load.test.ts)
46. A locked named value is protected from reverse propagation, the same way a locked cell is. Reverse propagation that would otherwise change the named value refuses the write.
    - Covered: [Givens.test.ts](../../src/lib/ts/tests/Givens.test.ts)

## Geometry, viewing modes, and error state

47. Every SO is shaped like a box with eight corners, twelve edges between them, and six faces.
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
48. The camera has two viewing modes — 3D mode (the normal view where things farther from the camera look smaller) and 2D mode (a flat view where things at different distances keep their real size). The choice is stored as a user preference outside the saved scene file.
    - Covered: [Camera.test.ts](../../src/lib/ts/tests/Camera.test.ts)
49. An error reported on a cell stays on that cell until it is explicitly cleared.
    - Covered: [Errors.test.ts](../../src/lib/ts/tests/Errors.test.ts)
