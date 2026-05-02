# Save and load

The app keeps your work safe between sessions automatically. You can also save a snapshot to the library and reload from one.

## Auto-save

Every change you make is saved into the browser's local storage. Close the tab, come back later, and the app reloads exactly where you left off. There is no save button to press for the working scene — the save happens for you.

## Loading from the library

The library panel shows every saved arrangement (both the ones that ship with the app and the ones you have saved yourself). Click a row, then press **replace**, and the chosen arrangement becomes your current scene. The previous working scene is replaced.

For details on the library actions, see [the library page](library.md).

## Saving the current arrangement

Use the save action near the toolbar. The current scene is written into the browser's library under the root part's name, and a copy of the same content is downloaded to your device as a backup.

## Importing a file from disk

The library panel has an **import** button. It opens a file picker; the file you choose is parsed and replaces the current scene.

## Resetting

The reset action erases the working scene and starts from the bundled-with-the-app default. The library is left as it was — only the current working scene is reset.

Citation: the auto-save and library plumbing live in `src/lib/ts/managers/Scenes.ts`.
