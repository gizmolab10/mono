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

- D: with the sidebar switched off, what was remembered counts for nothing — S_Sidebar keeps the remembered value private and its `visible` answers to the switch as well, so the content stops holding a column's width for a sidebar that is never drawn. Toggling does nothing while it is off. The test proves both branches by setting the switch
- D: lv's own switches live in common/Customizations.ts, beside Core.ts — one gathered value so a caller names the file, not every switch. First switch is enable_sidebar, moved out of Main.svelte. Check clean at 470 files, 122 tests pass
- I: pac written — `Customizations` for lv's own constants and switches; lv had no decisions.md, so one is created and named in the index
- D: the sidebar starts hidden — Jonathan undid the show; `S_Sidebar.svelte.ts` reads `loadSidebarVisible(false)` and the test now expects it, named "starts hidden". The hamburger's markup is commented out in Main.svelte, so nothing toggles it on screen
- D: every code file under lv/src is capitalized, each word after an underscore too — 25 files, one `git mv` each with no temporary name, and every importer re-pointed including index.html and the two plugins that reach into src. `sidebar-content` and `movie title` took underscores. The md and image files under assets/ and md/ are content the app loads by name, so they keep theirs
- D: no scrollbar is drawn anywhere, across or down — the rule moved off the sidebar and content boxes onto every element, so a bar cannot appear on anything new. Everything still scrolls by wheel, trackpad and arrow key
- D: the sidebar is back on screen and the shell has a top row — Main.svelte draws Sidebar and Toggle again, the shell wears sidebar-hidden only when the remembered choice says so, and the grid grew a row spanning both columns. That row is core's Section, `top.row`, bounded above by the view so it draws no line there, and holding nothing yet. Check clean at 469 files, 122 tests pass; nothing on screen is confirmed
- D: lv adopts the hits manager and core's colors — App.svelte hands over every mouse move, press and release, and pushes the four theme colors whenever one changes; main.ts calls configure_inks alongside the layers and metrics. lv remembers no color choice of its own, so these are core's defaults. Check clean at 467 files, 122 tests pass
- S: the sidebar is out of sight — Main.svelte draws Renderer, StatusLine and Edit, with Sidebar and Toggle commented out and the shell wearing `sidebar-hidden`. So "the sidebar is ov's details" names something not currently on screen
- D: lv reaches core through the alias — `core/*` in tsconfig.json and vite.config.ts, which vitest reads too since lv keeps no config of its own. common/Core.ts holds the adoptions, main.ts calls configure_layers and configure_metrics before anything draws
- D: only the px values in lv's stylesheet moved to core's rungs — fifteen of them: four hairline borders to --thick-faint, four to --thick, one dashed to --thick-big, seven pill radii to --radius-pill, one margin to --gap. Every rem is left exactly as it stands, by Jonathan's decision; the four with no rung near them wait in zone/ideas.md
- S: check clean at 467 files, 12 test files and 122 tests pass. Nothing on screen is confirmed yet — `yarn dev` is Jonathan's to look at
