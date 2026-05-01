# Smart Objects

The data shape for one part. Holds the part's name, three directions, formulas, repeater config, visibility, and a back-reference to the scene-tree entry that draws it.

## Location

`src/lib/ts/runtime/Smart_Object.ts`

## What it owns

- A name. Free-form text the user can edit. Need not be unique.
- Three directions (x, y, z). Each direction is an Axis instance with start, length, and end attributes plus an invariant marker that says which of those three is computed from the other two.
- A rotation order — three indices that say which axis rotates first, second, third.
- An optional repeater configuration. When set, the part's first child is the template and the rest are clones. Cloning runs in the engine.
- A visibility flag. When false, the part is excluded from the click stack and drawn faintly.
- A hide-children flag. When true, descendants are not rendered.
- An optional back-reference to a scene-tree entry. When non-null, the renderer draws this part.

## What an Axis owns

A direction is built around three attributes — start, length, end — plus an invariant marker.

The invariant marker says which attribute is computed from the other two: zero means the start is recomputed (start = end − length), one means the end (end = start + length), two means the length (length = end − start). The center, when read, is always (start + end) / 2 — there is no stored center.

Citation: `src/lib/ts/runtime/Axis.ts`.

## Bounds

Stored values for position attributes are offsets from the parent's start corner; stored values for length attributes are absolute. Two helpers — `get_bound` and `set_bound` — read and write absolute world values and translate to and from the stored offset form.

When a position is written, the helper also keeps the axis's length in sync (unless a formula or lock prevents it) so the next invariant pass does not roll the change back.

Every bound write fires a static "canvas is out of date" callback. The setup code wires that callback to mark the canvas dirty.

## Attributes by name

The accessor `attributes_dict_byName` returns a dictionary keyed by the bound name (`x_min`, `x_max`, `width`, `y_min`, ...). Each entry is the attribute that holds the value for that bound.

## Repeater

When `repeater` is non-null, the engine treats the part as a repeater parent. The first child is the template; subsequent children are clones generated to satisfy spacing or gap-range constraints. Clones are skipped by the click stack and are not listed in the parts table — only the template is editable.

## Visibility

The `visible` flag controls whether the part is drawn at full opacity (true) or faintly as dashed grey (false). The `hide_children` flag, when true, suppresses descendants entirely.

## Serialization

Each Smart Object knows how to serialize itself to a portable shape (id, name, three axis structs, optional visible flag, optional hide-children flag, optional repeater, rotation order) and how to deserialize from that shape.

## Related files

- `src/lib/ts/runtime/Axis.ts` — one direction inside a Smart Object.
- `src/lib/ts/types/Attribute.ts` — one named value or formula entry.
- `src/lib/ts/types/Interfaces.ts` — the scene-tree entry, repeater config, portable shapes.
- `src/lib/ts/types/Types.ts` — bound names, axis names.
- `src/lib/ts/algebra/Constraints.ts` — formula resolution and propagation.
- `src/lib/ts/render/Engine.ts` — repeater clone management.
- `src/lib/ts/events/Hits_3D.ts` — hit-testing the part on the canvas.
