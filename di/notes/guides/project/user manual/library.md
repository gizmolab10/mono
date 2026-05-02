# Library

The library panel is where you go to start from a saved arrangement, drop a saved arrangement inside the current one, or save the current arrangement so you can come back to it.

## Two sources, one list

The list shows two kinds of files merged together.

- **Bundled.** Files that ship with the app. They appear immediately when you open the panel.
- **Saved on this device.** Files you have saved before. They appear a moment later, after the on-device store has been read.

If a name collides between the two sources, the on-device file wins.

## Folders

A name with a slash in it lives under a folder. The first segment is the folder; the remainder is the display name. Folders show as a row of buttons across the top of the panel. Click a folder button to filter the list to that folder. Your folder choice is remembered between sessions.

## Three ways to use a row

Click a row to select it. Then either:

- Click **replace** — the saved file's content replaces the current scene.
- Click **insert** — the saved file is inserted as a child of the currently-selected part (or as a child of the root, if nothing is selected). The current scene is preserved.
- Double-click the row — same as replace, in one click.

## Two more buttons

- **Import** — opens a file picker; the file you choose is read and parsed and replaces the current scene.
- The save action that lives near the toolbar — writes the current scene to the on-device store under the root part's name and triggers a download of the same content.

Citation: the panel lives at `src/lib/svelte/details/D_Library.svelte`. The plumbing behind it lives in `src/lib/ts/managers/Scenes.ts`.
