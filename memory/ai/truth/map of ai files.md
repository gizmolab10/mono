# Map of ai files

ai's files. Update this when files are added, moved, or removed.

## root config

- [vite.config.ts](../../../ai/vite.config.ts) — the dev server (port 5187, read from the hub's ports file) and the build, with the three aliases, core, panel and kb. It also lets the server reach outside this folder, which is what makes the memory files readable at all.
- [vitest.config.ts](../../../ai/vitest.config.ts) — the test runner: anything ending in `.test.ts` under the source folder, and the aliases' third home.
- [svelte.config.js](../../../ai/svelte.config.js), [tsconfig.json](../../../ai/tsconfig.json) — the compiler and type-check settings, the three aliases among them.
- [package.json](../../../ai/package.json) — no dependencies of its own: what the page needs comes through kb. The scripts: check, test, dev and build.
- [index.html](../../../ai/index.html) — the page the app mounts into.
- [CLAUDE.md](../../../ai/CLAUDE.md) — the project entry point.

## plugin.py — the dispatcher's side

- [plugin.py](../../../ai/plugin.py) — the code the dispatcher imports and runs for ai, and for ov until it is retired, since the two share a db: the specialty's name, the listing rule with its lists of projects and work folders, moved whole from the dispatcher at step 6 of the plan, whether one path is listed, and the labels the plugin gives a file, none until step 14. The plugin api table in memory/ov/zone/music and ai.md says what each takes and answers.

## src/lib/svelte/main/ — the frame

- [App.svelte](../../../ai/src/lib/svelte/main/App.svelte) — the host of kb's page: draws Main.svelte and nothing more, until step 5 of the plan hands kb the snippets.

## src/lib/ts/ — logic

- [main.ts](../../../ai/src/lib/ts/main.ts) — the entry point, ov's main.ts doing what a library cannot. Fills kb's facts before anything mounts, the name, the prefix, the host, the hierarchies and the build notes table, then reads the remembered colors into core's stores and writes changes back, pushes the stacking layers, the sizes and the fixed inks onto the page, reads three of them back off the page to prove they arrived, then hangs every guide from the dispatcher's listing before letting the app show itself; it names the order the labels are read in after — the file being edited, then the rows in view from the remembered top row, then the rest. It imports core's stylesheet itself, the one reach through an alias outside the bridges.
- [common/Core.ts](../../../ai/src/lib/ts/common/Core.ts) — everything ai adopts from core, one line each, through the "core" alias: the configuration calls, the sizes, the colors and the log. **⟵core**
- [common/Kb.ts](../../../ai/src/lib/ts/common/Kb.ts) — everything ai imports from kb, one line each, through the "kb" alias: the page, kb's configuration, the files manager, the preferences, the operations and the app's two states. **⟵kb**
- [common/Customizations.ts](../../../ai/src/lib/ts/common/Customizations.ts) — what is true of ai and of no other host, the facts main.ts hands kb: the name, the prefix, the host, the one hierarchy, the folders by name, and since step 7 of the plan the five kinds, the closed list of 39 tags and the ten tag areas.

## src/lib/ts/tests/ — the tests

- [tag_areas.test.ts](../../../ai/src/lib/ts/tests/tag_areas.test.ts) — that the ten areas and the closed tag list agree exactly, what an area offers, and what a shut one reads, ai's lists through kb's functions.
- [core_alias.test.ts](../../../ai/src/lib/ts/tests/core_alias.test.ts) — that only the bridges reach through an alias: Core.ts and main.ts through core, main.ts for the stylesheet alone, Kb.ts through kb, and nothing through panel, whose alias is carried for the build.

## src/lib/ — data

- [md/builds.md](../../../ai/src/lib/md/builds.md) — the build notes table, ov's, handed to kb as the build notes fact.

## src/ other

- [vite-env.d.ts](../../../ai/src/vite-env.d.ts) — the ambient types that let the build's raw-text and address imports type-check.
