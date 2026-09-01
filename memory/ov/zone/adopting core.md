---
kind: howto
title: "Adopting core"
description: "The ov-adopts-core journey collated into one telling, for the next host project."
tags: [now, weighed]
date: 2026-08-31
---
# Adopting core

Collated from core's design, the decisions, and the cases — one telling for the next host. Later this file moves into core's truth/.

## what is core?

A library with no entry point: four ts folders (common, events, types, utilities), each behind an index.ts barrel, and eight support components. It holds no state — no preferences, no managers, no app. A host keeps the state, wires it in, and draws the app around it. core principle: state lives in the host, behavior in core; anything in core reaching for a manager is a bug.

## the wiring — two lines

A path alias, not a package and not copies:

- tsconfig.json: `"core/*": ["../core/src/lib/*"]` under paths
- vite.config.ts: `resolve.alias: { core: path.resolve(__dirname, '../core/src/lib') }`

tsc proves the first line; `yarn dev` proves the second. Dependencies stay in one pile at mono's root.

## the adoptions — one file

Everything the host adopts lives in one file, `src/lib/ts/common/Core.ts`, one line per adoption:

```ts
import 'core/ts/common/Extensions';
export { default, k } from 'core/ts/common/Constants';
export { c } from 'core/ts/common/Configuration';
export { Colors, colors } from 'core/ts/utilities/Colors';
```

Every host file imports from `common/Core`; only Core.ts reaches through the alias. The criterion for what goes in is *adopted from core*, never *small* — a host's own small file keeps its own name. The day the host disagrees with a constant, the re-export grows into a spread: import core's k, spread it, override the one value; a touched group is spread too, or its other members vanish.

## the host's debt

core's Colors starts at defaults and remembers nothing. The host pays at startup (main.ts): read each remembered color from its own preferences into core's stores, then subscribe and write changes back. Configuration is called once at startup, before anything draws — it pushes the constants and inks onto the page.

## the lessons, each paid for

- **A adoption is never a copy.** ov's Extensions.ts was core's verbatim and both ran; the second define() on String.prototype crashed the app. A side-effect module rides Core.ts as a bare import; every other duplicate is a drift waiting to happen (Debug.ts and Dirty.ts still are).
- **A dependency cycle obeys entry order.** Colors -> common barrel -> Configuration -> utilities barrel -> Colors: whoever enters the cycle first finishes last, so line order in Core.ts decided whether the app threw. The cut that works is at Colors' end — import the file (`../common/Dirty`), not the barrel that drags Configuration in.
- **Same-folder imports stay direct; cross-folder goes through barrels** — inside core. A host never imports core's barrels or files directly; it imports its own Core.ts.

## the steps, for the next host

1. Add the two alias lines; prove with tsc, then yarn dev.
2. Create common/Core.ts with the adoptions, one line each.
3. Delete every file of yours that a adoption replaces — no copies survive.
4. Point all your imports at common/Core.
5. Pay the host's debt in main.ts: remembered state in, changes back.

## files to change

- [x] constants
- [x] configuration
- [x] colors
- [x] extensions

### core file is identical to ov

Thirteen files. Each is a second instance running beside core's, which is the Extensions crash waiting to happen again.

- [ ] ts/common/Debug.ts
- [ ] ts/common/Dirty.ts
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

- [ ] svelte/support/Section.svelte
- [ ] svelte/support/Separator.svelte
- [ ] svelte/support/Steppers.svelte
- [ ] svelte/support/ToolTip.svelte
- [ ] ts/events/Hit_Target.ts
- [ ] ts/events/Hits.ts
- [ ] ts/events/Mouse_Timer.ts
- [ ] ts/events/S_Hit_Target.ts
- [ ] ts/types/Angle.ts
- [ ] ts/types/Coordinates.ts
- [ ] ts/utilities/SVG_Paths.ts
- [ ] ts/utilities/Sectioning.ts
- [ ] ts/utilities/Separator_Spacing.ts
- [ ] ts/utilities/Stepping.ts
- [ ] ts/utilities/Tooltip.ts
- [ ] ts/tests/coordinates.test.ts
- [ ] ts/tests/fitting.test.ts
- [ ] ts/tests/numbers.test.ts
- [ ] ts/tests/sectioning.test.ts
- [ ] ts/tests/sections.test.ts
- [ ] ts/tests/separator_spacing.test.ts
- [ ] ts/tests/smooth_height.test.ts
- [ ] ts/tests/stepping.test.ts
- [ ] ts/tests/svg_paths.test.ts
- [ ] ts/tests/thumb.test.ts

The eleven test files are core's own tests of core's own code. A host that adopts the code has no reason to keep them: core runs them, and ov's run adds nothing but a second place to fix.

### ov is more recent and better than core

Five files where ov's copy is the better one. The adoption runs backwards first: core takes what ov has, and only then does ov delete its copy.

- [ ] ts/types/Stacked.ts — ov adds `hidden`: a section not there at all, whose slot stays so nothing below it shifts
- [ ] svelte/support/Stack.svelte — the whole hidden-section treatment, forty-eight lines: every measurement walks past a hidden section to the next one shown
- [ ] svelte/support/Big_Pill.svelte — which areas are open: ov reads its own remembered value, core takes it as a prop and hands the toggle back. core's is the right one for a library, so this one adopts forward
- [ ] main.css — a row of the list lights instantly in ov, by decision; core's rule covers list rows too
- [ ] ts/types/App.ts — one word of a comment, guides against files

### same name, different folder

Two more, paired by name rather than path — neither is close enough to adopt without a read.

- [ ] Status_Line — core `svelte/support/`, ov `svelte/content/`; 40 lines differ out of 153
- [ ] BuildNotes — core `svelte/support/`, ov `svelte/main/`; 10 lines differ out of 253

### on disk, missing from the map

Not core work. Ten ov files the map has never listed, found while correcting it for the eleven adopted on 31 August 2026. Each wants its own entry written.

1. [ ] svelte/content/D_Repair.svelte
2. [ ] svelte/content/Report.svelte
3. [ ] ts/tests/code_blocks.test.ts
4. [ ] ts/tests/emphasis.test.ts
5. [ ] ts/tests/numbers.test.ts
6. [ ] ts/tests/searching.test.ts
7. [ ] ts/tests/smooth_height.test.ts
8. [ ] ts/tests/svg_paths.test.ts
9. [ ] ts/tests/thumb.test.ts
10. [ ] ts/tests/wiki_links.test.ts
