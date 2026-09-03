---
kind: analyze
title: "Proposals"
description: "lv proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, weighed]
date: 2026-09-03
---
# Proposals

## proposal: every size in Main.css reads a rung (3 September 2026)

Main.css is the only lv file holding rem values; no svelte file has one. Fifteen values already read core's rungs. What is left, grouped by value, with the rung each would read. The root font is 16px, so 1rem is 16px. J marks a judgment call — two rungs are about as near, or the nearest is not very near.

| written | px | reads | J |
| --- | --- | --- | --- |
| 0.1rem | 1.6 | --gap-faint 1.94 | |
| 0.25rem | 4 | --gap-small 4.32 | |
| 0.35rem | 5.6 | --gap-small 4.32 | J |
| 0.4rem | 6.4 | --gap 7.78 | J |
| 0.5rem | 8 | --gap 7.78 | |
| 0.6rem, 0.7rem | 9.6, 11.2 | --gap-big 9.72 | |
| 0.75rem | 12 | --margin-header 13.22 | J |
| 1rem | 16 | --gap-fat 16.33 | |
| 1.5rem, 24px | 24 | --pad-view-x 24, a new name pushed from pad.view.x | |
| 2rem | 32 | --gap-huge 38.89 | J |
| 3rem | 48 | nothing: no element wears .hamburger-button, the hamburger is core's | |
| 40rem | 640 | --width-fat 605.5, a new name pushed from width.fat | J |
| 0.8rem, 0.85rem | 12.8, 13.6 | --font 13 | J |
| 0.9rem, 0.9em | 14.4 | --font-big 14 | J |
| 1.4em | | --em-small 1.4 | |
| 8px radius | 8 | --radius-tiny 10 | J |
| -7px | | calc(var(--gap) * -1) | |
| -2px | | calc(var(--gap-faint) * -1) | J |
| 0.6px padding | | --thick-small 0.75 | J |

Two new names in Configuration.ts: `--pad-view-x` and `--width-fat`. No new rung in Constants.ts.

Where a J is refused, the fallback is a size of lv's own in Customizations.ts, pushed onto the page by Main.ts after core's. structure.md's rule says core's where core could ever want it, so the fallback is for values core has no use for.

Steps, once the table is agreed:

1. Configuration.ts pushes the two new names.
2. Main.css: each row replaced, one rule at a time, the dead .hamburger-button rules reported and left.
3. Search Main.css for `rem` and `px`: only the 250px column and the 700px media query remain, neither a rem.
4. structure.md's "Sizes on screen" says what now holds; the ideas entry goes.

Deciding question: is every J accepted as written, and which are not?
