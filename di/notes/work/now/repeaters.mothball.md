# Mothball — stud / joist / stair template kinds

**Mothballed:** 2026-05-17

## Why this is parked

The first cut replaced the single "add template" button with a three-way segmented control of stud, joist, and stair. The new child was given different starting dimensions for each kind. Visual confirmation said the result needs lots of work — the rough-shape defaults are not the right starting point, the names that get assigned to the new child are not the right names, and the connection between this template-creation step and the existing repeater logic (which already knows about studs, joists, and stair-shaped runs) was not thought through.

## What was attempted

A child-template helper on each part learned to take a kind argument — one of three: stud, joist, or stair. The kind controlled both the new child's name and the new child's starting dimensions:

- Stud — a vertical post: thin in the two horizontal directions, full height of the parent.
- Joist — a horizontal beam: full length along the parent's first axis, thin in the other two.
- Stair — a single step block: small along the parent's first and third axes, full depth along the second.

The engine method that creates and registers the new child passed the kind through to that helper. The single button in the selected-part panel was swapped for a row of three buttons styled with the existing segmented look, one button per kind.

## What needs more thought

1. The starting dimensions for each kind were guessed from rough wood-framing proportions (one twelfth, one eighth, full). The right defaults probably come from real lumber sizes (a stud is 1.5 inch by 3.5 inch, etc.) and from the parent's role in the assembly, not from arbitrary fractions of the parent.
2. The new child's name was set to the kind itself — "stud", "joist", "stair". Real assemblies will have many of each, so the name needs disambiguation or sequencing or both.
3. A stair template is a single step block, but a real staircase is a repeater of many step blocks climbing diagonally. The existing repeater already supports a diagonal-rise mode toggled by a "stairs" segmented control. The flow from "create a stair template" to "this stair template is repeated to form a staircase" was not wired — clicking "stair" should probably also pre-configure the repeater for the diagonal rise, or at least nudge the user toward it.
4. The three buttons appear only when the selected part has no children yet — same visibility as the original button. This may be wrong: the user may want to add a stud or joist inside a part that already has other children.
5. The new child's orientation in the assembly was not addressed. A joist running along the parent's first axis may want to be perpendicular to a wall instead; the user should be able to pick which axis the long side runs along, separate from picking the kind.
6. The visual treatment of the segmented control is generic — three plain text labels. It might want little icons (a vertical line for stud, a horizontal beam for joist, a stair-step glyph for stair) to make the choice readable at a glance.

## Files that were touched in the first cut (now reverted)

- The runtime per-part helper that builds a template child.
- The engine method that creates and registers the new child in the scene.
- The Svelte panel that holds the action button for the selected part.

## Pickup notes

When resuming, start by talking through what the user really expects each kind to produce — both the rough shape and how it fits into a larger assembly (a wall of studs, a floor of joists, a flight of stairs). The dimensions question is the easy part; the harder part is whether the template-creation flow and the repeater flow should converge.
