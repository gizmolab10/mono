# Stipulations

The load-bearing rules the app is built on. Without these written down, work drifts. Anything new should be checked against this list. All entries are guesses pending review.

**Coverage summary:** of forty-three rules, twenty-eight are directly covered by tests, two are partially covered, six are probably covered (judged from test file size, not verified line-by-line), and seven are not directly tested. Coverage judgments are guesses pending review.

## Blocks

1. The world is made of blocks called smart objects (SO). Every SO has three dimensions / axes {x, y, z}
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
2. Each axis has three attributes: start, length and end
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
3. Two of these (start and end) are defined to be relative to parent's start (except root)
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 12

## Each attribute has several flavors

4. plain number
    - Not directly tested — exercised everywhere, never asserted on its own.
5. locked number
    - Covered: [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) test 5
6. a formula computes the number
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts) and [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)

## Invariants

7. Always and only one of them is called invariant. It uses a built-in formula
    - Not directly tested — nothing pins this down.
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
14. User can edit a locked attribute's value cell.
    - Not tested — user-interface behavior, no unit test.

## Formulas

15. A formula attribute dynamically recomputes the value during propagation
    - Probably covered (judged from file size, not verified line-by-line): [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts)
16. propagation is initially triggered by some change, somewhere within the scope of its formula
    - Probably covered (judged from file size, not verified line-by-line): [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts)

## Children

17. A block sits inside at most one other block. Inside means its position numbers are written in its parent's frame.
    - Covered: [Data_Layout.test.ts](../../src/lib/ts/tests/Data_Layout.test.ts)
18. Moving a parent moves all of its children. Resizing a parent does not change a child's stored numbers.
    - Covered: [Hierarchy.test.ts](../../src/lib/ts/tests/Hierarchy.test.ts)

## Repeaters

19. A block can be marked as repeating along an axis called run. Its first child becomes the master copy. The rest are duplicates of that master.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 10
20. Each duplicate has a copy the master's stored numbers. run axis' start attribute is incremented using the run length
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 11

## Fire blocks

21. A repeater block can also be told to fill the gaps between duplicates. Each filler is shaped to fit its gap and centered along the z axis.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14

## Formula trees

22. The text of a formula is first broken into pieces — numbers, names, operators.
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts)
23. The pieces are assembled into a small tree.
    - Covered: [Compiler.test.ts](../../src/lib/ts/tests/Compiler.test.ts)
24. Walking the tree computes the number from the formula.
    - Covered: [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)
25. The same tree can be walked backwards: starting from a target number T, the system finds the one editable number E inside the tree whose value can be changed so as to make the formula compute T, and writes it to E.
    - Covered: [Evaluator.test.ts](../../src/lib/ts/tests/Evaluator.test.ts)

## Camera and projection

26. The world is shown through one camera. The camera defines how every point in the world corresponds to a spot on the screen.
    - Covered: [Camera.test.ts](../../src/lib/ts/tests/Camera.test.ts)
27. The same definition runs the other way: any spot on the screen becomes a ray that starts at the camera and points into the world. Thus a given mouse location corresponds to a ray piercing straight into the scene. Whatever objects are encountered along that ray are identified in the hits 3D manager
    - Covered: [Camera.test.ts](../../src/lib/ts/tests/Camera.test.ts)

## Dragging

28. A drag of a face of an SO is confined to that face's flat plane.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)
29. The drag's screen motion becomes a ray into the world. The ray's hit point on the face's plane is the new position for the dragged point.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)
30. That position is broken down along two directions defined by the face. Each part of the breakdown drives one editable number.
    - Covered: [Drag_math.test.ts](../../src/lib/ts/tests/Drag_math.test.ts)

## Wider behavior

31. A change to one cell never quietly changes a cell on another block unless that other block has a formula referring to the first.
    - Partially covered: [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) tests 7 and 8 pin down the case where writing the length leaves the unrelated recomputed cell alone.
32. Undo brings the world back to exactly the state it was in before the last user action. Nothing is recomputed.
    - Probably covered (judged shallow — only two tests in the file): [History.test.ts](../../src/lib/ts/tests/History.test.ts)
33. Saving and loading is a round trip: the world after a save-then-load matches the world before the save, after the load-time recompute runs.
    - Covered: [Save_Load.test.ts](../../src/lib/ts/tests/Save_Load.test.ts) covers stored numbers, parent links, locked lengths, and camera.

## Orientation and units

34. Each axis on a block carries an angle. The block's overall rotation is the composition of those three angles, applied in a recorded order. The order matters — applying the same three angles in different orders produces different visible results.
    - Not directly tested.
35. Stored position numbers are in millimeters. The user can type a value in inches or feet; the parser converts to millimeters before storage. Anything that reads a stored value receives millimeters.
    - Probably covered: [Units.test.ts](../../src/lib/ts/tests/Units.test.ts) covers parsing across millimeters, inches, feet, and compound forms.

## Givens and formula safety

36. The user can define named values outside any block — call them ALPHA, BETA. Formulas can reference these names the same way they reference a block's cells. The named values are saved with the scene and restored on load before any formula is recomputed.
    - Not directly tested.
37. Formula references must not form a loop. If one cell's formula reads a second cell, and the second cell's formula reads the first, the system refuses the loop rather than recomputing forever.
    - Probably covered: [Constraints.test.ts](../../src/lib/ts/tests/Constraints.test.ts) is described as covering cycle detection.
38. When a formula tree is walked backwards from a target number, exactly one writable cell inside the tree receives the new value. If there is no writable cell — for example because every candidate is locked — the write is refused. There is never more than one writable target.
    - Partially covered: the locked-target refusal is in [Invariants_and_Locks.test.ts](../../src/lib/ts/tests/Invariants_and_Locks.test.ts) test 6. The single-target uniqueness is not tested.

## Display, history, and repeater details

39. Every block has a visibility flag. A block also has a flag that hides all of its children. Hidden blocks do not render but still participate in the rule pipeline (formulas, layout, save and load).
    - Not directly tested.
40. When the user drags an edge, corner, or face, the resulting new value is rounded to the current precision grid before it is written to storage.
    - Not directly tested.
41. After undo, redo brings the world forward to the state that was just undone. Like undo, redo restores stored values; nothing is recomputed during the restore.
    - Probably covered (shallow): [History.test.ts](../../src/lib/ts/tests/History.test.ts) has only two tests.
42. A repeater carries its own spacing parameter, separate from the master block's run-direction length. Duplicates step along the run direction by the spacing, which need not equal the master's run-direction length.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14 uses a master width of one and spacing of four.
43. A fire block's size on the cross direction (the direction perpendicular to the run that is the tallest non-run side of the master) matches the master's size on that direction. The fire block is centered along that direction.
    - Covered: [Repeaters.test.ts](../../src/lib/ts/tests/Repeaters.test.ts) test 14.
