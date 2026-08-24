---
kind: explain
title: "Map of lv files"
description: "Every file in the lv project and what it does. Read this instead of hunting; update it when files are added, moved or removed."
tags: [journal, notes]
date: 2026-08-21
---
# Map of lv files

Read this instead of hunting. Update it when files are added, moved or removed. Every name here is a link — a press opens that file in the editor.

## What the reader sees

The pages, one file per page, in `src/md/`:

- [Little Cloud Vineyard.md](../../src/md/Little%20Cloud%20Vineyard.md) — the home page, marked `home: true`

The pictures and movies, in `src/assets/`:

- `the vineyard/` — one folder per gallery
- `icon.png` — the site's own mark
- [photo list.md](../../src/assets/photo%20list.md) — what is still to be added, by hand

And the two the whole site leans on:

- [main.css](../../src/css/main.css) — every look-and-feel rule for the whole site
- [index.html](../../index.html) — the one page the browser loads

## The app

What is drawn, in `src/lib/svelte/`, and the one file that starts everything:

- [main.ts](../../src/lib/ts/main.ts) — starts the app
- [App.svelte](../../src/lib/svelte/App.svelte) — the top of the app
- [Main.svelte](../../src/lib/svelte/Main.svelte) — the page shell: the page, the status line, the edit button
- [Renderer.svelte](../../src/lib/svelte/Renderer.svelte) — renders the current page, and builds a gallery in each gallery box
- [Gallery.svelte](../../src/lib/svelte/Gallery.svelte) — one gallery: the picture, the caption, and the editing table
- [Edit.svelte](../../src/lib/svelte/Edit.svelte) — the edit button, top right
- [StatusLine.svelte](../../src/lib/svelte/StatusLine.svelte) — the line along the bottom
- [Sidebar.svelte](../../src/lib/svelte/Sidebar.svelte) — the page list, out of sight for now
- [Toggle.svelte](../../src/lib/svelte/Toggle.svelte) — the hamburger, out of sight for now

What it thinks with, in `src/lib/ts/utilities/`:

- [loader.ts](../../src/lib/ts/utilities/loader.ts) — every page and every picture, gathered at build time
- [parser.ts](../../src/lib/ts/utilities/parser.ts) — one page's text into html, Obsidian syntax and all
- [resolver.ts](../../src/lib/ts/utilities/resolver.ts) — a wiki-link's name into an address
- [router.svelte.ts](../../src/lib/ts/utilities/router.svelte.ts) — which page is showing, and the address bar
- [gallery.ts](../../src/lib/ts/utilities/gallery.ts) — where a step lands, and what a picture is called
- [order.ts](../../src/lib/ts/utilities/order.ts) — the order a folder is shown in: the list read, written, and one file moved
- [technical.svelte.ts](../../src/lib/ts/utilities/technical.svelte.ts) — whether editing is offered, and whether it is on
- [persistence.ts](../../src/lib/ts/utilities/persistence.ts) — what this browser remembers: the preference, the passphrase, the sidebar
- [sidebar-content.ts](../../src/lib/ts/utilities/sidebar-content.ts) — the page list, built from every page's own top settings
- [sidebar.svelte.ts](../../src/lib/ts/utilities/sidebar.svelte.ts) — whether the sidebar is showing
- [icons.ts](../../src/lib/ts/utilities/icons.ts) — the hamburger and the fold triangle, drawn

## Build-time pieces

These run while the site is built, on your machine and on Netlify alike. None reaches the browser. Building the published site turns each of the four files under `netlify/functions/` into one self-contained file, with everything it needs pasted inside — so the text of `stamp.ts` ends up in three of them.

- [photo-titles.ts](../../plugins/photo-titles.ts) — reads the title inside every picture, hands the app a list
- [stamp.ts](../../plugins/stamp.ts) — writes a caption into a png, a jpeg, a gif or a movie
- [movie-title.ts](../../plugins/movie-title.ts) — a movie's blocks: its caption read, written, and which movies take one
- [caption-drop.ts](../../plugins/caption-drop.ts) — the dev server's four doorways: `/__caption`, `/__recaption`, `/__reorder`, `/__delete-photo`
- [vite.config.ts](../../vite.config.ts) — where the plugins are declared

