---
kind: design
title: "ov — overview"
description: "A new project, ov — short for overview — that starts life as an empty room with good bones"
tags: [done, proposal]
date: 2026-08-08
---
# ov — overview

## What i want

A new project, `ov` — short for **overview** — that starts life as an empty room with good bones. No documents, no storage, no AI, no operations. Just a window with a details column on the **left**, one thing inside it — the accent color picker — and every size, color and spacing number already coming from one place.

The point is the bones, not the content. i want the look-and-feel machinery ji already earned, with none of ji's subject matter, so whatever overview turns out to be can start on day one instead of week three.

The page title is **Overview**. Saved settings are marked `ov_`.

## Implementation steps

In build order, in four phases. Each phase ends with something i can look at, so nothing is written blind.

### Phase 1 — the empty room

- [x] 1.1 New `ov/` folder beside ji
- [x] 1.2 The five root files: the page, the settings file, the typescript settings, the svelte settings, the vite settings
- [x] 1.3 Its own project instructions file and a `notes/work/` folder
- [x] 1.4 Dependencies: svelte, vite, typescript, the svelte vite plugin and tsconfig, svelte-check, color2k, Montserrat — nothing else
- [x] 1.5 Scripts: `dev`, `build`, `preview`, `check`
- [x] 1.6 A new entry in the shared ports file: 5185, plus the address of the `ov` folder on github. The vite settings read the port from there.
- [x] 1.7 `ov` added to the list of folders the top-level settings file treats as its own — without it, nothing installs.
- [x] 1.8 A list of files not worth keeping, matching ji's
- [x] 1.9 The one-line file that tells the type checker about vite's own extras, matching ji's

**Ends with:** `yarn build` succeeds, which proves the vite settings load and the port entry resolves.

**Left for phase 2:** the page carries no line pointing at the launch file yet. That line arrives with the launch file itself, so the page can never point at something that isn't there.

### Phase 2 — the bones

- [x] 2.1 Bring the numbers across — `Constants.ts` and `Configuration.ts` unchanged; `main.css` keeps its layer classes unchanged, but its catalogue of names was rewritten to match what is really pushed (ji's listed three names nothing pushes, and several belonging to screens overview doesn't have)
- [x] 2.2 Bring the support across, unchanged — `Colors.ts`, `Dirty.ts`, `Fonts.ts`, `Tooltip.ts`
- [x] 2.3 Bring `Debug.ts` across, with its log file named `ov`
- [x] 2.4 Trim `Preferences.ts` — read, write, remove, clear, and the remembering-store maker. Marker `ov_`. Nothing else. It says in the log, for each setting, whether it read back a saved value or fell back.
- [x] 2.5 Trim the section-names file — one entry, `preferences`
- [x] 2.6 Point the page at the launch file
- [x] 2.7 `main.ts` pushes the layers, sizes and inks, then reads three of them back off the page and says so in the log. No mounting yet — that line arrives with the app frame at 3.1.

**Ends with:** the page is still blank, but every size and fixed ink is already on it. `yarn build` and the type check both come back clean, and the log line proves the bridge works before a single component exists.

### Phase 3 — the room takes shape

- [x] 3.1 The app frame: the column on the left, content on the right, and the fits-or-doesn't math. It also mounts the app from the launch file.
- [x] 3.2 Its logging — the window width, the width both columns need, and which way the switch went
- [x] 3.3 The details column and its one section
- [x] 3.4 The collapsible banner
- [x] 3.5 The accent picker, and the hint on its swatch. It says in the log what color was picked, how bright it measured, and whether it was lifted for being too dark.
- [x] 3.6 The hint drawer, mounted once for the whole app
- [x] 3.7 `yarn check` — clean, zero errors and zero warnings

**Ends with:** the app in the drawing above, working. Pick a color, it recolors and remembers.

Two small departures, both to keep overview honest rather than faithful:

- **There is no show-or-hide switch for details.** ji has a button for it; overview has nothing to press it with, so the column is simply always there. The narrow-window rule still applies — content drops out, details fill the width.
- **One number, not two.** ji's arithmetic uses a tight outer margin while its stylesheet pads by the ordinary gap, so the drawing and the arithmetic disagree by a few pixels. Overview uses the ordinary gap for both.

The smallest useful width for the region beside details is named `content` in overview's numbers, where ji calls it `operations` — overview has no operations.

### Phase 4 — joining the family

- [x] 4.1 The hub button beside ji, labeled `ov`, with the letter **O**
- [x] 4.2 The keystroke, and overview added to both of the hub's project lists
- [x] 4.3 The start-servers script: read overview's port, one line saying it runs `yarn dev` in the `ov` folder, and `ov` added to the names the script accepts
- [x] 4.4 Walk the success checks — five of the eight confirmed, three still want a pair of eyes (see below)

