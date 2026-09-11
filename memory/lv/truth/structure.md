---
type: design
title: "How lv is put together"
description: "What lv takes from core and from gallery, what is lv's alone, and how its files are named."
use_when: [adding a file to lv, changing what lv takes from core or gallery, naming something in lv]
date: 2026-09-09
---
# How lv is put together

## Three files in `common/`

`Core.ts` is what lv takes from core; `Gallery.ts` is what lv takes from gallery; `Customizations.ts` is what is lv's alone. Between them they answer where anything belongs.

What arrives through `Core.ts` today: the one source for every size (`k`), the call that pushes those numbers onto the page (`c`), the additions to text and number handling, the color math and its four stores, the hits manager with the press and the point it reads, the hamburger and the section, and the arithmetic behind a section's edges.

What arrives through `Gallery.ts`: the page shell, `Main.svelte`, with everything under it — the sidebar, the renderer, the galleries, the editing, the router, the parser, what the browser remembers — and gallery's switches, which `Main.ts` sets to lv's own.

What `Customizations.ts` holds: one gathered value, `customizations`, so a caller names the file rather than every switch. Three switches, all read by gallery: whether the sidebar is drawn, the home page's name, and the prefix every remembered value is saved under. The rule for what belongs there — if core could ever want it, it is core's; if a viewer can change it, it is remembered by gallery's `Persistence`, under lv's prefix; otherwise it is here.

## Two files say where the aliases point

`tsconfig.json` and `vite.config.ts`, and they must always agree, for `core`, `panel` and `gallery`. lv's code names only core and gallery; the panel alias is there because lv's build compiles gallery's page, which is panel's. lv keeps no vitest config of its own, so the test runner reads the vite one — three files where a project with its own vitest config would need three. `Aliases.test.ts` proves that only the bridges reach through an alias.

## What lv owes at startup

`Main.ts` calls `configure_layers`, `configure_metrics` and `configure_inks` before anything draws, since a plain css file cannot import a typescript module. Then it hands gallery lv's three switches: gallery reads them only when asked, never while its files load, so values set here are the ones every file of gallery's sees. `App.svelte` hands the hits manager every mouse move, press and release, and pushes the four theme colors whenever one changes. lv remembers no color choice of its own, so those are core's defaults.

The stylesheets are the one thing that does not pass through `Gallery.ts`: `Main.ts` imports gallery's `Main.css`, the page shell, and `Gallery.css`, the pictures and their editing, itself, since a stylesheet has no exports and where it loads decides which rule wins between two that match equally.

## Every code file is capitalized

Each word after an underscore too: `Main.ts`, `Gallery.ts`, `Aliases.test.ts`. Hyphens and spaces in a name became underscores. The md and image files under `assets/` and `md/` keep their own spelling — they are content the app loads by name.

A file holding a rune must end `.svelte.ts`, whatever else its name says. Dropping that ending is how gallery's `S_Sidebar` once threw the moment it loaded.

## Sizes on screen

The stylesheet is gallery's now. Fifteen px values in it read core's rungs — the hairline borders, the pill radii, one margin. Every rem is left exactly as it is, waiting on a decision; the proposal in `zone/proposals.md` names the rung each would read.

No scrollbar is drawn anywhere, across or down. The rule sits on every element rather than on two named boxes, so a bar cannot turn up on something new. Everything still scrolls by wheel, trackpad and arrow key.

## The sidebar

Off by default, and its switch is `customizations.enable_sidebar`. Switched off, what was remembered counts for nothing — gallery's `S_Sidebar` keeps the remembered value private and its `visible` answers to the switch as well, so the content stops holding a column's width for a sidebar that is never drawn. Toggling does nothing while it is off.

The page is panel's: a controls row across the top holding the hamburger, the site's name and the edit button, the details column and the operation view beside each other, and a status line below them while a link leads nowhere. The sidebar is what the details column holds, and the md file is what the operation view holds.
