# Versions

A library object is a snapshot. But the original keeps evolving. What happens to the instances already placed in other graphs?

- too many open questions, too early to matter

## The Problem

i save a root SO as a library object. i drop it into three different scenes. Then i go back and tweak the original — add a child, change a formula, adjust bounds. Now three instances are stale. Or are they?

## Options

### 1. Frozen Copies

Each instance is a full deep copy at insertion time. The original can change all it wants — instances don't care. Simple, predictable, no surprises.

- **Pro:** no accidental breakage, each scene is self-contained
- **Con:** no way to propagate improvements; three copies drift apart

### 2. Live References

Instances are thin wrappers pointing back to the library definition. Change the original, all instances update. Like a component in Figma or a symbol in Sketch.

- **Pro:** one fix propagates everywhere
- **Con:** a bad edit breaks every scene that uses it; needs dependency tracking

### 3. Tagged Snapshots

Library objects carry version tags. Instances pin to a specific version. Updating is opt-in — you choose when to pull a newer version into your scene.

- **Pro:** best of both — stability by default, updates when you want them
- **Con:** more machinery — version history, diffing, migration of formulas across versions

## Leaning

Tagged snapshots feel right. Frozen copies are too isolated. Live references are too fragile. A version tag gives you control — pin to what works, bump when you're ready. And if a formula shape changes between versions, the migration step is where you handle it.

## Priority

Important but not yet. There's no library, no serialization, no insertion — versioning solves a problem that doesn't exist until roots can be saved and reused. Building it first would be engineering ahead of the art.

But it shapes the serialization design. If you know versions are coming, you bake in a version field from day one. Even a placeholder string. Retrofitting it later means migrating every saved library object. Cheap to plan for, expensive to add after.

## Open Questions

- What's the minimal version metadata? Hash of the serialized tree? Incrementing number?
- How do you diff two versions of a library object visually?
- Can an instance override part of the library definition (local tweaks on top of a version)?
- Does the library live in the project, or is it shared across projects?
