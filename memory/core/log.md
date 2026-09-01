---
kind: analyze
title: core log
description: "<!-- consolidated: 30 August 2026 -->"
tags: [journal, now]
date: 2026-08-30
---
# core log

<!-- consolidated: 31 August 2026 -->

## 1 September 2026

- D: how a host adopts core is core's own truth — 'adopting core.md' moved out of ov's zone, where lv would never have found it, and core's index now lists all seven truths rather than two

## 31 August 2026

- D: the stylesheet keeps its own door — the rule reads "for code, only Core.ts reaches through the alias", naming main.ts as the one other place for main.css alone; load order decides which rule wins between two that match equally, and through Core.ts the styles would arrive with whichever file was pulled in first
- I: pac written — the stylesheet is a second door through the alias; either it rides Core.ts as a bare import the way Extensions does, or the rule says "for code" and names it as the exception
- D: the cycle's cut is in the code, not only in the telling — Colors.ts now imports '../common/Dirty' rather than the barrel that drags Configuration in; core clean at 467, ov at 530
- D: core keeps nothing of the host's vocabulary — Big_Pill's `area` prop is gone; it takes `name`, `items`, `shown` and `reads` as plain values, and `in_reach` went with the two functions that used it. Tag_Areas.ts remains ov's. core checks clean at 467 files
- I: pac written — Big_Pill's five errors have two ways out: move Tag_Areas.ts into core, or hand the component what it needs as props; the deciding question is whether a pure function over a host's data is library material
- D: core checks and tests itself — tsconfig.json, vitest.config.ts and src/vite-env.d.ts added; no vite.config.ts, since core is a library with no port in the hub's ports file and no app to serve. 11 test files, 91 tests, all pass — before this they ran nowhere
- S: core's own check has never run until now, and it names one real fault: Big_Pill imports Tag_Area, area_reads and tags_shown from core's types barrel, and Tag_Areas.ts lives only in ov. Five errors, one cause. BuildNotes' four went with the vite-env declaration
- D: core takes ov's version of four files it had fallen behind on — Stacked.ts (the hidden field), Stack.svelte (the whole hidden-section treatment), main.css (the list-row selector dropped, since .files-table is ov's), App.ts (files, not guides)
- D: ideas.md is core's own — the carve's ov leftovers are out: the tagset idea (ov's, and decided in code — the area is named fate), the four-claimants copy (shared's questions hold it), and the stray [[my story]] link; the frontmatter says core
