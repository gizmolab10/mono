# Map — ji source

The intersection project's files. Update this when files are added, moved, or removed.

## Root config

- `vite.config.ts` — dev server (port 5184) and build.
- `package.json` — dependencies (markdown-it, color2k, @fontsource/montserrat).
- `CLAUDE.md` — project entry point.

## src/lib/svelte/ — components

- `main/App.svelte` — root component; on mount, pushes the theme colors onto the page.
- `main/Intersection.svelte` — the layout frame (the app root under App): the details + content regions and the fixed Controls overlay; hides both regions and shows the build-notes overlay while the popup is open.
- `main/Controls.svelte` — the fixed top-left control cluster: the details-toggle hamburger plus the operation segments beside it. An `onAccent` prop colors the hamburger for the accent banner vs black on the content, and the frame passes the click.
- `main/Activity.svelte` — the content region's body; switches on the current operation: `browse` shows the "Intersection" text and "Build N" opener, `add` shows the Add view.
- `operations/Add.svelte` — the add-document view: a large drop-here rectangle (Phase 1 logs the dropped files; persistence comes later), with top room clearing the control cluster. Back to browse is the browse segment.
- `main/add_categories.svelte`, `main/categories.svelte` — empty stubs (create a category / pick categories); not wired in or visible yet, design TBD.
- `main/BuildNotes.svelte` — the build-history popup: a paged table read from the markdown data file, with close and up/down arrows.
- `details/Details.svelte` — the collapsible details region: its (empty) banner and the preferences panel. The frame passes the width; the control cluster is a separate fixed overlay.
- `details/Hideable.svelte` — a collapsible titled banner. **⟵di** (trimmed: plain toggle, no di engine).
- `details/D_Preferences.svelte` — the accent color picker, wired to Colors. **⟵di** (trimmed).
- `details/D_Data.svelte` — the document-store readout: document / tag / unsaved counts, plus a storage switcher (segmented control) hidden behind a clickable "show other stores" separator. Reads the registry's active storage; the cloud segment is a dimmed placeholder until firestore. **⟵ws** (trimmed).

## src/lib/ts/ — logic

- `main.ts` — app entry point; preloads the fonts, imports the Montserrat font CSS (weights 300, 400, 500) and the global `main.css`, and pushes the stacking-layer and layout-size variables before mounting.
- `utilities/Fonts.ts` — injects preload hints for the latin Montserrat files (300, 400, 500) so the browser fetches them in parallel and can have them ready by the first paint, avoiding the late-swap reflow of the segments. URLs come from importing the same files the font CSS uses, so nothing hardcoded goes stale.
- `common/Constants.ts` — the single source for sizes. A base "comfortable tap" number (35) plus groups (`font`, `pad`, `margin`, `gap`, `inset`, `radius`, `thickness`, `height`, `width`, `size`, `svg`, `layer`, `table`, `shadow`, `opacity`), most derived as fractions/multiples of the base. Change the base and the interface rescales together.
- `common/Configuration.ts` — mirrors values onto the page as CSS variables so plain stylesheets can read them: from Constants, the stacking layers (`--z-*`) and layout sizes (`--gap`, `--radius`, `--font-*`, `--inset-*`, `--thickness-*`, `--size-*`, …) at startup; from Colors, the fixed ink colors (`--black`, `--gray`) at startup and the reactive theme tokens (`--bg`, `--accent`, `--hover`, …) whenever a color store changes. **⟵di** (trimmed to the color setter, plus the layer, metric, and ink pushes).
- `common/Dirty.ts` — store wrappers that mark the canvas out of date. **⟵di**.
- `common/Enumerations.ts` — app enums; holds `T_Operation` (browse / add / search) as a string enum.
- `common/Extensions.ts` — String and Number prototype additions. **⟵di**.
- `managers/Preferences.ts` — settings saved to the browser (**⟵di**), plus per-storage namespaced list read/write for the document store and the active-storage key.
- `managers/Operations.ts` — the shared `w_operation` store for which view the content area shows (`browse` / `add` / `search`, or null for the arrival landing); persisted, defaults to null.
- `types/Angle.ts`, `types/Coordinates.ts`, `types/Types.ts` — angle math, points/sizes/rects, shared types. **⟵di**.

## src/lib/ts/database/ — the document store

The ported plugin store, trimmed to ji's data. See [db spec](../work/db%20spec.md) and [db proposal](../work/db%20proposal.md).

- `DB_Records.ts` — the five stored record shapes (Document, Tag, Tagging, Relationship, Predicate) plus the storage / document-kind / record-kind enums.
- `DB_Common.ts` — the shared base every storage inherits: the in-memory record lists, load-all / save-all, the add hooks, the read/write/delete-blob seam, the three reads (list documents by graph walk, filter by tag, untagged inbox), and the delete cascade.
- `DB_Local.ts` — the local storage: record lists in browser storage (namespaced per storage), document bytes in browser storage by id (stand-in until real disk files).
- `Databases.ts` — the registry: one live instance per storage, the active-storage store, the saved choice, the ring. Local only for now; the cloud slot is open.
- `Indexes.ts` — the in-memory lookups (tagging by tag id, tagging by document id, relationships by parent and by child) rebuilt on every change; source of the derived roots and untagged set.
- `Persistable.ts` — the in-memory per-record dirty flag (the modify date lives on the Document itself).
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
