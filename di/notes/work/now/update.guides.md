# Update guides

## What is in the guides tree

```text
notes/guides/
├── best.practices.md
├── gotchas.md
├── index.md
├── stipulations.md     ← rules catalog
├── testing.md          ← testing index
├── archives/
│   └── rotation.md     ← historical, leave alone
├── architecture/
│   ├── index.md
│   ├── file layout.md
│   ├── project.md
│   ├── core/           ← algebra, managers, references, versions, launch
│   ├── graph/          ← projection, render, drag, repeaters, etc.
│   ├── theory/         ← spatial, 3D primer
│   └── ui/             ← details, hits, panel layout, style
├── components/         ← Controls, Details, Graph, Hits_3D, Main, Preferences, Separators, Smart_Objects
└── user manual/
    ├── index.md
    └── repeaters.md
```

## What changed in the code that the guides may not reflect

- A selection is now a list, not a single part.
- A click on the drawing area drills through stacked parts. The list is rebuilt every click.
- The click list skips repeater clones and parts whose visibility flag is off.
- The parts table can be re-arranged by dragging rows.
- Formulas have a fourth contextual letter (`c`) for the center of a direction.
- The zoom and guides sliders moved from the drawing area into the toolbar.
- The eye cells for hide-children and visibility now also live next to the name in the collapsed details view.
- The right-side panel refreshes the click-target record on every scroll.
- Clicking a triangle to fold a row that contains the selection now folds AND moves the selection to the folded row.
- Multi-word part names with spaces survive a formula tokenize-and-rebuild round trip.
- File moves: architecture pages now sit under guides; the canvas-stale helper was renamed to a one-word concept name; the parts-tree manager split out of the big stores file.

## Order of work

```text
1. stipulations.md      ← rules catalog (highest stakes)
2. testing.md           ← keep in lock-step with the rules catalog
3. best.practices.md    ← short, sweep-and-verify
4. gotchas.md           ← short; record today's two new gotchas
5. components/Details   ← parts table drag-drop, multi-row, eye cells
6. components/Controls  ← sliders moved into the toolbar
7. architecture/index   ← double-check after recent moves
8. architecture/{file layout, project, core/*, graph/*, ui/*, theory/*}
9. user manual/repeaters ← clones not individually selectable
   (archives/ is historical — leave alone)
```

## How — Plan A: per-guide fix list, walked together

For each guide in turn:

1. Read the file top to bottom.
2. List every line where the wording no longer matches the code, with a one-line proposed fix.
3. Wait for approval.
4. Edit.

No batch rewrites. The fix list per guide must be reviewable before any edit lands.

## How — Plan B: citation-backed sweep, one quick check, then bulk

```text
   ┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
   │ 1. guide #1 │ ─► │ 2. quick     │ ─► │ 3. bulk: rest  │ ─► │ 4. reorient  │
   │   sweep     │    │    check     │    │    of guides   │    │              │
   └─────────────┘    └──────────────┘    └────────────────┘    └──────────────┘
   I do alone         you spot-check     I do alone               we plan deeper
                      three citations                             rewrites if any
```

### The rule that runs through everything: every edit needs a pointer

For every edit I make, I record three lines in a log:

