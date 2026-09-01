---
kind: analyze
type: decision
title: "lv decisions"
description: "Live rationales, and the pac responses weighing coming choices."
tags: [now, incorporated]
use_when: [naming something in lv, revisiting a choice already weighed]
date: 2026-09-01
---
# Decisions

## Evaluations (pac) made during 2026

- 1 September 2026; **`Customizations` as the name for lv's own constants and switches.**
  What it would hold: `enable_sidebar` and its kind — values true of lv and of no other host, gathered in one file beside `Core.ts`, which holds what lv takes from core. Today the first of them sits loose in `Main.svelte` as `show_booger`.
  For: it says plainly that these are lv's own alterations, and it collides with nothing — not DNS, not HTML, not core's own use of `host` for the project that adopts it. The everyday sense fits: a customization is a change made to a standard thing, which is what a switch off core's defaults is. And it is wider than `switches`, so a string or a number belongs there too.
  Against: it assumes a standard departed from, and half of what the file would hold departs from nothing — core has no sidebar, so `enable_sidebar` customizes neither core nor anything else. It names the act of customizing where every other source file in lv and core names a subject: Core, Loader, Parser, Persistence, Constants, Colors — thirty-odd files, none of them named for what was done to their contents. And it is long: `customizations.enable_sidebar` runs thirty characters before the switch, where every one of those is a single short word.
  Not evidence: no decision anywhere in memory covers the naming of source files. The 31 August choice of `drive` over `current`, `open` and `active` was about a file in `zone/`, and does not reach here.
  A middle path: `Custom.ts` — the same idea in one short word, reading as an adjective on whatever it holds.
  Deciding question: does the name say what the file holds, or how its contents came to differ — and is anything in it actually a departure from a standard, when core offers no sidebar to depart from?
  Decided 1 September 2026: `Customizations.ts`, beside `Core.ts` in `common/`. The pair reads as one sentence — Core is what lv takes from core, Customizations is what is lv's alone. One gathered value, `customizations`, so a caller names the file rather than every switch. Its first switch is `enable_sidebar`, moved out of `Main.svelte` where it sat loose.
