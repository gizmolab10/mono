# Editors

Four small modules that handle the user's typed-and-dragged input on the drawing area. Each one owns a single kind of edit; together they are the input layer for everything the user can change directly on the canvas.

Citation: `src/lib/ts/editors/` — `Angular.ts`, `Dimension.ts`, `Drag.ts`, `Face_Label.ts`.

## What each one does

- **Dimension.** The user clicks a dimension number floating beside an edge and types a new value. The new value is parsed (units string, fraction, or formula expression), then applied to the part by writing the two endpoint bounds symmetrically around the current center, then propagation runs.
- **Angular.** The user clicks an angle number floating beside an axis and types a new angle. The new angle is parsed (number, with or without a degree symbol), then written to the part's angle for that axis, then propagation runs.
- **Face label.** The user clicks the small text on a face that shows the part's name and types a new name. The new name is trimmed, written to the part, the saved scene is updated.
- **Drag.** The user drags a face, an edge, or a corner of the selected part. Per-frame, the mouse position is unprojected to a world ray, intersected with the drag-start plane (held in the parent's local frame so a parent resize during the drag does not invalidate it), and the displacement is decomposed onto the face's two edges, then applied to the affected bounds via the upstream-walking distribution path.

Three of them share a lifecycle. The fourth (drag) is per-frame and does not.

## The shared lifecycle for the typed editors

The dimension editor, the angular editor, and the face-label editor each follow the same five-step pattern.

1. **Hit test.** Given a screen point, walk the rendered rectangles for that kind of edit and return the one the point was done inside.
   Citation: `Dimension.ts` lines 26-36, `Angular.ts` lines 26-36, `Face_Label.ts` lines 22-32.
2. **Begin.** When a hit is done, capture the part and the value into a small reactive state object, place an input overlay at the rectangle's screen coordinates, and set the editing-mode flag in the shared store.
   Citation: `Dimension.ts` lines 41-53, `Angular.ts` lines 41-51, `Face_Label.ts` lines 37-53.
3. **Parse.** When the user commits, parse the typed string. Each editor has its own parser (units-and-fractions for dimensions, plain number for angles, no parsing for face labels — just a trim).
   Citation: `Dimension.ts` lines 99-108 (with a fallback through the formula compiler so expressions work too), `Angular.ts` lines 81-86, `Face_Label.ts` line 61.
4. **Apply.** Snapshot the history first, then write to the part, run propagation, save the scene.
   Citation: each editor's `commit` method, line 59 in all three.
5. **Cancel.** Clear the state, clear the editing flag. The part is unchanged.
   Citation: `Dimension.ts` lines 111-114, `Angular.ts` lines 89-92, `Face_Label.ts` lines 87-91.

The shared editing-mode flag means only one of the three can be active at any moment. The status strip at the bottom of the canvas reads the same flag.

## The drag editor is different

Drag does not begin and commit. It runs per frame, while the mouse is held down. It captures a fixed plane and anchor at the first frame, then on every frame it computes the displacement from that anchor in the part's parent-local frame and applies the displacement either as a translation (face drag) or a stretch (edge or corner drag). When the mouse releases, the engine clears the drag's state — there is no commit phase. The history snapshot is taken once, on the first frame the drag has a hit.

Citation: `Drag.ts` lines 145-184 (target lifecycle and accessors), 304-355 (the per-frame edit-selection branch), 760-867 (the apply paths). The first-frame snapshot is in `src/lib/ts/events/Events_3D.ts` line 113.

## Where each editor's deeper page lives

- The drag pipeline (anchor capture, plane in parent-local frame, the upstream-walking distribution): [drag](drag.md).
- The dimension overlays (witness lines, terminator arrows, the three picking algorithms): [dimensionals](di/notes/guides/architecture/graph/dimensionals.md).
- The angle setters and the axis-swap helper: [axes](axes.md).
- The face-label editor has no dedicated page yet; this group page is the entry point.
