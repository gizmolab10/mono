# Library

The library panel is the place the user goes to start from a saved arrangement, to drop a saved arrangement inside the current one, or to put the current arrangement somewhere they can come back to it.

Citation: `src/lib/svelte/details/D_Library.svelte`. The on-disk and in-memory plumbing lives in `src/lib/ts/managers/Scenes.ts`.

## Where the entries come from

Two sources are merged into a single list.

- **Bundled.** Files that ship with the app, picked up at build time from the assets folder. The bundle is read into memory eagerly, so the panel can paint immediately on first open.
- **On-device.** Files the user has saved before, kept in the browser's local database. This source loads asynchronously after first paint; the list re-renders when it arrives.

If a name collides between the two sources, the on-device file wins.

Citation: `Scenes.ts` lines 188-201 (the merge), lines 213-221 (the bundled list), lines 204-210 (loading a single file), lines 224-247 (the size lookup against on-device storage).

## Folders

A name with a slash in it places the entry under a folder. The first segment is the folder; the remainder is the display name. Folders are shown as a row of segmented buttons across the top; clicking a button filters the list to that folder. The chosen folder is persisted in browser storage, so the panel returns to the same view next time.

Citation: `D_Library.svelte` lines 19-28 (the slash split), lines 95-105 (the folder buttons), lines 16, 100 (the persistence read and write).

## Three actions on a selection

A single row is selectable.

- **Replace.** Loads the selected file's content, parses it through the migration chain, and hands the result to the engine to build the scene from scratch. The current scene is replaced; the part's display name is set to the file's display name.
- **Insert.** Loads the selected file and inserts its root as a child of the currently-selected part (or the root, if nothing is selected). Existing geometry is preserved. Propagation runs once after the insert; the scene is then saved.
- **Double-click on a row.** Same as replace, with one less click.

Citation: `D_Library.svelte` lines 61-91 (replace and insert), line 109 (double-click wiring).

## Two more actions on the panel

- **Import.** Opens a file picker; the chosen file is read, parsed, migrated, and handed to the engine the same way replace does it.
- **Save current scene to the library.** Writes the current scene to the on-device store under the root part's name and triggers a browser download of the same content. The persistent counter that tells the library panel to refresh is bumped.

Citation: `Scenes.ts` lines 250-264 (save to library), lines 279-297 (import from disk); `D_Library.svelte` line 121 (the import button).

## Sizes

Each row shows a file size on the right, in bytes for very small files and kilobytes otherwise. The bundle's sizes come from the eager glob; the on-device sizes are read from a sidecar metadata store kept in sync with each save. No file content is loaded just to render the list.

Citation: `D_Library.svelte` lines 37-39 (formatting); `Scenes.ts` lines 224-247 (size lookup).

## How the panel keeps in sync

A reactive counter in the shared stores is bumped whenever the library has been written to. The panel watches the counter; on each bump, it re-merges the bundled and on-device lists and recomputes the visible rows.

Citation: `D_Library.svelte` lines 12, 59 (the watch); `Scenes.ts` line 263 (the bump).
