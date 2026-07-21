# Map — ji source

The intersection project's files. Update this when files are added, moved, or removed.

## Root config

- `vite.config.ts` — dev server (port 5184) and build.
- `package.json` — dependencies (markdown-it, color2k, @fontsource/montserrat).
- `CLAUDE.md` — project entry point.

## src/lib/svelte/ — components

- `main/App.svelte` — root component; on mount, pushes the theme colors onto the page.
- `main/Intersection.svelte` — the layout frame (the app root under App): the top Controls row, then a panel with the details region and the content region (Documents). Pins the "Build N" opener + author credit to the frame's bottom-left (frontmost layer), computes the build number, and shows the build-notes overlay while the popup is open.
- `main/Controls.svelte` — the full-width accent controls row: the details-toggle hamburger at the left, "Add a new" + the document / tag segments centered, and a help button at the far right. The frame passes the details-toggle click.
- `main/Documents.svelte` — the content view (always on): an all/any toggle + the tag chips (a filter) at top, a "filter by name" box, a rule, then either the drop box (when "add new document" is active) or the documents table (type, name, tags, per-row "edit tags"). The list is narrowed by the shared Search state; derived off the store-changed tick, with a "no documents yet" empty state. A file linked to more than one parent shows up as more than one row (once under each); the later ones dim and carry a small turn-in mark — the same record, shown "also here". Any row with something nested under it leads with a fat triangle (down when open, right when shut) — a folder over its files, or a duplicate's original over the copy; shutting one drops its nested rows from the table, and the shut set is saved across reloads.
- `actions/Add_Document.svelte` — the drop box shown inside Documents when adding: hands each dropped file and folder to the shared drop saver, tagged with the batch's chosen tags. A smaller centered line names the families it takes, worked out from what we accept; each family word is a pill that lights under the cursor and shows that family's own file endings on hover (quiet while a drag is over the box), and the drop's count stands in their place while one runs. Its edge is a drawn shape rather than a border — 4 on, 2 off, going solid while a drag is over it — because a dashed border leaves the dash length to the browser. A `--gap-fat` inset on three sides.
- `actions/View_Document.svelte` — shows one document in the content area: reads its bytes back and renders by family — picture, pdf, sandboxed web page, video player, sound player, or plain words. Raw bytes get a short-lived link that is handed back when another document is shown; bytes stored the old way (one long piece of text) are already a usable link. Header carries the name and the shared close cross.
- `actions/Tags.svelte` — the tag picker: every tag in the active store as a toggle chip (centered), sharing the chosen set with its parent; a caller that binds the match mode also gets the all/any toggle beside the chips (the filter does; the per-row edit picker omits it), and a caller that passes `onadd` gets an always-shown "add a tag" button at the right of the chips. An optional trailing snippet and an `ontoggle` callback let callers apply changes live.
- `actions/Add_Tag.svelte` — a "new tag" name field + add + done buttons; add creates a tag in the active store, done calls the caller's close.
- `actions/ToolTip.svelte` — a hover hint that shows the instant the cursor arrives, drawn ourselves because the browser's own hover text waits a second and can't be hurried. Any element hands it the thing being pointed at and the words to show; it sits just below, runs as wide as it needs, and only nudges back off the window's right edge. Used by the drop box's family words.
- `main/BuildNotes.svelte` — the build-history popup: a paged table read from the markdown data file, with close and up/down arrows.
- `details/Details.svelte` — the collapsible details region: the preferences and data panels (no top banner). The frame passes the width.
- `details/Hideable.svelte` — a collapsible titled banner. **⟵di** (trimmed: plain toggle, no di engine).
- `details/D_Preferences.svelte` — the accent color picker, wired to Colors. **⟵di** (trimmed).
- `details/D_Data.svelte` — the document-store readout: document / tag counts, plus a storage switcher and a far-left "erase" button (inline "are you sure" confirm; wipes only the active store) on one row, hidden behind a clickable "more / less" separator whose choice is saved. Reads the registry's active storage; the cloud segment is a dimmed placeholder until firestore. **⟵ws** (trimmed).

