---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-15
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Going back should come back to where you were

Following a link puts a file on a stack, and the back mark walks it. Coming back draws the file
again from its top, so a link pressed halfway down a long guide costs the reader their place — they
have to find it again by eye.

### Success

1. Following a link and coming straight back puts the words exactly where they stood.
2. Walking back several steps does the same at every one of them.
3. Going forward again returns to where that file was left, not to its top.
4. Coming back to the list from a file still lands on the row that file sits in, as it does today.
5. Opening a file fresh from the list still starts at its top.

### Where it stands

The stack holds where each file sits and nothing else, and the walk sets which file is being read:
[Operations.ts:38-44](../../src/lib/ts/managers/Operations.ts#L38-L44).

The list already does this for itself, and does it the right way: it remembers the row at the top of
the scrolled area by name, not by a number of pixels, so a list of a different length still comes
back to the same row: [Files_List.svelte:193-238](../../src/lib/svelte/content/Files_List.svelte#L193-L238).

A file's own words scroll in their own box, and that box already reports its scrolling to the hits
manager: [Markdown_Editor.svelte](../../src/lib/svelte/content/Markdown_Editor.svelte).

### Open

1. What to remember for a file — the same trick the list uses, naming the piece at the top by the
   line it came from, or the plain distance scrolled. The line survives an edit that adds lines
   above it; the distance does not.
2. Where it is kept. The stack is a list of paths today, so each step would grow a second field —
   or a separate map from path to where it was left, which also serves a file reached twice.
3. Whether a reload comes back scrolled. The stack itself is forgotten on reload, so this would
   only matter for the one file being read.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