**Ends with:** overview is a button i can press, like every other project.

Netlify is not in any phase. The steps are written down further below, for the day there's something to publish.

## The shape on screen

The whole window is one accent-colored frame with a small margin at all four edges. Inside it, a row:

    ┌──────────────────────────────────────────────┐
    │                                              │
    │   ┌────────────┐  ┌──────────────────────┐   │
    │   │ preferences│  │                      │   │
    │   │  accent ◉  │  │   content            │   │
    │   │            │  │   (empty for now)    │   │
    │   │            │  │                      │   │
    │   └────────────┘  └──────────────────────┘   │
    │                                              │
    └──────────────────────────────────────────────┘

Details on the left, same side as ji and di. Details keep a fixed column width, content takes the rest, and when the window gets too narrow to hold both, content drops out and details fill the width.

The details column holds one collapsible section, "preferences," and that section holds one row: the accent swatch. Click it, pick a color, and the whole app recolors — background, hover, text, all derived from that one choice. Which is exactly ji's best trick, and it costs almost nothing to bring across.

## What gets ported

### The numbers, straight across

- `Constants.ts` — unchanged. Every font size, margin, gap, corner radius, layer number, thickness. It's already free of ji's subject matter, so there is nothing to strip.
- `Configuration.ts` — unchanged. This is the bridge: it pushes every number from Constants onto the page as a CSS variable so plain stylesheets can read them. It also pushes the fixed inks and, reactively, the four theme colors.
- `main.css` — unchanged. The layer classes and the long comment cataloguing every variable.

These three are the heart of the ask. They port with zero edits.

### The support, straight across

- `Colors.ts` — unchanged. Derives background, hover and text from the one accent, and flips text to white on a dark background.
- `Dirty.ts` — unchanged. Colors wraps its stores in this, and with no canvas in ov the mark-stale callback simply stays a no-op. Two dozen lines to keep Colors identical is a better trade than editing Colors.
- `Fonts.ts` — unchanged. Preloads Montserrat so the first paint doesn't flicker.
- `Tooltip.ts` — unchanged. The one hover-hint watcher: an element marked with its own words shows them near the mouse after a short pause.
- `main.ts` — unchanged apart from the import paths. Push the layers, metrics and inks, then mount.

### The support, trimmed

- `Preferences.ts` — keep read, write, remove, clear, and the `persistent` store maker. Drop the rename tables, the sweep, the per-storage settings and the record lists. Those exist because ji has years of saved names to carry forward; ov has none. Marker becomes `ov_`.
- `Details.ts` (the section names) — one entry, `preferences`.

### The svelte — five files, and that's the lot

- `App.svelte` — ji's version plus the frame. Since overview has no Intersection screen, App owns the window sizing, the fits-or-doesn't math, and the row. It also runs the color effect, the global font styling, starts the hint watcher, and mounts the one hint drawer for the whole app.
- `Details.svelte` — trimmed. The collapsible column, one section, remembering open or shut. No data section, no build button, no author credit.
- `Hideable.svelte` — unchanged. The titled banner that opens and shuts a body.
- `D_Preferences.svelte` — the accent picker, hint and all.
- `ToolTip.svelte` — unchanged. Draws the one hover hint.

## What does not come across

Everything else, and it's most of ji: the whole `database/` folder, every manager but Preferences, all seven operation screens, four of the five support components, Controls, Help, BuildNotes, Intersection, the data section, the tests, the markdown files, `Extensions.ts`, `SVG_Paths.ts`, and every type that describes a document.

## Setting it up

New folder `ov/` beside ji, same shape:

    ov/
        .gitignore
        index.html
        package.json
        tsconfig.json
        svelte.config.js
        vite.config.ts
        CLAUDE.md
        notes/work/
        src/
            assets/
            lib/
                main.css
                svelte/
                    main/App.svelte
                    details/Details.svelte
                    details/Hideable.svelte
                    details/D_Preferences.svelte
                    support/ToolTip.svelte
                ts/
                    main.ts
                    common/Constants.ts
                    common/Configuration.ts
                    common/Debug.ts
                    common/Dirty.ts
                    managers/Preferences.ts
                    types/Details.ts
                    utilities/Colors.ts
                    utilities/Fonts.ts
                    utilities/Tooltip.ts

Same folder names as ji, so moving between the two costs no thinking. The empty `ts/tests/` folder doesn't get created until something needs it.

**Dependencies:** svelte, vite, typescript, the svelte vite plugin, the svelte tsconfig, svelte-check, color2k, and the Montserrat font. That's it. No markdown reader, no docs builder, no test runners, no playwright.

**Scripts:** `dev`, `build`, `preview`, `check`. Nothing else earns its place yet.

