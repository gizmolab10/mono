---
kind: explain
title: "Map of lv files"
description: "Every file in the lv project and what it does. Read this instead of hunting; update it when files are added, moved or removed."
tags: [journal, notes, incorporated]
date: 2026-09-09
---
# Map of lv files

Read this instead of hunting. Update it when files are added, moved or removed. Every name here is a link — a press opens that file in the editor.

Since 9 September 2026 most of what lv draws with is gallery's, reached through the `gallery` alias: the page shell, the sidebar, the renderer, the galleries, the editing, the router, the parser, what the browser remembers, the stylesheet, the plugins and the tests of all of those. gallery's files are not listed here.

## What the reader sees

The pages, one file per page, in `src/md/`:

- [Little Cloud Vineyard.md](../../src/md/Little%20Cloud%20Vineyard.md) — the home page, marked `home: true`

The pictures and movies, in `src/assets/`:

- `the vineyard/` — one folder per gallery
- `icon.png` — the site's own mark
- [photo list.md](../../src/assets/photo%20list.md) — what is still to be added, by hand

And the one page the browser loads:

- [index.html](../../index.html)

## The app

What is drawn, in `src/lib/svelte/`, and the one file that starts everything:

- [Main.ts](../../src/lib/ts/Main.ts) — starts the app: imports gallery's two stylesheets, pushes core's sizes, layers and inks onto the page, hands gallery lv's switches, then mounts App
- [Vite_Env.d.ts](../../src/Vite_Env.d.ts) — tells the checker what vite's own import suffixes yield, and what the photo titles module holds
- [App.svelte](../../src/lib/svelte/App.svelte) — the top of the app: feeds the cursor to core's hits manager, pushes the colors, and draws gallery's page shell

What it takes from elsewhere, and what is its own, in `src/lib/ts/common/`:

- [Core.ts](../../src/lib/ts/common/Core.ts) — everything lv adopts from core, one line each, through the "core" alias. Only this file reaches through it; every other lv file imports here
- [Gallery.ts](../../src/lib/ts/common/Gallery.ts) — everything lv imports from gallery, one line each, through the "gallery" alias: the page shell and gallery's switches. Only this file reaches through it for code, and Main.ts for the stylesheet
- [Customizations.ts](../../src/lib/ts/common/Customizations.ts) — lv's own switches, gathered into one value so a caller names the file rather than every switch: whether the sidebar is drawn, the home page's name, the prefix remembered values are saved under

## Build-time pieces

gallery's two plugins run here over lv's own assets, on your machine and on Netlify alike. Neither reaches the browser.

- [vite.config.ts](../../vite.config.ts) — where the plugins and the two aliases are declared

## The published site

Building the published site turns each of the four files under `netlify/functions/` into one self-contained file, with everything it needs pasted inside — so the text of gallery's `stamp.ts` ends up in two of them, and of its `Order.ts` in one.

- [netlify.toml](../../netlify.toml) — where the functions live
- [add-photo.mts](../../netlify/functions/add-photo.mts) — a file under 5 MB added, and committed
- [recaption.mts](../../netlify/functions/recaption.mts) — a caption changed on a file already in the repository
- [delete-photo.mts](../../netlify/functions/delete-photo.mts) — a file thrown out, in a commit
- [reorder.mts](../../netlify/functions/reorder.mts) — a folder's own order written, and committed

Each asks for a passphrase; Netlify holds it, and the key to the repository, as `LV_PASSPHRASE` and `GITHUB_TOKEN`.

## Tests

In `src/lib/ts/test/`. The tests of gallery's code run in gallery.

- [Aliases.test.ts](../../src/lib/ts/test/Aliases.test.ts) — 4. Only Core.ts, Gallery.ts and Main.ts reach through an alias, and Main.ts only for the stylesheet

## Notes

In `memory/lv/notes/work/`:

- [code debt.md](../work/code%20debt.md) — what is still owed
- [work journal.md](../work/work%20journal.md) — decisions and finished work, newest first
- [bare bone website.md](../work/bare%20bone%20website.md) — how the site itself was built
- [photo gallery.md](../work/photo%20gallery.md) — how a gallery works, piece by piece
- [editing the published site.md](../work/editing%20the%20published%20site.md) — editing from the live site, and what it cannot do yet

In `memory/lv/notes/guides/`:

- `map of lv files.md` — this page
