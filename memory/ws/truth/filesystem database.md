# Filesystem database

A live, read-only view of one folder on disk, picked with the browser's folder picker. `DB_Filesystem.ts` holds it.

## What it holds

- The folder is opened for reading only, by the picker and again when the saved handle is restored. Nothing in the file writes to disk.
- Its persistence is `none`, so every save path in DB_Common skips it. Anything added in memory, an import included, is gone on refresh: every load rescans the folder.
- The walk goes five folder levels deep. Each entry becomes a thing, each folder-to-entry pair a `contains` relationship, and each previewable file a link trait.

## Names

An entry's id is its whole path, sanitized, plus a hash of the raw path. It was once cut to 50 characters, so deep entries sharing a prefix took one id: relationships outnumbered things, and a child could take an ancestor's id and close a cycle. A changed id scheme resets the saved expanded and recents for this database.

## A missing entry

A folder can vanish between the handle being saved and the walk. The browser then throws NotFoundError on the next read. The walk catches it in `entries_of`: it logs "Skipped the rest of" with the folder's name, skips the rest of that one folder, and goes on, so the load finishes and the graph draws. Unguarded, the error reached the load's timer uncaught and left things remembered but no root ancestry and no focus: a blank graph.

## Debugging

`mono/.vscode/launch.json` holds "ws in chrome". With the dev server running, F5 opens a Chrome window the debugger owns, and breakpoints stop only there. Log flags are set with `?debug=draw,build,focus` on the url, or in the flags array at the end of `Debug.ts`. Output goes to the browser console.