**Port number:** 5185, right after ji's 5184. It gets an entry in the shared ports file, and the vite config reads it from there the same way ji's does.

**Diagnostic log:** `Debug.ts` ports unchanged, with its log file named `ov`. Everything new i write into ov gets logging from the start, with the actual numbers behind each decision — the window width, the width needed for both columns, which way the fits-or-doesn't switch went.

## Showing up in the work sites hub

The hub is where i pick a project and jump to it, so overview has to be a button there like every other project. Five small edits, all following ji's pattern exactly:

1. **The shared ports file** — a new entry for overview: its port, and the address of its place on github.
2. **The project row** — a new button beside ji, labeled `ov`, with the letter **O** on it. O is free; every other project's letter is already spoken for.
3. **The keyboard** — pressing O previews overview, the same one-line move every other project button has.
4. **The two lists the hub builds its settings from** — overview joins both the app list and the docs list. Since overview has no docs, the hub works out on its own that its docs side is empty and quietly leaves that button dark. Nothing extra to write.
5. **The start-the-servers script** — read overview's port, add one line saying overview runs `yarn dev` in the `ov` folder, and add `ov` to the names the script accepts when told to start just one site.

None of the hub's buttons for a live site, a published site or a deploy page apply yet — overview isn't published anywhere. Those turn on by themselves the day its entry in the ports file gains those addresses.

## Getting on github, and getting published

### github — there's no new repo to make

Every project here already lives inside the one repo, `gizmolab10/mono`. ji, di, ws, ga, s3, lv, ma are all folders in it. Overview is another folder, so nothing gets created: it just needs a line in its ports-file entry pointing at its folder on github, spelled the same way ji's is.

The one project with a repo of its own is `me`, and that's the exception, not the pattern.

### netlify — the walkthrough already exists

The steps are in the deploy guide, under "Adding a New Site": `notes/guides/setup/netlify.md`. For overview they come out as:

1. In Netlify, start a new site from the `gizmolab10/mono` repo.
2. Set the base folder to `ov`.
3. Set the build command to `yarn build`.
4. Set the publish folder to `dist`.
5. Rename the site to match the others.
6. Write the resulting site address and its deploy page into overview's ports-file entry.

That last step is all the hub needs. The tool that reports whether a site is building or done reads its whole list of sites straight out of the ports file, so an entry with a Netlify address joins that list on its own.

That guide was out of date when i went looking — old folder names, files that had since moved. It's current now, so follow it as written.

### when

Not yet. Overview has nothing to publish until it has content. The github line goes in now, since it costs nothing and the hub's repo button wants it. Netlify waits.

## How i'll know it worked

1. [x] `yarn dev` opens a gray frame with a details column on the left and an empty content region beside it. — seen, and Jonathan said so
2. [x] The preferences banner opens and shuts, and remembers which it was across a reload. — the log shows the open list read back from the previous visit
3. [x] Picking an accent recolors the frame, the banner and the section body — and that color survives a reload. — the log shows a red accent read back from the previous visit
4. [x] Narrowing the window past the threshold drops the content region and lets details fill the width; widening brings it back. — the arithmetic is logged with its numbers, but the narrow case hasn't been watched yet
5. [x] `yarn check` is clean. No errors, no warnings. — zero and zero
6. [x] Hovering the accent swatch shows its hint just below the mouse, after a short pause. — not watched yet
7. [x] The hub shows an `ov` button, pressing O picks it, and the Local button opens overview at 5185. — written, not pressed yet
8. [x] Nothing in `ov/` mentions a document, a tag, a storage or a chat. — the only match is the browser's own saved-settings store, which is what saves the accent

## Content view

What fills the empty box beside details. Four more phases, same shape as the first four — each ends with something to look at.

**One thing this list assumes and doesn't say:** a list of files needs files, and overview has none — no store, no documents, nothing to filter. Something has to hold them before any of this can show anything. Worth settling before phase 5 starts.

### Phase 5 — the filters

- [ ] 5.1 A segmented control for kinds
- [ ] 5.2 A segmented control for tags
- [ ] 5.3 A search field
- [ ] 5.4 Every filter remembered across visits

**Ends with:** the content box holds a working filter row that comes back the way it was left.

### Phase 6 — the list

- [ ] 6.1 A hierarchal view of the filtered files
- [ ] 6.2 The same design as ji's list of documents

**Ends with:** changing a filter changes what the list shows.

### Phase 7 — opening a file

- [ ] 7.1 Picking a file from the list opens it

**Ends with:** a file can be read.

### Phase 8 — proof and record

- [ ] 8.1 Tests for everything above, ported from ji
- [ ] 8.2 Build notes, ported from ji, starting from an empty build-notes file

**Ends with:** the tests pass, and the build-notes popup opens on an empty table.
