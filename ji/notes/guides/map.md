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
- `documents/Documents.svelte` — the content view (always on): the tag chips at top (a filter — a document must carry **all** picked tags), a rule, then either the drop box (when "add new document" is active) or the documents table (type, name, tags, per-row "edit tags"). Derived off the store-changed tick, with a "no documents yet" empty state.
- `documents/Add_Document.svelte` — the drop box shown inside Documents when adding: saves each dropped file into the active store — text as its contents, jpeg/png/gif/bmp/pdf as a data-URL, anything else skipped. A smaller centered line lists the accepted types (read from the kind enum); a `--gap-fat` inset on three sides.
- `tags/Tags.svelte` — the tag picker: every tag in the active store as a toggle chip (centered), sharing the chosen set with its parent; an optional trailing snippet and an `ontoggle` callback let callers apply changes live.
- `tags/Add_Tag.svelte` — a "new tag" name field + add button that creates a tag in the active store. (Not yet wired to a trigger.)
- `main/BuildNotes.svelte` — the build-history popup: a paged table read from the markdown data file, with close and up/down arrows.
- `details/Details.svelte` — the collapsible details region: the preferences and data panels (no top banner). The frame passes the width.
- `details/Hideable.svelte` — a collapsible titled banner. **⟵di** (trimmed: plain toggle, no di engine).
- `details/D_Preferences.svelte` — the accent color picker, wired to Colors. **⟵di** (trimmed).
- `details/D_Data.svelte` — the document-store readout: document / tag counts, plus a storage switcher and a far-left "erase" button (inline "are you sure" confirm; wipes only the active store) on one row, hidden behind a clickable "more / less" separator whose choice is saved. Reads the registry's active storage; the cloud segment is a dimmed placeholder until firestore. **⟵ws** (trimmed).

## src/lib/ts/ — logic

- `main.ts` — app entry point; preloads the fonts, imports the Montserrat font CSS (weights 300, 400, 500) and the global `main.css`, and pushes the stacking-layer and layout-size variables before mounting.
- `utilities/Fonts.ts` — injects preload hints for the latin Montserrat files (300, 400, 500) so the browser fetches them in parallel and can have them ready by the first paint, avoiding the late-swap reflow of the segments. URLs come from importing the same files the font CSS uses, so nothing hardcoded goes stale.
- `common/Constants.ts` — the single source for sizes. A base "comfortable tap" number (35) plus groups (`font`, `pad`, `margin`, `gap`, `inset`, `radius`, `thickness`, `height`, `width`, `size`, `svg`, `layer`, `table`, `shadow`, `opacity`), most derived as fractions/multiples of the base. Change the base and the interface rescales together.
- `common/Configuration.ts` — mirrors values onto the page as CSS variables so plain stylesheets can read them: from Constants, the stacking layers (`--z-*`) and layout sizes (`--gap`, `--radius`, `--font-*`, `--inset-*`, `--thickness-*`, `--size-*`, …) at startup; from Colors, the fixed ink colors (`--black`, `--gray`) at startup and the reactive theme tokens (`--bg`, `--accent`, `--hover`, …) whenever a color store changes. **⟵di** (trimmed to the color setter, plus the layer, metric, and ink pushes).
- `common/Dirty.ts` — store wrappers that mark the canvas out of date. **⟵di**.
- `common/Extensions.ts` — String and Number prototype additions. **⟵di**.
- `managers/Preferences.ts` — settings saved to the browser (**⟵di**), plus per-storage namespaced list read/write for the document store and the active-storage key.
- `managers/Operations.ts` — holds `T_Operation` (document / tag) and the shared `w_operation` store for which "add new" mode is active (or null); persisted.
- `managers/Search.ts` — the shared filter: the picked-tags set and filter-text stores, plus a `filter_rows` helper that keeps documents carrying every picked tag whose name contains the text.
- `types/Angle.ts`, `types/Coordinates.ts`, `types/Types.ts` — angle math, points/sizes/rects, shared types. **⟵di**.

## src/lib/ts/database/ — the document store

The ported plugin store, trimmed to ji's data. See [db spec](../work/db%20spec.md) and [db proposal](../work/db%20proposal.md).

- `DB_Records.ts` — the five stored record shapes (Document, Tag, Tagging, Relationship, Predicate) plus the storage / document-kind / record-kind enums.
- `DB_Common.ts` — the shared base every storage inherits: the in-memory record lists, load-all / save-all, the add hooks, the read/write/delete-blob seam, the three reads (list documents by graph walk, filter by tag, untagged inbox), and the delete cascade.
- `DB_Local.ts` — the local storage: record lists in browser storage (namespaced per storage), document bytes in browser storage by id (stand-in until real disk files).
- `Databases.ts` — the registry: one live instance per storage, the active-storage store, the saved choice, the ring. Local only for now; the cloud slot is open.
- `Indexes.ts` — the in-memory lookups (tagging by tag id, tagging by document id, relationships by parent and by child) rebuilt on every change; source of the derived roots and untagged set.
- `Persistable.ts` — the in-memory per-record dirty flag (the modify date lives on the Document itself).
- `Signal.ts` — a "the store changed" tick the store bumps on every save and switch; views that show store contents derive off it to stay live.
- `DB.test.ts` — driven checks: save/reload/list, tag/filter, ordered children, delete cascade.
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