- The old wording (or "new section" if I'm adding).
- The new wording.
- A pointer into the code that proves the new wording is right (file plus line).

If I cannot point to the code, I do not make the edit. It goes on the deeper-rewrite list instead.

The deeper-rewrite list has two kinds:

- **Wrong, needs your judgment to fix.**
- **Right, but the shape no longer fits.**

### Step 1 — sweep guide #1 (I do alone)

I pick a low-stakes guide first (gotchas or best practices). I work top to bottom under the citation rule. I produce the citation log.

### Step 2 — quick check (together)

You spot-check three random citations and read the new wording. If the citations point where I said and the wording reads right, we move on. If not, we adjust before I touch the rest.

### Step 3 — bulk sweep, remaining eight guides (I do alone)

Same citation rule across all eight. I produce one citation log per guide. The docs build runs at the end as a safety net for link errors.

### Step 4 — reorient (together)

After the bulk pass we look at the deeper-rewrite list across all nine guides and decide what gets a real pass next. Each of those gets the per-guide fix-list step from Plan A.

## Recommendation

Plan B. The citation rule makes each edit auditable on its own. The one quick check after the first guide catches any cross-guide pattern I might be repeating wrong. The bulk pass is fast because the audit is the citation log, not a re-read.

## Action -- Plan B -- step 1 -- Sweep log

### gotchas.md — no edits

I read it. Under the citation rule there is nothing to edit. The file is generic Svelte advice with examples drawn from another project; none of its claims are about di's code, so there is nothing to verify against di's code.

### best.practices.md

#### Edits I would make (with citations)

1. Line 88, paragraph under "Shared State."
    - Old: "**Our choice:** Not yet needed. State lives in Main.svelte for now."
    - New: "**Our choice:** State now lives in dedicated manager files — selection, parts, scenes, history, preferences, status, stores, versions."
    - Proof: src/lib/ts/managers/ contains Selection.ts, Parts.ts, Scenes.ts, History.ts, Preferences.ts, Status.ts, Stores.ts, Versions.ts — eight separate managers.

2. Lines 124-131, the component-tree diagram.
    - Old:

        ```text
        App.svelte (global styles)
        └── Main.svelte (layout + state + children)
            ├── Controls.svelte
            ├── Details.svelte
            └── Graph.svelte
        ```

    - New:

        ```text
        App.svelte (global styles)
        └── Main.svelte (layout + children)
            ├── Controls.svelte
            ├── Details.svelte
            ├── Graph.svelte
            └── BuildNotes.svelte
        ```

    - Proof: src/lib/svelte/main/Main.svelte lines 3-8 import Details, BuildNotes, Controls, Graph.

#### Left for a deeper rewrite (right-but-shape-no-longer-fits)

- Line 66, "**Our choice:** We tried snippets, then removed them..." — the wording is correct in its original context (snippet-based Panel layout was removed) but Controls.svelte now uses snippets heavily for content blocks, which makes the sentence read as if the project shuns snippets. Worth a small rewrite for clarity, needs a sentence-level judgment call.

#### Edits I considered and rejected

- Line 105, "Graph.svelte uses ResizeObserver" — verified still accurate (Graph.svelte:132 uses ResizeObserver). No change.

### Questions to be answered before we proceed

1. **gotchas.md is generic Svelte advice with examples from another project.** Should it stay generic (do nothing), get a one-line preface that says so, or grow new examples drawn from di's recent Svelte work?

2. **The "we removed snippets" sentence in best.practices.md** is correct in its narrow context (snippet-based Panel) but reads as if the project shuns snippets — yet snippets are used heavily in the toolbar component. Do you want it reworded now (and how), or left for a later pass?

3. **Recent di-specific gotchas** worth recording: the auto-reveal effect undoing user collapses; the click-stack accidentally treating templates as clones because of registration order. Should these go into gotchas.md now, or wait until the deeper-rewrite step?

4. **Should the component-tree diagram include Status_Strip and BuildNotes?** Status_Strip is rendered inside Graph, so it could be nested or omitted. BuildNotes is a sibling of the three main components. Or keep the diagram showing only the three main regions and treat the rest as inside.

5. **For the high-stakes guides (rules catalog and testing index), should I verify the rule count and the test count from a fresh test run before I touch them?** Running the test suite gives the authoritative count; without it I would have to leave the existing numbers untouched even if they have drifted.

#### answers

1. only keep relevant stuff
2. "we use snippets"
3. insignificant gotchas, discard
4. yes
5. no, i will rewrite stips and testing

### Decisions

- **gotchas.md:** discard. The file is 100% from another project. Delete it from the guides tree.
- **best.practices.md, snippets line:** rewrite as "we use snippets where they help; we do not use them as a layout tool."
- **gotchas from this session:** Discard file. They are not significant.
- **Component tree diagrams:** the top-level layout diagram shows all four child components and notes that the status strip lives inside the graph component. Smaller diagrams in other guides show only the components relevant to that guide.
- **rules catalog and testing index:** You added update instructions to them. They are now a core aspect of development and need to be discussed in workflow and briefly here
- **Lint warnings:** fix every one by hand in every guide I touch. No config relaxations, no skipping, no need for approval.
- **No guessing on guide content.** Every claim in every guide must be backed by evidence in the code I can point to. Pages I cannot fully verify are flagged for a deeper pass — not silently called "clean." A skim that does not check each claim is a guess and is forbidden.
- **List items are numbered, not bulleted.** When listing answers or items in update notes (and in this document going forward), use `1.`, `2.`, `3.` instead of `-`.

## Action -- Plan B -- step 3 -- Bulk sweep

### gotchas.md — deleted

Per decision. Inbound references in [guides/index.md](../../guides/index.md) and [map.md](../../guides/project/main/map.md) updated to remove the entry.

### best.practices.md — lint cleanup applied

Step 1's content edits were already applied. Step 3 added the lint fixes:

- Two table headers re-padded so the column pipes align (the runes table at the top, the composition-decisions table further down).
- Four code-fenced examples had their tab indents replaced with four spaces.
- The "Applied:" list was given a blank line before it.

No new content edits in step 3. Still flagged for deeper rewrite from step 1: the Snippets-vs-Slots wording.

### components/Details.md — file path fixed; rest flagged

Citation-backed edit applied:

1. Line 7, file location.
    - Old: `src/lib/svelte/layout/Details.svelte`
    - New: `src/lib/svelte/details/Details.svelte`
    - Proof: src/lib/svelte/details/Details.svelte exists; no `layout/` folder under svelte.

Flagged for deeper rewrite: the rest of the file describes the component as a placeholder with no props, no state, and a "Future" list drawn from another project. The current details panel has live behavior (preferences, library, parts panels; scroll-driven hit refresh; eye cells; multi-row highlight). A real rewrite is needed.

### components/Controls.md — file path fixed; rest flagged

Citation-backed edit applied:

1. Line 7, file location.
    - Old: `src/lib/svelte/layout/Controls.svelte`
    - New: `src/lib/svelte/main/Controls.svelte`
    - Proof: src/lib/svelte/main/Controls.svelte exists.

Flagged for deeper rewrite: the page describes the component as having a single `title` prop and being a placeholder; the actual toolbar has face buttons, mode buttons, two sliders, the hamburger, and three responsive layouts.

### components/Graph.md — file path fixed

Citation-backed edit applied:

1. Line 7, file location.
    - Old: `src/lib/svelte/layout/Graph.svelte`
    - New: `src/lib/svelte/main/Graph.svelte`
    - Proof: src/lib/svelte/main/Graph.svelte exists.

Flagged for deeper rewrite: the page does not yet mention the breadcrumbs row, the editing-input overlays for dimensions, angles, and face labels, or the status strip.

### components/Main.md — file path fixed

Citation-backed edit applied:

1. Line 7, file location.
    - Old: `src/lib/svelte/layout/Main.svelte`
    - New: `src/lib/svelte/main/Main.svelte`
    - Proof: src/lib/svelte/main/Main.svelte exists.

Flagged for deeper rewrite: the page does not yet describe the BuildNotes child or the wrap-phone responsive behavior.

### components/Hits_3D.md — file path fixed

Citation-backed edit applied:

1. Line 7, file location.
    - Old: `src/lib/ts/managers/Hits_3D.ts`
    - New: `src/lib/ts/events/Hits_3D.ts`
    - Proof: src/lib/ts/events/Hits_3D.ts exists.

Flagged for deeper rewrite: the page predates the drill-down rule, the visibility-and-clone filter, and the multi-selection list.

### components/Preferences.md, Separators.md, Smart_Objects.md — not opened

Skipped. No path errors detected. Content drift status unknown without a read pass.

### user manual/repeaters.md — section added

Citation-backed edit applied:

1. New section "Selecting clones" appended at the end.
    - New text: "Only the master (the first sibling) can be hovered or clicked. The other repeated copies are derived from it — they are skipped in the click stack and do not appear as rows in the parts table. To change a property on every copy, edit the master."
    - Proof: src/lib/ts/events/Hits_3D.ts:185-189 — the `is_repeater_clone` helper makes the click stack skip clones; the parts table's `is_clone` filter drops them from visible rows.

### architecture/file layout.md — full rewrite

Replaced the directory tree and the per-folder tables with the current src/ structure. The old tree referenced folders that no longer exist (signals, state, draw under ts) and listed files that have moved or been renamed. The rewrite walks the filesystem listing top to bottom: svelte/details, svelte/main, svelte/mouse; ts/algebra, common, editors, events, managers, render, runtime, tests, types, utilities. Every per-file bullet has a short description.

The per-folder tables were converted from pipe tables to bullet lists, which keep alignment regardless of description length.

Proof: the filesystem walk under src/ — every folder and file mentioned in the new tree exists; nothing in the new tree is invented.

### architecture/index.md — already current

Earlier today I fixed the broken links. Content reads cleanly against the current src tree. No new edits.

### architecture/project.md, core/*, graph/*, ui/*, theory/* — not visited in step 3

Reading them is a separate pass.

### Summary

Edits applied: file deletion, four file-path fixes across the components folder, two inbound-reference fixes, lint cleanup on best.practices.md, one new section in the repeaters user-manual page.

Files flagged for a deeper rewrite where the content is structurally out of date but I am not confident enough to make sentence-level changes alone: components/Details, components/Controls, components/Graph, components/Main, components/Hits_3D, architecture/file layout. The other component pages and the architecture sub-pages were not opened in step 3.

The docs build was not re-run; the link fixes from earlier today already cleared it.

## Full Rewrite proposal

One short proposal per flagged guide. Each says what the page is wrong about today, what the rewrite would cover, and what code I would cite.

### components/Details.md

**Wrong about:** the page calls the panel a placeholder with no props and no state. The actual panel renders three folding sections (preferences, library, parts), refreshes the click-target record on every scroll, and hosts a pile of sub-components.

**Rewrite would cover:** what the panel shows; how the three sections collapse and expand; the eye cells in the collapsed view; the wrap-phone responsive width; the scroll-driven hit refresh.

**Citations:** the component file in details/, plus the sub-components (preferences, library, parts) in the same folder.

### components/Controls.md

**Wrong about:** describes a single title prop and a placeholder. Today it is the toolbar — face buttons, view-mode toggle, decoration toggles, the zoom and guides sliders, the hamburger, the save button, the editing-lock button, three responsive layouts (phone, mobile, desktop).

**Rewrite would cover:** every clickable in the toolbar; the three layout breakpoints; the slider behavior; how the layout reflows.

**Citations:** the toolbar file in main/, plus the constants file for the breakpoints.

### components/Graph.md

**Wrong about:** the page describes the canvas as a simple WebGL host. The actual graph component carries the breadcrumb trail, three text-input overlays for editing dimensions / angles / face labels, the status strip, and the keyboard handlers for value commits.

**Rewrite would cover:** the breadcrumb trail; the three editing overlays and what triggers each; where the status strip lives; the resize observer that keeps the canvas buffer in sync with the container.

**Citations:** the graph component in main/, plus the editor files for dimensions, angles, and face labels.

### components/Main.md

**Wrong about:** the layout description is missing the build-notes child component, the wrap-phone responsive behavior, and the way the details panel width is computed from the viewport.

**Rewrite would cover:** the four child components; the responsive breakpoints; how the layout reads viewport size; the toggle that shows or hides the details panel.

**Citations:** the main file in main/, plus the constants file for sizes.

### components/Hits_3D.md

**Wrong about:** predates the drill-down rule, the click stack that excludes clones and invisible parts, and the list-shaped selection model.

**Rewrite would cover:** how a click on the canvas builds a list of every part it lands on; the front-to-back order and the wrap rule; the filter that skips clones and invisible parts; the clipped-corner test that gives the selected part priority for resize handles; how the click stack interacts with the multi-selection list.

**Citations:** the hit-test file in events/, plus the selection module in managers/.

### components/Preferences.md, Separators.md, Smart_Objects.md

**Not opened in step 3.** Status unknown. The proposal here is to read each one and produce its own fix list before any rewrite.

### architecture/project.md

**Not opened in step 3.** Likely needs verification of file paths and a check that the described entry flow still matches the current main and main-svelte components. The proposal is to read it and produce a fix list.

### architecture/core/*, graph/*, ui/*, theory/* sub-pages

**Not opened in step 3.** Each sub-page may or may not be drifted. The proposal is a per-page read pass: identify file-path drift first (the cheap pass) and content drift second (the expensive pass).

### Suggested order for the rewrites

1. components/Hits_3D — highest impact since the click rule is core to the user experience and the page is the most stale.
2. components/Controls — toolbar is what the user sees first.
3. components/Details — panel is the second thing the user sees.
4. components/Graph — the canvas page; affects everyone who edits in 3D.
5. components/Main — short, mostly mechanical.
6. The three unopened component pages — quick read pass each.
7. architecture/project and the four sub-page folders — read pass first, then per-page rewrites.

## Deeper rewrites — in progress

### components/Hits_3D.md — full rewrite done

Replaced the page with the current shape of the module. The page now describes:

- What the module owns (the registered parts list, the projected-vertex cache, the hover, the pick-up radii) and what it does not (the selection, which lives in the selection manager).
- The click priority order: dimension labels, angle labels, corners/edges of the selected part, then face hits.
- The fresh-each-click list of every part the click landed on, with the skip rules (root, invisible, repeater clones, bounding-box quick-reject).
- The drill-down rule: pick the part after the current selection, or front-most if nothing matches.
- Auto face-flip on rotation.
- Hover wiring.
- The result shape.
- The per-frame data flow between engine, renderer, and this module.
- Related files.

Citations: every claim is backed by a specific section of `src/lib/ts/events/Hits_3D.ts` plus `src/lib/ts/managers/Selection.ts` for the selection-read direction.

### components/Controls.md — full rewrite done

Replaced the placeholder page with the actual toolbar description: every clickable in the toolbar (hamburger, save, edit-lock, fit, face buttons, straighten, magnet, view-mode, solid-or-x-ray, three decoration toggles, guides slider, zoom slider), the three responsive layouts at the seven-hundred-twenty and fourteen-hundred pixel breakpoints, the click-target registration scheme, and the CSS shape.

Citations: `src/lib/svelte/main/Controls.svelte` (the component itself), `src/lib/ts/common/Constants.ts` lines 86-87 (the breakpoints), `src/lib/ts/managers/Stores.ts` (the subscribed values), `src/lib/ts/render/Engine.ts` (the engine methods called by buttons).

### components/Details.md — full rewrite done

Replaced the placeholder page. The new page describes the three folding sections (preferences, library, parts), the per-section action buttons (factory reset, reinstall, plus-buttons), the folding wrapper, the scroll-driven click-target refresh, the resize observer that refreshes on size change, and the mount-time refresh.

Citations: `src/lib/svelte/details/Details.svelte` (line 29 for the scroll handler), `src/lib/svelte/details/Hideable.svelte` (line 33 for the resize observer), and the three sub-panel files.

### components/Graph.md — full rewrite done

Replaced the placeholder page. The new page describes everything that floats over the canvas (breadcrumbs, build button, status strip, three editing-input overlays for dimension, angle, and face-label edits), the resize observer wiring, the initialization handoff to the engine, and the breadcrumb-trail derivation from the selection.

Citations: `src/lib/svelte/main/Graph.svelte` (the component itself), the three editor files in `src/lib/ts/editors/`, the status strip component, and the selection manager.

### components/Main.md — full rewrite done

Replaced the placeholder page. The new page describes the two states (normal layout vs. build-notes overlay), the four child components (toolbar, side panel, drawing area, build-notes overlay), the size computation for each region, the responsive width logic at the seven-hundred-twenty pixel breakpoint, and the events-manager bootstrap on mount.

Citations: `src/lib/svelte/main/Main.svelte` (the component itself), `src/lib/ts/common/Constants.ts` (the layout constants), `src/lib/ts/managers/Stores.ts` (the side-panel-open flag), `src/lib/ts/events/Events.ts` (the events bootstrap).

### components/Preferences.md — full rewrite done

Replaced the page with the current shape of the local-storage wrapper. Lists the four basic operations (read, write, remove, clear), the two extra operations (reset and dump), the two store-builders (persistent and persistent_set), the full set of stored value names from the enum, the storage prefix, and the read-failure behavior.

Citation: `src/lib/ts/managers/Preferences.ts` lines 11-60 (the enum) and the four operation methods.

### components/Separators.md — full rewrite done

Replaced the page (which described an outdated flares design and a stale hit-target registration scheme) with the actual current separator: a flat bar in the accent color with four corner-fillet arcs at its ends, available in two sizes (content and main), with an optional spacer mode. The current component does not register itself as a clickable target.

Citation: `src/lib/svelte/mouse/Separator.svelte` (the component itself), `src/lib/ts/common/Constants.ts` (sizes and radii).

### components/Smart_Objects.md — full rewrite done

Replaced the page (which described the part as a thin wrapper around the scene entry) with the current shape: three Axis instances (each with start, length, end, and an invariant marker), the rotation order, the optional repeater configuration, the visibility and hide-children flags, the bounds-as-offsets storage convention, the bounds get-and-set helpers, the canvas-out-of-date callback on every write, the attributes-by-name accessor, and the repeater behavior.

Citations: `src/lib/ts/runtime/Smart_Object.ts` (the class itself), `src/lib/ts/runtime/Axis.ts` (the direction shape), and the related files.

### architecture/project.md — full rewrite done

Replaced the page with the current entry-flow tree (App → Main → Controls + Details + Graph + BuildNotes), the core render loop with the current phase order (project, face fills, occluder index, intersection lines, edges, overlays), the parts model (three directions with start, length, end, center, invariant), the engine's responsibilities, the matrix list, the selection-as-a-list model, and pointers to the algebra and Hits_3D pages for deeper dives.

Citations: `src/lib/svelte/main/Main.svelte`, `src/lib/ts/render/Engine.ts`, `src/lib/ts/render/Render.ts`, `src/lib/ts/runtime/Smart_Object.ts`, `src/lib/ts/managers/Selection.ts`.

### architecture/core/managers.md — full rewrite done

Replaced the page (which listed long-gone managers like Components, Editor, and the canvas-side managers) with the current set of eight singletons in `src/lib/ts/managers/` (history, parts, preferences, scenes, selection, status, stores, versions), what each owns, the dependencies between them, and a clear note about which orchestrators live elsewhere (renderer, engine, camera under render/; events under events/; editors under editors/).

Citations: filesystem listing of `src/lib/ts/managers/`, `Selection.ts`, `Parts.ts` lines 144-163, `Preferences.ts` lines 132-143.

### architecture/core/launch.md — already current

Read it; the two-phase load pattern (build then cascade), the post-propagate hook for repeater sync, and the engine-construction reactive hooks are still accurately described. No edits.

### architecture/core/references.md — left alone (design discussion)

This file is design-stage thinking about library object versioning. No claims about current code. Left as-is.

### architecture/core/versions.md — version updates applied

Bumped `CURRENT_VERSION` from 7 to 9. Added the v6,7 → v8 migration step (repeater config refactor: `run_axis`, `rise_axis`, `is_diagonal`, `is_repeating`). Added the v8 → v9 migration step (rename `constants` → `givens`). Updated the "what happens to a v1 file today" walkthrough to include both new steps.

Citation: `src/lib/ts/managers/Versions.ts` line 6 (CURRENT_VERSION) and lines 119-139 (v8 and v9 migration code).

### architecture/ui/details.md — full rewrite done

Replaced the page (which referenced a non-existent `D_Selection.svelte` and an outdated bounds-table description) with the current architecture-level view: file structure, naming convention (`D_` for top-level details panes, `P_` for sub-panes inside the parts pane), the folding mechanism, click-target lifecycle (scroll refresh and resize observer), the banner-zone styling, and per-section content. Pointed at the user-level Details component page for the surface description.

Citation: `src/lib/svelte/details/` directory listing, `Details.svelte` line 29 (scroll handler), `Hideable.svelte` line 33 (resize observer).

### architecture/ui/hits.md — targeted fixes

Two updates:

- The data-flow diagram referenced `hits.handle_click_at` — the actual method is `handle_s_mouse_at`. Renamed.
- The Hit-Target Type Getters section listed methods like `isAControl`, `isAWidget`, `isRing`, `isADot` and enum values like `button`, `widget`, `title`, `ring`, `paging`, `dot`. None of those exist today. The current enum has only three values: control, banner, graph. Replaced the table with an accurate three-bullet list.

Citation: `src/lib/ts/events/Hits.ts` line 62 (the method name), `src/lib/ts/types/Enumerations.ts` lines 3-7 (the enum).

### architecture/ui/panel.layout.md — full rewrite done

Replaced the page (which described a non-existent `Panel.svelte` snippet-based component, a `Box.svelte` and `Fillets.svelte` that have been removed, and outdated CSS variables) with the current shape: the four regions, the build-notes overlay, the DOM tree, the region styling, the size derivation from the constants module, the reactive state, and a "what changed from earlier designs" note that explicitly retires the removed components.

Citation: `src/lib/svelte/main/Main.svelte` lines 19-33 and 46-97.

### architecture/ui/style.md — already current

CSS conventions and design-token flow. Read it; the patterns described match today's codebase. No edits.

### architecture/graph/repeaters.md — targeted fixes

Two updates:

- The data-model table was missing `rise_axis` (the diagonal stair axis) and used the older field-table format that lint flagged. Converted to a bullet list and added `rise_axis`.
- One sentence used the old field name `gap_axis !== repeat_axis`. Updated to "rise axis differs from the run axis."

Citation: `src/lib/ts/render/Engine.ts` (the `sync_repeater` helper), `src/lib/ts/types/Interfaces.ts` (the Repeater interface).

### architecture/core/index.md, graph/index.md, theory/index.md, ui/index.md — already current

These four index files are simple tables of contents pointing at the sub-pages in their folders. All links resolve. No edits.

### architecture/graph/rendering.types.md — targeted fixes

The `O_Scene` interface block in this page listed the wrong fields. The current shape carries a `so` back-reference to the part (where vertices and orientation actually live) instead of holding `vertices`, `orientation`, and `scale` directly. Replaced the code block, the field list, and the closing note.

Citation: `src/lib/ts/types/Interfaces.ts` — `interface O_Scene { edges, faces?, parent?, so, position, color, id }`.

### architecture/graph/three.dimensions.md — line-count touch-ups

The page's approximate line counts for two big files had drifted: Engine.ts shown as 480 (actual ≈ 1600), Render.ts shown as 1200 (actual ≈ 2500). Both updated. Other line counts on the page were close enough to leave alone.

Citation: `wc -l` on the render folder.

### architecture/graph/axes.md — verified, one wording fix

Every named method and type in the page was checked against the code: the swap helpers (`swap_axes`, `swap_attr_aliases`, `build_alias_swap_map`, `build_object_swap_map`), the root-rotate helper (`rotate_root_90`), the angle setter (`touch_axis`), the angle-rect type (`Angle_Rect`), and the rendering hooks (`angular_rects`, `render_angulars`, `render_angular`). All present at the cited locations.

One small wording fix: the page said the angular render functions live in Render.ts; they were extracted to R_Angulars.ts. Render.ts holds the rects array and calls the extracted functions.

### architecture/graph/dimensionals.md — verified, no edits

The named function (`render_dimensions`), the host interface (`DimensionHost`), the dimension-rects array, the draw helper (`draw_dimension_3d`), and the three pixel constants (`gap_px = 4`, `dist_px = 20`, `ext_px = 8`) all present in `R_Dimensions.ts` at the lines and shapes the page describes. The file is 399 lines, page says ~400. Algorithm A / B / C are conceptual labels; the descriptions match the code structure.

### architecture/graph/drag.md — verified, no edits

The page is bug-fix history. Three concrete claims were checked: the closest-edge picker (`test_edges` in Hits_3D), the drag-target guard (`drag.has_target` in Hits.ts), and the document-level mouseup listener (Events_3D.ts). All present.

### architecture/graph/intersecting.faces.md — verified, table fixed

The three core methods (`render_intersections`, `intersect_face_pair`, the clip-to-quad helper) all exist in Render.ts. The page's per-method line numbers had drifted (210, 266, 338 — actual locations are different now), and two helpers in the table (`shares_all_axes`, `draw_seg_world`) no longer exist as separate methods. Replaced the line-number table with a short bullet list of the surviving methods.

### architecture/graph/projection.md — verified, no edits

The two named pieces (`camera_view_extent` and `Engine.fit_to_children`) are present at the cited shapes: a transient field on the renderer that recomputes per tick, and an explicit-intent helper on the engine.

### architecture/graph/quaternions.md — verified, no edits

Just a redirect to the axes page. The redirect target exists.

### architecture/graph/render.md — verified, no edits

A high-level pipeline walkthrough. Phase order, occluder-index purpose, intersection-line and edge-clipping behavior, and the facet tracer's role all match what the renderer does. No specific method-name or file-path claims to verify.

### architecture/graph/two.dimensions.md — verified, one removal

All 2D-related symbols on the engine and renderer were checked: `toggle_view_mode`, `straighten`, `FACE_SNAP_QUATS`, `tick_snap_animation`, `scratch_orientation`, `snapped_orientation`, `snap_anim`, `saved_3d_orientation`, `set_ortho` — all present.

One stale reference removed: the page listed `rotate_2d()` as a method in Engine.ts. There is no method by that name. The 2D drag-rotation runs inside the animation tick. Page updated.

The dimension-rendering symbols (`find_best_edge_for_axis`, `render_axis_dimension`, `face_axes`, `face_normal`, `face_fixed_axis`, `FACE_NORMALS`) are all present at the cited shapes.

### architecture/theory/3D.primer.md — verified, no edits

Conceptual material on quaternions, world-vs-screen `t`, perspective projection. No code-level claims to verify; the concepts described match the project's general approach.

### architecture/theory/spatial.md — verified, plan marked done

The "Plan" section had four unchecked boxes for adopting the flatbush spatial index. The renderer now imports flatbush and rebuilds the index every frame. Marked all four boxes done and added a short note pointing at the code.

Citation: `src/lib/ts/render/Render.ts` lines 22, 86, 455; `src/lib/ts/render/Topology.ts` line 25.

## Action — relevance and placement

Six follow-ups picked from the relevance audit:

1. archives/rotation.md — keep as-is.
2. architecture/graph/quaternions.md — deleted. The page was a one-line redirect to axes; inbound links from architecture/index, architecture/graph/index, and map were updated.
3. architecture/core/references.md — moved to a new research folder and renamed to `library-versioning.md`. The library-versioning topic is design discussion, not core architecture.
4. architecture/theory/spatial.md — moved to the same research folder, renamed to `spatial-acceleration.md`. Research notes that informed the implemented flatbush adoption.
5. architecture/core/launch.md — renamed to `scenes.md`. The page is about scene loading, not app launch. The title inside the file was updated to match.
6. New folder `guides/research/` created with its own index, listing the two pages above. The top-level guides index now points at the research folder alongside architecture, components, and user-manual.

## Action — research folder consolidation

A second pass on the research arrangement:

1. The architecture-theory folder was renamed to architecture-research.
2. The two pages that had been moved into the top-level research folder (the library-versioning design notes and the spatial-acceleration research notes) were moved into architecture-research alongside the 3D primer.
3. The top-level research folder was deleted.
4. The architecture-research index was rewritten to list all three pages with one-line descriptions.
5. The top-level guides index now points the Research entry at architecture-research.
6. The architecture index was rewritten to fix lint issues (heading blank lines, list indentation, the "Theory" entry replaced by "Research") and to list every page in each section with a one-line description.

## Action — project folder consolidation

A new top-level folder `guides/project/` was created. Five pages moved into it:

1. `file layout.md` (was at `guides/architecture/`)
2. `project.md` (was at `guides/architecture/`)
3. `best.practices.md` (was at `guides/`)
4. `stipulations.md` (was at `guides/`)
5. `testing.md` (was at `guides/`)

The new folder has its own index listing all five pages with one-line descriptions.

Inbound references were updated so the docs build stays green:

- The guides top-level index now points its first entry at the project folder.
- The architecture index's first section now points at the project folder for orientation, and the architecture-only contents list dropped the file-layout and project entries.
- Three relative links inside the project page (to algebra, three-dimensions, managers) were rewritten to climb out of project/ and into architecture/.
- Many references inside the work-handoff to the old guides/stipulations and guides/testing paths were rewritten to the new guides/project/ paths.
- The map page was left as-is for the file-paths that still match its older shape; a deeper rewrite of the map is its own separate task.

The docs build is green after every move and rename in this session.

## Action — project folder renamed to main

The folder created in the previous action was renamed from `project` to `main`. Inbound references updated:

1. The guides top-level index entry now reads "Main" and points at `./main/`.
2. The architecture index's first-section pointer now points at `../main/`.
3. The handoff's many references to `../../guides/project/stipulations.md` and `../../guides/project/testing.md` were rewritten to `../../guides/main/stipulations.md` and `../../guides/main/testing.md`.
4. The folder's own index page title was changed from "Project" to "Main."

The file inside the folder named `project.md` was left as-is — it is the file about the project's shape, not a redundant alias of the folder name.

Docs build still green.

## Action — top-level project folder reshape

Three folders inside guides moved into a new top-level `guides/project/`:

1. The `main` folder (file layout, project page, best practices, stipulations, testing) moved to `guides/project/main/`.
2. The `components` folder moved to `guides/project/components/`.
3. The `user manual` folder moved to `guides/project/user manual/`.

The map page at `notes/map.md` moved into `guides/project/main/map.md`. It now lives alongside the file layout and the project description, where it belongs.

A new `guides/project/index.md` was created that lists the three sub-folders. The main index inside that folder picks up a new entry for the map page.

Inbound references updated:

- The top-level notes index entry for the map points at the new map location.
- The top-level notes index now lists Project as a separate entry; the older Components and User Manual entries point into the new project sub-folder.
- The guides index drops Components and User Manual as separate entries; everything sits under Project now.
- The work-handoff's many references to the old paths under guides/main/ were rewritten to guides/project/main/.
- The repeaters milestone's link to the user-manual repeaters page was rewritten to the new path.

Docs build still green after every move.