## src/lib/ts/ — logic

- `main.ts` — app entry point; preloads the fonts, imports the Montserrat font CSS (weights 300, 400, 500) and the global `main.css`, and pushes the stacking-layer and layout-size variables before mounting.
- `utilities/Fonts.ts` — injects preload hints for the latin Montserrat files (300, 400, 500) so the browser fetches them in parallel and can have them ready by the first paint, avoiding the late-swap reflow of the segments. URLs come from importing the same files the font CSS uses, so nothing hardcoded goes stale.
- `common/Debug.ts` — the diagnostic-log sink: one call posts a plain-English line to the hub's log server (`/log?where=intersection`), which writes `logs/intersection.log` — overwrites on the first line of a session, appends after. Every `console.log` in ji routes through this.
- `common/Constants.ts` — the single source for sizes. A base "comfortable tap" number (35) plus groups (`font`, `pad`, `margin`, `gap`, `inset`, `radius`, `thickness`, `height`, `width`, `size`, `svg`, `layer`, `table`, `shadow`, `opacity`), most derived as fractions/multiples of the base. Change the base and the interface rescales together.
- `common/Configuration.ts` — mirrors values onto the page as CSS variables so plain stylesheets can read them: from Constants, the stacking layers (`--z-*`) and layout sizes (`--gap`, `--radius`, `--font-*`, `--inset-*`, `--thickness-*`, `--size-*`, …) at startup; from Colors, the fixed ink colors (`--black`, `--gray`) at startup and the reactive theme tokens (`--bg`, `--accent`, `--hover`, …) whenever a color store changes. **⟵di** (trimmed to the color setter, plus the layer, metric, and ink pushes).
- `common/Dirty.ts` — store wrappers that mark the canvas out of date. **⟵di**.
- `common/Extensions.ts` — String and Number prototype additions. **⟵di**.
- `managers/Preferences.ts` — settings saved to the browser (**⟵di**), plus per-storage namespaced list read/write for the document store and the active-storage key.
- `managers/Operations.ts` — holds `T_Operation` (document / tag) and the shared `w_operation` store for which "add new" mode is active (or null); persisted.
- `managers/Search.ts` — the shared filter: the picked-tags set and filter-text stores, plus a `filter_rows` helper that keeps documents carrying every picked tag whose name contains the text.
- `types/Document.ts` — everything a document is, apart from where it's stored: its shape (family, file ending, reported type, size, last-changed date, address, whether its words have been pulled out), the families and the endings we accept, which endings are clips and which are sound, which store as words and which as raw bytes, which are already plain words, and which the reading tool won't take as they stand. Plus the answers worked from those: what family an ending belongs to, which endings belong to a family, how to show it, what kind a dropped file is, what to store for it, and how to trim a redundant ending. Also the one-file size limit and a byte count said in human words.
- `managers/Hierarchy.ts` — the store's records and the living tree over them: it owns the in-memory record lists, the dirty bookkeeping, and the indexes; it holds the document lifecycle (create / add / replace / add-folder / erase), the graph walk (list documents by depth with their tags and folder chain, each row flagged whether it holds anything nested (so it earns an open/close triangle) — a thing linked to more than one parent is listed once under each, the later appearance flagged an "also here" echo, and a real loop stops the walk instead of hanging), the find-or-create rules (one meaning per type, one link per parent-child-meaning, one tag per name, one tag-link per pair), the tag graph, and the delete cascades. Two instant lookups, kept in step as records are made and rebuilt on load/delete: a document by its name (the dedup check) and any record by its id (`records_byID`, since ids never collide across kinds — a typed getter hands back the one kind a reference expects). Where the records and the document bytes actually live is the DB it wraps — it asks the DB to load, save, and hold bytes, nothing more. Reached as `$w_hierarchy` (components) or the plain `h` (ordinary code).
- `managers/Drop.ts` — the browser side of a drop, in two passes: first it walks everything without saving, only to count it, then it saves, counting off as it goes. Reads dropped entries, walks folders all the way down, and saves each file into the active store with the batch's tags, linked under its folder. Refuses anything over the size limit out loud, skips endings we don't take, and applies the store-wide same-name rules — a name already held anywhere with the same date is silently ignored, a different date stops and asks. Knows nothing about what a file *is* — that lives with the document.
- `managers/Dropping.ts` — what a drop in progress looks like to the screen: how many things it holds, how many are done, and the one question it can stop to ask. The question is a promise the saving waits on, so nothing is saved or removed until a choice is made.
- `actions/Drop_Status.svelte` — two lines that appear only while a drop runs, shown inside the drop box. The status line counts ("captured 3 of 40") with a filling ring, standing where the families list stands. Below it, rarely seen, the dialog line: the two-copies question, or a single thing the drop has to say (a refusal), each waiting on OK. A drop that lands on the table opens the drop box first, so the reporting always happens here.
- `types/Angle.ts`, `types/Coordinates.ts`, `types/Types.ts` — angle math, points/sizes/rects, shared types. **⟵di**.

