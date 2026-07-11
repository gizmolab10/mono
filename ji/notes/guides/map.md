# Map — ji source

The intersection project's files. Update this when files are added, moved, or removed.

## Root config

- `vite.config.ts` — dev server (port 5184) and build.
- `package.json` — dependencies (markdown-it, color2k, @fontsource/montserrat).
- `CLAUDE.md` — project entry point.

## src/lib/svelte/ — components

- `main/App.svelte` — root component; on mount, pushes the theme colors onto the page.
- `main/Main.svelte` — the layout frame: the details + content regions and the hamburger toggle; hides both regions and shows the build-notes overlay while the popup is open.
- `main/Content.svelte` — the content region's body; switches on the content mode: `browse` shows the "Intersection" text and "Build N" opener, `add` shows the Add view.
- `main/Add.svelte` — the add-document view: a large drop-here rectangle (Phase 1 logs the dropped files; persistence comes later) with a back arrow to browse.
- `main/BuildNotes.svelte` — the build-history popup: a paged table read from the markdown data file, with close and up/down arrows.
- `details/Hideable.svelte` — a collapsible titled banner. **⟵di** (trimmed: plain toggle, no di engine).
- `details/D_Preferences.svelte` — the accent color picker, wired to Colors. **⟵di** (trimmed).

## src/lib/ts/ — logic

- `main.ts` — app entry point; also imports the self-hosted Montserrat font (weights 300, 400).
- `common/Configuration.ts` — pushes the color CSS variables (`--bg`, `--accent`, `--hover`, …) onto the page. **⟵di** (trimmed to the color setter only).
- `common/Dirty.ts` — store wrappers that mark the canvas out of date. **⟵di**.
- `common/Extensions.ts` — String and Number prototype additions. **⟵di**.
- `managers/Preferences.ts` — settings saved to the browser. **⟵di**.
- `types/Angle.ts`, `types/Coordinates.ts`, `types/Types.ts` — angle math, points/sizes/rects, shared types. **⟵di**.
- `types/Operation.ts` — the `T_Operation` type and the shared `w_operation` store for which view the content area shows (`browse` / `add` / `search`).
- `utilities/Colors.ts` — the color math and the reactive theme stores. **⟵di**.
- `utilities/SVG_Paths.ts` — SVG path generators, including the close-button cross. **⟵di**.

## src/lib/md/ and src/md/

- `lib/md/builds.md` — the build-notes data table, read at runtime.
- `md/Intersection.md` — project content doc.

## src/ other

- `vite-env.d.ts` — Vite ambient types (lets `?raw` text imports typecheck).
- `assets/icon.png` — app icon.
