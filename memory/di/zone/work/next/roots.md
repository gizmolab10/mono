# Roots

A root smart object is a self-contained unit — its own little world of bounds, formulas, and children. Right now, roots live and die in one scene. The idea: save them, shelve them, pull them back out and drop them into another graph as a child.

## The Vision

i want hierarchies of smart objects. A root SO, with its full subtree of children, gets serialized as a discrete unit. Saved in a library. Later, inserted as a child into a different graph. The algebra wires it in — child bounds reference parent bounds, formulas propagate, the whole hierarchy stays live.

This is where it starts to feel like Legos. Standardized blocks with internal complexity, snapped into larger structures. Each block is a root that *was* a standalone scene, now nested inside something bigger.

## What This Requires

- **Serialization** — a root SO (with its full subtree) saved as a discrete unit, formulas and all. Include a version field from day one — even as a placeholder. Costs nothing now, saves a migration later.
- **Instantiation** — pulling from the library creates a deep copy, rebinds IDs, wires into the new parent's coordinate space
- **Hierarchy depth** — SOs inside SOs inside SOs, each level with its own algebraic constraints flowing up and down
- **ID rebinding** — formulas reference SOs by ID; inserted copies need fresh IDs with formulas rewritten to match

## What Stays the Same

The cuboid topology stays fixed per SO. But a library object could be a whole assembly — multiple nested SOs acting as one unit. The algebra engine already handles parent-child formula propagation. The scene graph already does recursive matrix multiplication. The bones are there.

Library objects have no orientation

## Open Questions

- How deep can the nesting go before performance or legibility suffers?
- What happens to formulas that reference siblings when the root gets inserted elsewhere?
- [[versions]]