## src/lib/ts/database/ — the document store

The ported plugin store, trimmed to ji's data. See [db spec](../work/db%20spec.md) and [db proposal](../work/db%20proposal.md).

- `DB_Records.ts` — the five stored record shapes (Document, Tag, Tagging, Relationship, Predicate) plus the storage and record-kind lists. What a document *is* now lives in `types/Document.ts`; this file re-exports it for older imports.
- `DB_Common.ts` — the persistence seam every storage fills its own way: read/write one record kind's whole list, and read/write/delete/clear the document bytes. Holds no records and no tree logic — those live on the Hierarchy that wraps it. A subclass only decides where the lists and the bytes actually live.
- `DB_Local.ts` — the local storage: record lists in browser storage (namespaced per storage); document bytes in the browser's larger store by id — words as words, everything else as the file's own raw bytes, handed over without a copy. Erase deletes the whole byte-database so nothing survives under an old key, and says plainly when another open tab is blocking it.
- `Databases.ts` — the registry: one live instance per storage, the active-storage store, the saved choice, the ring. Local only for now; the cloud slot is open. Also publishes the active store's tree two ways — `w_hierarchy` (a store, for `$w_hierarchy.X` in components) and the plain `h` (for ordinary code like Drop) — each changing only when the active store changes.
- `Indexes.ts` — the in-memory lookups (tagging by tag id, tagging by document id, relationships by parent and by child) rebuilt on every change; source of the derived roots and untagged set.
- `Persistence.ts` — the in-memory dirty-tracking manager (which record ids of each kind still need saving; the modify date lives on the Document itself). Named to free "Persistable" for the planned record base class — see [persistables plan](../work/persistables.md).
- `Signal.ts` — a "the store changed" tick the store bumps on every save and switch; views that show store contents derive off it to stay live.
- `DB.test.ts` — driven checks: save/reload/list, tag/filter, ordered children, delete cascade, finding a document by name in its own place, and replacing one without losing its tags.
- `Drop.test.ts` — the drop's rules driven the way the screen drives them: the browser's dropped entries are stood in for, and the questions are answered through the same shared state the strip on screen reads. Covers the same-name rules, the standing "do the same for the rest" answer, counting (folders, skips and refusals included), and the folder rules.
- `Mock_Storage.ts` — browser storage stood in for node, installed on import so the database registry can be built at all.
- `utilities/Colors.ts` — the color math, the reactive theme stores, and the fixed design colors including the ink `black` (`#1a1a1a`, never `#000`) and `gray`. **⟵di**.
- `utilities/SVG_Paths.ts` — SVG path generators, including the close-button cross. **⟵di**.

## src/lib/ — global styles

- `main.css` — the global stylesheet; holds the stacking-layer classes (`layer-common` … `layer-intersection`) that read the layer variables Configuration pushes from Constants. Add a layer to an element with its class; the z number stays in Constants.

## src/lib/md/ and src/md/

- `lib/md/builds.md` — the build-notes data table, read at runtime.
- `md/Intersection.md` — project content doc.

## src/ other

- `vite-env.d.ts` — Vite ambient types (lets `?raw` text imports typecheck).
- `assets/icon.png` — app icon.
