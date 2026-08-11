---
kind: howto
title: "Try Both"
description: "Build two ways of showing something at once, behind one word you flip, and look at each."
tags: [tools, visual]
date: 2026-08-03
---

# Try both

When a look can't be settled by argument — and a look almost never can — build both and put a
switch at the top of the file.

## How

One line near the top of the file that draws it:

```ts
const test: 'a' | 'b' = 'a';
```

Then everything that differs reads that word. Change the letter, reload, look. No settings to
wire, nothing saved, nothing to undo — the two ways sit side by side in one file until one of
them wins.

## Why it beats deciding first

1. **A look is not arguable.** i can list what's good and bad about grayed-out words versus
   words that come and go, and be wrong about both, because neither of us knows how it feels
   until it's on screen.
2. **It costs one line.** Both ways already have to be written to be compared at all; the
   switch is what makes comparing them free.
3. **The loser leaves cleanly.** When one wins, the switch goes and so does the other branch —
   and what's left has no trace of the experiment.

## When not to

If the two ways differ in what they *do* rather than how they *look*, this becomes two
half-built features living in one file. Then build one, live with it, and change it if it's
wrong.

## Keep it short-lived

A switch left in for a week stops being a comparison and becomes a setting nobody chose. Look,
decide, cut the loser out the same day.
