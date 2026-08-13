---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-11
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Replace the `+` button with a drawn cross

The button that makes a file beside the one open wears a typed `+`. Every other mark in that row is drawn from [SVG_Paths.ts](../../src/lib/ts/utilities/SVG_Paths.ts) — the trash can, the close cross, the step marks — so this one sits at whatever size and weight the browser's own font gives a plus.

### Success

1. `svg_paths` gains a cross of two bars meeting at right angles, taking the same two things the others take: how big, and how thick.
2. The `+` in the editor's top row is that shape, drawn the way the trash mark beside it is — an `svg` of class `row-mark` holding one path.
3. It sits at the same weight as the trash can and the close cross, so the four buttons in that row read as one set.
4. The tests pin the path's shape, as [svg_paths.test.ts](../../src/lib/ts/tests/svg_paths.test.ts) already pins the others.

### The one judgment call

The existing `x_cross` is this same shape turned forty-five degrees. Either the new one is written on its own, or `x_cross` is turned — which would make one path serve both and leave a rotation in the drawing. Say which before it starts.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
