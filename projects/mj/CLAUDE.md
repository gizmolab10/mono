# mj

> Brought up 1 September 2026. What it is for is not written yet.

## What This Is

A gallery of pictures, live at mj.jonathansand.me. `App.svelte` hosts panel's page and hands it what goes in each region: the edit button in the controls row, the preferences in the details column, the gallery in the operation view. `Main.ts` mounts it, pushes core's sizes onto the page, hands gallery mj's switches and reads the remembered colors in. `Customizations.ts` holds the name, the home page and the prefix remembered values are saved under.

Everything mj takes from core, panel and gallery arrives through `common/Core.ts`, `common/Panel.ts` and `common/Gallery.ts`, and only those files reach through an alias, with `Main.ts` for the stylesheets.

## How to Work Here

READ before proposing. SEARCH before claiming nothing exists.

Structure emerges as needed — don't over-organize early.

## Words

This project's terms live in [memory/mj/](../../memory/mj/) — read them at session start; add none anywhere else.

## Tone

Plain english. Casual. First person. Short sentences. Let ideas breathe.

Past mistakes never to repeat, this project's own, are in `memory/mj/logs/learn.md`, made the day the first one is written. Those that apply everywhere are in `memory/shared/logs/learn.md`.
