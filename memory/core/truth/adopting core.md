---
kind: howto
type: reference
title: "Adopting core"
description: "How a host takes core: the wiring, the one file that holds every adoption, what the host owes, and the lessons each paid for."
tags: [incorporated]
use_when: [a project is adopting core, deciding what belongs in core and what in the host]
date: 2026-09-01
---
# Adopting core

Written out of ov's adoption, finished 31 August 2026, for whichever host comes next — lv, s3, di. What ov actually did is at the bottom, file by file; the wiring, the lessons and the steps above it are the part that carries over.

## what is core?

A library with no entry point: four ts folders (common, events, types, utilities), each behind an index.ts barrel, and eight support components. It holds no state — no preferences, no managers, no app. A host keeps the state, wires it in, and draws the app around it. core principle: state lives in the host, behavior in core; anything in core reaching for a manager is a bug.

## the wiring — two lines

A path alias, not a package and not copies:

- tsconfig.json: `"core/*": ["../core/src/lib/*"]` under paths
- vite.config.ts: `resolve.alias: { core: path.resolve(__dirname, '../core/src/lib') }`
- vitest.config.ts: the same alias again

Three files, not two. A standalone `vitest.config.ts` is read in place of `vite.config.ts`, never alongside it, so the alias has to be written there too — without it, every test file that reaches core fails to find it while the app runs fine. Use `import.meta.url` for the folder there: a module-type config has no `__dirname`.

tsc proves the first line, `yarn dev` the second, `yarn test:run` the third. Dependencies stay in one pile at mono's root.

## the adoptions — one file

Everything the host adopts lives in one file, `src/lib/ts/common/Core.ts`, one line per adoption:

```ts
import 'core/ts/common/Extensions';
export { default, k } from 'core/ts/common/Constants';
export { c } from 'core/ts/common/Configuration';
export { Colors, colors } from 'core/ts/utilities/Colors';
```

Every host file imports from `common/Core`; for code, only Core.ts reaches through the alias. The one thing that does not pass through it is the stylesheet: `main.ts` imports `core/main.css` itself, last, after the app and the managers. A stylesheet has no exports to re-export, and where it loads decides which rule wins between two that match equally — through Core.ts it would arrive with whichever file happens to be pulled in first. So the doors are two, and both are named: Core.ts for everything with exports, `main.ts` for the stylesheet alone.

The criterion for what goes in is *adopted from core*, never *small* — a host's own small file keeps its own name. The day the host disagrees with a constant, the re-export grows into a spread: import core's k, spread it, override the one value; a touched group is spread too, or its other members vanish.

## the host's debt

core's Colors starts at defaults and remembers nothing. The host pays at startup (main.ts): read each remembered color from its own preferences into core's stores, then subscribe and write changes back. Configuration is called once at startup, before anything draws — it pushes the constants and inks onto the page.

## the lessons, each paid for

- **A adoption is never a copy.** ov's Extensions.ts was core's verbatim and both ran; the second define() on String.prototype crashed the app. A side-effect module rides Core.ts as a bare import; every other duplicate is a drift waiting to happen (Debug.ts and Dirty.ts still are).
- **A dependency cycle obeys entry order.** Colors -> common barrel -> Configuration -> utilities barrel -> Colors: whoever enters the cycle first finishes last, so line order in Core.ts decided whether the app threw. The cut that works is at Colors' end — import the file (`../common/Dirty`), not the barrel that drags Configuration in.
- **Same-folder imports stay direct; cross-folder goes through barrels** — inside core. A host never imports core's barrels or files directly; it imports its own Core.ts.
- **The host names files, so the ring never opens.** Every line of Core.ts points at one file of core's, never at a folder's barrel — so nothing the host asks for drags Configuration in behind it. That is why Debug and Dirty, both sitting in the folder whose barrel is one link of the ring, cost nothing to take: Debug imports nothing at all, Dirty only svelte's store.
- **Look for the file before believing the plan.** core's `Big_Pill` had never compiled — it reached for three things that live only in ov — and nothing said so until core got its own `tsconfig.json` and `vitest.config.ts`. A library with no way to check itself is a library whose faults wait for its host. Give it both before adopting anything from it.

## the steps, for the next host

1. Add the two alias lines; prove with tsc, then yarn dev.
2. Create common/Core.ts with the adoptions, one line each.
3. Delete every file of yours that a adoption replaces — no copies survive.
4. Point all your imports at common/Core.
5. Pay the host's debt in main.ts: remembered state in, changes back.

