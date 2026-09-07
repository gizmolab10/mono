---
kind: analyze
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, weighed]
date: 2026-09-06
---
# Drive

## the header's soft pointer

### **Success criteria**

With the folders shown and more than one root folder in the list, the name column's header carries a soft pointer at the same x as the root rows' pointers, its center on the header's separator line. With one root or none, the header carries no pointer and the name title keeps its place. Pressing it still shuts every folder or opens every folder. `yarn svelte-check` clean, confirmed on screen at both counts.

### **The fault**

Today the header's pointer is drawn whenever the folders are shown, one root or many, and it is placed by hand: `top: calc(39% + 2px)` and `left: calc(3px - var(--gap))` inside the name title's cell, in a box widened by two gaps so its page-colored fill breaks the line. Nothing ties it to where the root rows draw theirs, and nothing asks how many roots there are.

### **The scheme**

1. **When.** `tops_open` already reads the root folders — the rows with `depth === 0` that are folders. A second derived count, `roots`, is the number of those rows. The pointer is drawn while `$w_show_folders && roots > 1`.
2. **Where across.** A root row draws its pointer in `.tri-slot`, a box `TRIANGLE` wide at the start of the name cell, the pointer centered in it. The header's pointer takes the same slot: a `.tri-slot` of the same width at the start of the name title's cell, the pointer centered in it, and no hand-set `left`. The name title then starts where the names start, as it does today.
3. **Where down.** The header's titles already straddle the line — the whole header table is lifted by half its height, so the line runs through their middle. The pointer sits in that same table, so with no hand-set `top` its center is the line's. The two pixels the header is lifted for its words are taken back on the pointer alone, as now.
4. **The fill that breaks the line.** The page-colored box that breaks the line behind the pointer keeps its width, so the line stops the same distance either side of the shape.

### **What goes**

The `top` and `left` on `.head-mark`, and the `$w_show_folders` alone as the drawing condition.

### **What stays**

`toggle_all_folders`, the `list.folders.all` target, the hover fill on the header's pointer, the row pointers untouched.

### **Decided**

With one root, that root's own soft pointer shuts every folder under it, so nothing is lost when the header's goes. Decided 6 September 2026.

Where it is now: built 6 September 2026 in List_Files.svelte — `roots` counts the root folders, the pointer is drawn while the folders show and `roots > 1`, in a `.head-slot` of the row slot's width at the name cell's start, centered both ways, with no hand-set top or left; svelte-check clean; controls.md line 21 says it; confirmed on screen 6 September 2026. Done; the file waits on Jonathan's word to dissolve.
