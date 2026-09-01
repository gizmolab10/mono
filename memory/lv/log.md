---
kind: analyze
title: "lv log"
description: "<!-- consolidated: 30 August 2026 -->"
tags: [journal, now]
date: 2026-08-30
---
# lv log

<!-- consolidated: 31 August 2026 -->

## 1 September 2026

- D: no scrollbar is drawn anywhere, across or down — the rule moved off the sidebar and content boxes onto every element, so a bar cannot appear on anything new. Everything still scrolls by wheel, trackpad and arrow key
- D: the sidebar is back on screen and the shell has a top row — Main.svelte draws Sidebar and Toggle again, the shell wears sidebar-hidden only when the remembered choice says so, and the grid grew a row spanning both columns. That row is core's Section, `top.row`, bounded above by the view so it draws no line there, and holding nothing yet. Check clean at 469 files, 122 tests pass; nothing on screen is confirmed
- D: lv adopts the hits manager and core's colors — App.svelte hands over every mouse move, press and release, and pushes the four theme colors whenever one changes; main.ts calls configure_inks alongside the layers and metrics. lv remembers no color choice of its own, so these are core's defaults. Check clean at 467 files, 122 tests pass
- S: the sidebar is out of sight — Main.svelte draws Renderer, StatusLine and Edit, with Sidebar and Toggle commented out and the shell wearing `sidebar-hidden`. So "the sidebar is ov's details" names something not currently on screen
- D: lv reaches core through the alias — `core/*` in tsconfig.json and vite.config.ts, which vitest reads too since lv keeps no config of its own. common/Core.ts holds the adoptions, main.ts calls configure_layers and configure_metrics before anything draws
- D: only the px values in lv's stylesheet moved to core's rungs — fifteen of them: four hairline borders to --thick-faint, four to --thick, one dashed to --thick-big, seven pill radii to --radius-pill, one margin to --gap. Every rem is left exactly as it stands, by Jonathan's decision; the four with no rung near them wait in zone/ideas.md
- S: check clean at 467 files, 12 test files and 122 tests pass. Nothing on screen is confirmed yet — `yarn dev` is Jonathan's to look at