---

## files to change

- [x] constants
- [x] configuration
- [x] colors
- [x] extensions

### core file is identical to ov

Thirteen files. Each is a second instance running beside core's, which is the Extensions crash waiting to happen again.

- [x] ts/common/Debug.ts
- [x] ts/common/Dirty.ts
- [x] ts/events/S_Mouse.ts
- [x] ts/types/Action.ts
- [x] ts/types/Details.ts
- [x] ts/types/Hit_Targets.ts
- [x] ts/types/Types.ts
- [x] ts/utilities/Fitting.ts
- [x] ts/utilities/Numbers.ts
- [x] ts/utilities/Sections.ts
- [x] ts/utilities/Smooth_Height.ts
- [x] ts/utilities/Thumb.ts
- [x] ts/tests/runner.test.ts

### identical except the imports

Twenty-five files, core's word for word below the imports; ov reaches for `../common/Core` and a file's own path where core reaches for its barrel. Deleting ov's copy deletes the whole difference.

- [x] svelte/support/Section.svelte
- [x] svelte/support/Separator.svelte
- [x] svelte/support/Steppers.svelte
- [x] svelte/support/ToolTip.svelte
- [x] ts/events/Hit_Target.ts
- [x] ts/events/Hits.ts
- [x] ts/events/Mouse_Timer.ts
- [x] ts/events/S_Hit_Target.ts
- [x] ts/types/Angle.ts
- [x] ts/types/Coordinates.ts
- [x] ts/utilities/SVG_Paths.ts
- [x] ts/utilities/Sectioning.ts
- [x] ts/utilities/Separator_Spacing.ts
- [x] ts/utilities/Stepping.ts
- [x] ts/utilities/Tooltip.ts
- [x] ts/tests/coordinates.test.ts
- [x] ts/tests/fitting.test.ts
- [x] ts/tests/numbers.test.ts
- [x] ts/tests/sectioning.test.ts
- [x] ts/tests/sections.test.ts
- [x] ts/tests/separator_spacing.test.ts
- [x] ts/tests/smooth_height.test.ts
- [x] ts/tests/stepping.test.ts
- [x] ts/tests/svg_paths.test.ts
- [x] ts/tests/thumb.test.ts

The eleven test files are core's own tests of core's own code. A host that adopts the code has no reason to keep them: core runs them, and ov's run adds nothing but a second place to fix.

### ov is more recent and better than core

Five files where ov's copy is the better one. The adoption runs backwards first: core takes what ov has, and only then does ov delete its copy.

- [x] ts/types/Stacked.ts — core took ov's `hidden` field, then ov deleted its copy and takes the type through Core.ts
- [x] svelte/support/Stack.svelte — core took ov's hidden-section treatment, then ov deleted its copy; three call sites take the component through Core.ts
- [x] svelte/support/Big_Pill.svelte — adopted forward, after core's copy was made to compile: `area` is gone from core entirely, and the component now takes `name`, `items`, `shown` and `reads` as plain values. core names none of the host's vocabulary
- [x] main.css — core took ov's version, then ov deleted its copy; main.ts imports `core/main.css`
- [x] ts/types/App.ts — core does not hold it at all. `w_app` says whether the app is still setting up, which is host state; core's copy is deleted and dropped from its types barrel, and ov keeps its own

### same name, different folder

Two more, paired by name rather than path — neither is close enough to adopt without a read.

- [x] Status_Line — adopted forward with no change to core: its copy already took the words, the offer and three things to do as plain props, while ov's reached into its own Status manager. App.svelte now hands all five in
- [x] BuildNotes — core no longer names the host's file: the table's text arrives as a `table` prop, and App hands over the very text it already reads for the build number. One reader of md/builds.md left in ov, where there were two

### on disk, missing from the map

Not core work. Ten ov files the map has never listed, found while correcting it for the eleven adopted on 31 August 2026. Each wants its own entry written.

1. [x] svelte/content/D_Repair.svelte
2. [x] svelte/content/Report.svelte
3. [x] ts/tests/code_blocks.test.ts
4. [x] ts/tests/emphasis.test.ts
5. [x] ts/tests/numbers.test.ts
6. [x] ts/tests/searching.test.ts
7. [x] ts/tests/smooth_height.test.ts
8. [x] ts/tests/svg_paths.test.ts
9. [x] ts/tests/thumb.test.ts
10. [x] ts/tests/wiki_links.test.ts