## The published site

- [netlify.toml](../../netlify.toml) — where the functions live
- [add-photo.mts](../../netlify/functions/add-photo.mts) — a file under 5 MB added, and committed
- [recaption.mts](../../netlify/functions/recaption.mts) — a caption changed on a file already in the repository
- [delete-photo.mts](../../netlify/functions/delete-photo.mts) — a file thrown out, in a commit
- [reorder.mts](../../netlify/functions/reorder.mts) — a folder's own order written, and committed

Each asks for a passphrase; Netlify holds it, and the key to the repository, as `LV_PASSPHRASE` and `GITHUB_TOKEN`.

## Tests

In `src/lib/ts/test/`. Every file names the rules it proves in its own first lines. 122 pass, 4 are skipped.

- [parser.test.ts](../../src/lib/ts/test/parser.test.ts) — 26. Obsidian syntax into html: wiki-links, embeds, callouts, the centered line, sizes, links with spaces
- [gallery.test.ts](../../src/lib/ts/test/gallery.test.ts) — 22. A folder's photos in the order its own list names, the callout that asks for a gallery, the height after the bar, the walk, what a photo is called, and the titles read while the site is built
- [order.test.ts](../../src/lib/ts/test/order.test.ts) — 12. The list read and written, a folder put in its order, and one file moved, wrapping at both ends
- [stamp.test.ts](../../src/lib/ts/test/stamp.test.ts) — 15. A caption written into a png, a jpeg and a gif, read back, and never doubled; what can carry one at all
- [movie title.test.ts](../../src/lib/ts/test/movie%20title.test.ts) — 9. A movie's blocks walked, which movies take a caption, the write, and the picture data left where it was
- [loader.test.ts](../../src/lib/ts/test/loader.test.ts) — 9. Every page and every picture gathered, keyed by name
- [sidebar-content.test.ts](../../src/lib/ts/test/sidebar-content.test.ts) — 9. The page list built from every page's top settings
- [resolver.test.ts](../../src/lib/ts/test/resolver.test.ts) — 8. A wiki-link's name into an address, and a page's own text
- [router.test.ts](../../src/lib/ts/test/router.test.ts) — 6. Which page is showing, the address bar, the not-found line
- [persistence.test.ts](../../src/lib/ts/test/persistence.test.ts) — 4. What this browser remembers across a reload
- [icons.test.ts](../../src/lib/ts/test/icons.test.ts) — 4. The hamburger and the fold triangle, drawn
- [sidebar.test.ts](../../src/lib/ts/test/sidebar.test.ts) — 2. Whether the sidebar is showing

The four skipped, each with its reason in the file:

- [parser.test.ts](../../src/lib/ts/test/parser.test.ts) — outside links should open in a new tab: nothing in the chain adds it
- [parser.test.ts](../../src/lib/ts/test/parser.test.ts) — one page body inline inside another: `![[Other Note]]` draws a broken image
- [parser.test.ts](../../src/lib/ts/test/parser.test.ts) — a pipe table should render as a table: no table step in the chain
- [loader.test.ts](../../src/lib/ts/test/loader.test.ts) — the folder a page sits in: every page sits at the top of `src/md/`

## Notes

In `notes/work/`:

- [code debt.md](../work/code%20debt.md) — what is still owed
- [work journal.md](../work/work%20journal.md) — decisions and finished work, newest first
- [working features.md](../work/working%20features.md) — what the site does today, and each thing's own limit
- [bare bone website.md](../work/bare%20bone%20website.md) — how the site itself was built
- [photo gallery.md](../work/photo%20gallery.md) — how a gallery works, piece by piece
- [editing the published site.md](../work/editing%20the%20published%20site.md) — editing from the live site, and what it cannot do yet

In `notes/guides/`:

- `map of lv files.md` — this page
