# gallery

> Copied whole from lv on 1 September 2026. Since 9 September 2026 a library, with nothing of lv's left in it.

## What This Is

A library two hosts import through the `gallery` alias: lv, whose code this was, and mj. Its page is panel's, imported through `common/Panel.ts`: the edit button in the controls row, the sidebar in the details column, the md file in the operation view, the router's words on the status line. Pages are md files under the host's `src/md`, drawn with Obsidian's syntax. A gallery is one folder of pictures under the host's `src/assets`, shown one at a time, each captioned by the title inside its own file. Editing — a picture added, a caption changed, a file thrown out, a folder reordered — goes through the dev server's plugins here, and through the netlify functions on a published site.

What is gallery's own: `App.svelte` and `Main.ts`, the smallest host of the library, and a sample page and pictures under `src/md` and `src/assets` that the tests read. A host sets gallery's switches in `Customizations.ts` before it mounts — the home page's name, the prefix its remembered values are saved under, whether the sidebar is drawn. gallery reads them only when asked, never while its files load.

What gallery is for beyond this, drag and drop, is not written.

## How to Work Here

READ before proposing. SEARCH before claiming nothing exists.

Structure emerges as needed — don't over-organize early.

No port, and not in the hub, by decision. `yarn dev` here takes whatever vite offers.

## Words

This project's terms live in [memory/gallery/](../memory/gallery/) — read them at session start; add none anywhere else.

## Tone

Plain english. Casual. First person. Short sentences. Let ideas breathe.

Past mistakes never to repeat, this project's own, are in `memory/gallery/logs/learn.md`, made the day the first one is written. Those that apply everywhere are in `memory/shared/logs/learn.md`.
