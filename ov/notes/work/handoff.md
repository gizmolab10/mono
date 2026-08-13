---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-13
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Register the hamburger with the hits manager

The hits manager is ported and builds, and nothing calls it. One control goes first, so the whole road is walked once on something small: the hamburger at the top left. The four steps are already written down in [hits manager](hits%20manager.md) under "implement for a control".

### Success

1. The cursor is fed in once, at the top of the app, and nowhere else.
2. The hamburger owns one target, made once, handed the drawn element when the browser makes it.
3. Its own press handler, its own mouse-enter handler and its own `:hover` rule are all gone; what it does and whether it is lit both come from the manager.
4. It is told when it moves or resizes, and told when it leaves the screen.
5. Pressing it and pointing at it read on screen exactly as they do now.

### Where it stands today

It is drawn at [Controls.svelte:18-21](../../src/lib/svelte/main/Controls.svelte#L18-L21), a press shows or hides the details, and it lights through a `:hover` rule on its own drawn shape at [Controls.svelte:63](../../src/lib/svelte/main/Controls.svelte#L63).

### The one judgment call

Feeding the cursor in at the top of the app hands every move to the manager, while every other control still answers for itself. Whether those two can run side by side for a while, or the wiring has to move all at once, is the thing to settle before it starts.

**What will not get done.** The rest of the debt list, and the other five kinds of thing in the breakdown — sections, subsections, clickable titles, rows, segmented controls. This is one control.
