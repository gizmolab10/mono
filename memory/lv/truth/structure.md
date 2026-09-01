---
kind: specify
type: design
title: "How lv is put together"
description: "What lv takes from core, what is lv's alone, and how its files are named."
tags: [incorporated]
use_when: [adding a file to lv, changing what lv takes from core, naming something in lv]
date: 2026-09-01
---
# How lv is put together

## Two files in `common/`

`Core.ts` is what lv takes from core; `Customizations.ts` is what is lv's alone. The pair reads as one sentence, and between them they answer where anything belongs.

What arrives through `Core.ts` today: the one source for every size (`k`), the call that pushes those numbers onto the page (`c`), the additions to text and number handling, the color math and its four stores, the hits manager with the press and the point it reads, the hamburger and the section, and the arithmetic behind a section's edges.

What `Customizations.ts` holds: one gathered value, `customizations`, so a caller names the file rather than every switch. The rule for what belongs there — if core could ever want it, it is core's; if a viewer can change it, it is remembered in `Persistence`; otherwise it is here.

## Two files say where the alias points

`tsconfig.json` and `vite.config.ts`, and they must always agree. lv keeps no vitest config of its own, so the test runner reads the vite one — three files where a project with its own vitest config would need three.

## What lv owes at startup

`Main.ts` calls `configure_layers`, `configure_metrics` and `configure_inks` before anything draws, since a plain css file cannot import a typescript module. `App.svelte` hands the hits manager every mouse move, press and release, and pushes the four theme colors whenever one changes. lv remembers no color choice of its own, so those are core's defaults.

The stylesheet is the one thing that does not pass through `Core.ts`: `Main.ts` imports `Main.css` itself, since a stylesheet has no exports and where it loads decides which rule wins between two that match equally.

## Every code file is capitalized

Each word after an underscore too: `Main.ts`, `S_Sidebar.svelte.ts`, `Sidebar_Content.ts`, `Movie_Title.test.ts`. Hyphens and spaces in a name became underscores. The md and image files under `assets/` and `md/` keep their own spelling — they are content the app loads by name.

A file holding a rune must end `.svelte.ts`, whatever else its name says. Dropping that ending is how `S_Sidebar` once threw the moment it loaded.

## Sizes on screen

Fifteen px values read core's rungs — the hairline borders, the pill radii, one margin. Every rem is left exactly as it stands, waiting on a decision; the four with no rung near them are named in `zone/ideas.md`.

No scrollbar is drawn anywhere, across or down. The rule sits on every element rather than on two named boxes, so a bar cannot turn up on something new. Everything still scrolls by wheel, trackpad and arrow key.

## The sidebar

Off by default, and its switch is `customizations.enable_sidebar`. Switched off, what was remembered counts for nothing — `S_Sidebar` keeps the remembered value private and its `visible` answers to the switch as well, so the content stops holding a column's width for a sidebar that is never drawn. Toggling does nothing while it is off.

The shell is four regions in a grid: a top row across the whole width, the sidebar and the rendered file beside each other, and the status line across the foot. The top row is core's `Section`, bounded above by the view so it draws no line there.
