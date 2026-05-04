# Update guides

A working file for guide-tree updates. The big sweep is done — every page in the guides tree was checked against the current code and either rewritten or verified, the docs build is green, and the folder layout has settled. The file now plans further passes as new work lands.

## Working rules carried forward

These were decided during the big sweep and still apply.

1. Every claim in every guide must be backed by evidence in the code that can be pointed to. Pages that cannot be fully verified are flagged for a deeper pass — never silently called clean.
2. Lint warnings get fixed by hand in every guide that is touched. No config relaxations, no skipping.
3. List items in working notes are numbered (`1.`, `2.`, `3.`), not bulleted.
4. Component-tree diagrams in guides show all four child components and note that the status strip lives inside the graph component.

## What landed in earlier sessions

Listed compactly so the file reads in a finite time. Folder paths use the layout that landed last.

1. A citation-backed sweep ran across every guide page. Every wording change carried a code pointer. Pages that could not be fully verified were flagged for a deeper pass instead of being silently called clean.
2. The generic-Svelte-advice page was deleted (was lifted from another project, none of its claims were about this code).
3. Eight component pages were rewritten against the current code: the three-dimensional hit tester, the toolbar, the side panel, the root layout, the local-storage wrapper, the visual divider, the part data shape, and the drawing-area page. The architecture project page, the managers page, the side-panel architecture page, and the panel-layout page were also rewritten.
4. The version-migration page was updated through the latest two migration steps.
5. Targeted fixes landed on the click-and-hover dispatch page, the repeaters page, the rendering-types page, the three-dimensions render page, the axes page, the intersecting-faces page, the two-dimensions page, and the spatial-acceleration research page.
6. Folder reshape landed in stages. The theory folder became research. The launch page was renamed to the scenes page. The library-versioning notes moved from core into research. The quaternions redirect page was deleted. The archives folder was left as-is.
7. The top-level shape settled at `guides/architecture/`, `guides/project/overview/`, `guides/project/user manual/`, `guides/project/research/`, with the per-component reference pages now living under `guides/architecture/components/`. The three-dimensional hit-tester page lives under `architecture/graph/`. The local-storage wrapper page and the part data shape page live under `architecture/core/`. The map page lives at `guides/project/overview/map.md`.
8. After the most recent components reshape, every dead link surfaced by the docs build was repaired. The build is green.

## Proposal — extract enduring material from milestone files

The milestone files mix three kinds of content. The task lists belong where they are — they are the project's ledger. The design reasoning and the hard-won lessons should be lifted into the long-term guides so future work can find them without trawling milestones.

### Pure ledgers — leave in place, no copies needed

These are checkbox lists with little reusable content.

1, 2, 3 (foundation, panel, docs), 6 (build notes), 18 (givens — already in algebra), 19 (angles), 22 (aesthetics), 24 (mobile), 28 (cut lists), 29 (user manual), 30 (licensing).

### Extend existing guide pages — copy the design reasoning

| Milestone source | Target page | What to copy |
| --- | --- | --- |
| 5 smart objects | `architecture/core/Smart_Objects.md` | The reason composition won over inheritance; the hit-precedence ordering; how a face automatically flips when its normal points away from the camera; the dots-only highlight decision |
| 7 edit drags | `architecture/graph/drag.md` | Why six bounds replaced eight vertices; how the mouse maps to the face plane; the rule that picks editing over rotation when something is selected |
| 8 dimensionals | `architecture/graph/dimensionals.md` | The three algorithms — picking the silhouette edge, picking the side the witness lines lean to, and detecting when the text would be crushed |
| 12 parts | `architecture/components/Details.md` | The collapse-triangle rule; the parent-child eye behaviour; arrow-key navigation through the tree |
| 13 algebra | `architecture/core/algebra.md` | The compile-tree shape, the grammar, the forward-and-reverse evaluation; the fixed-versus-variable orientation rule. Today this page only documents the aliases. |
| 14 details | `architecture/components/Details.md` | The three-pill layout, the Hideable shell, the persistent open/closed state |
| 15 attributes | `architecture/core/Smart_Objects.md` | The three states a value can be in (free, locked, formula-driven); the automatic transitions that keep state consistent; how the runtime block sits at the resolver write |
| 16 formulas | `architecture/core/algebra.md` | The reference conventions (bare, dot-prefix, name.path); the derived formulas for invariants; the silent empty-formula rule |
| 21 css engine | `architecture/ui/style.md` | The token catalogue, the colour-flow rule, the magic-number audit outcome |
| 26 lacemaker | `architecture/graph/intersecting.faces.md` | The single-key-from-birth rule; the canonical edge-pair ordering; why three merge passes were removed |

### New guide pages — large bodies of design that have no home today

| Source | New page | Why a new page is right |
| --- | --- | --- |
| 4 hits manager | `architecture/core/hits.md` | The two-dimensional hit manager (rbush index, mouse routing, double-click and long-click timing) is a peer of `Hits_3D` and deserves its own page |
| 10 controls | `architecture/components/Controls.md` (extend) | The scale model, the wheel-handler rule, the height-computation note for narrow screens |
| 11 units | `architecture/core/units.md` | Storage in millimetres, the conversion table, the imperial fractional rules, compound display, parsing — currently nowhere |
| 17 library | `architecture/components/Library.md` (or under details/) | Bundled glob plus on-device storage merge, the folder segments, replace versus insert |
| 23 undo | `architecture/core/history.md` | Why snapshot beat command-pattern, the list of mutation sites that snapshot, the restore path |
| 25 errors | `architecture/core/errors.md` | The structured-error object, the error factory, the "did you mean" UI |

### Research notes — copy into `project/research/`

Decided: milestones 9 and 31 are research, not architecture.

| Source | Target page in research | What to copy |
| --- | --- | --- |
| 9 persistence | `project/research/serialization-formats.md` | The format comparison (JSON, MessagePack, CBOR, BSON), the speed and size numbers, the sources cited, and the reason JSON won the call |
| 31 marketing | `project/research/competitive-landscape.md` | The competitor tables (closest, adjacent), the "what this project does differently" list, the gap-in-the-market summary |

### Lessons — distill into a single landing page

Today only the two mothballed milestones (32 facets, 33 drag) carry a `lessons.md`. The lessons in those two files are some of the most valuable writing in the project — they are about why approaches failed, not what code does.

Proposal: add `project/overview/lessons.md`. It carries the meta-lessons (the patterns that would mislead a successor on any feature, not just facets or drag), and it links out to the two existing `lessons.md` files for the deeper case-by-case writing. Keep the originals in place.

Candidate meta-lessons to lift:

- One misplaced `clear()` cost a week — data created by one phase should not be cleared by another (32.facets/lessons).
- Single key from birth beats multi-pass merges (32.facets/lessons, also milestone 26).
- Screen-space angles beat tangent-plane angles when the answer has to match what the viewer sees (32.facets/lessons).
- When each fix uncovers a deeper problem instead of shrinking the work, the architecture is wrong, not the patches (32.facets/lessons).
- Live pivot and one-to-one mouse tracking are in tension under a tumbled view (33.drag/lessons).
- Recomputing the projection ratio every frame creates a positive-feedback loop that explodes in a few frames (33.drag/lessons).

### What is not proposed

No deletes. No moves. Just copies, with a one-line backreference at the top of each new or extended page so the milestone stays the canonical source for the moment in time when the work was done.

---

## What is missing from the guides

A read of the existing tree against what the code actually does. Some claims are confident — backed by listings already read this session. Others are guesses; flagged as such.

### Recently added pages — were missing, now present

1. **The units system.** New page at `architecture/core/units.md`. Covers millimetre storage, the four families, the system-aware writer and parser, snapping and grid spacing, the persisted family setting. Every claim backed by a line citation.
2. **The error system.** New page at `architecture/core/errors.md`. Covers the structured-error shape, the classifier, the per-shape factories, per-attribute storage, name validation, span extraction.
3. **The undo and redo story.** New page at `architecture/core/history.md`. Covers the two-stack model, the snapshot capture, the restore path, every site that snapshots, what is not stepped through, the keyboard wiring.
4. **The library.** New page at `architecture/components/Library.md`. Covers the merge of bundled and on-device sources, folder segments, the three actions on a selection, import and save.
5. **The formula engine — small extension.** Two additions to `architecture/core/algebra.md`. A worked-example table on the x row showing how each formula shape (empty, bare, dot-prefix, named-part) resolves at evaluation time. A new section titled "Constraints during stretching" naming the two real mechanisms that absorb a stretch — the empty-formula offset model and the named-value reverse-propagation path. The proposed fixed-versus-variable flag and the two use cases were dropped after a code dive showed they do not exist in the current code.
6. **The two-dimensional hit manager — completeness fix.** Added a "Click timing — long click, double click, autorepeat" section to `architecture/ui/hits.md`. Names the four threshold values (eight hundred, four hundred, one hundred and fifty, five hundred milliseconds), the four timer kinds, and the autorepeat warm-up. Backed by line citations to the constants file, the timer module, and the manager's start-and-cancel helpers.
7. **The drawing-area editors group page (new).** New page at `architecture/graph/editors.md`. Lists what each of the four editors does, names the five-step lifecycle the three typed editors share (hit test, begin, parse, apply, cancel), and explains why the per-frame drag editor is different.
8. **Key paths moved into `architecture/ui/`.** New page at `architecture/ui/key paths.md`. The keyboard-shortcut tables that lived in `work/now/key paths.md` are now in the guides, with each context (canvas, attribute cell, part-name input, given-name cell, dimension input, face-label input, build-notes modal) backed by a code citation pointing at the handler that owns it.

### User manual is almost empty

Only one page exists today (repeaters). I AM GUESSING the user-visible features that warrant their own user-manual page are: multi-selection by command-click, drill-down clicking, drag-and-drop part reparenting, the formula language as a user-facing tool, the library, build notes, undo and redo, units selection, save and load.

### Suspected gaps — pages not opened this session

I AM GUESSING each of these is incomplete because the page has not been read this session; verify before acting.

1. ~~The page on click-and-hover dispatch — likely missing the long-click, double-click, and autorepeat timing detail.~~ Done — see the recently-added-pages list above.
2. The page on style and design tokens — likely needs the token catalogue and the colour-flow rule from milestone twenty-one.
3. The pages on rotation and on the rendering types — both touched late this session in spot-fix mode; completeness not verified.
4. The page on scenes (save and load) — may or may not include the format research from milestone nine; the proposal above already moves that to research instead.
5. The build-and-deploy story (the two-deployment pattern, docs site versus app site) — milestone three has the material; no corresponding page in the guides.

### Cross-cutting topics that no single page owns

Not "missing pages" so much as "no page owns the seam".

1. **End-to-end propagation.** A change to one cell ripples through formulas, dimensions, the parts list, the renderer, and the repeater. No page walks that ripple from input to pixel. Several pages cover their own slice, but the seam is undocumented.
2. **Lock semantics across the system.** Milestone fifteen captures the three-state lock model and the runtime block at the resolver write. The locked state interacts with formulas, drags, and reverse propagation. No single page covers this — it would naturally live on the part-data-shape page or the formula-engine page.

### What is solid today

For balance — these areas read well and have current pages: the panel layout, the component pages (toolbar, side panel, drawing area, root layout, visual divider, library), the per-render-phase walkthroughs, the repeaters page, the version-migration page, the managers overview, the rules catalogue and testing index, the lessons page, and the four new core pages (units, errors, history, library).

### Suggested order to close the gaps

Largest payoff per page first. All ten are done.

1. ~~The units system (new page).~~ Done.
2. ~~The error system (new page).~~ Done.
3. ~~The undo and redo story (new page).~~ Done.
4. ~~The library (new page).~~ Done.
5. ~~The formula engine — small extension to the existing page.~~ Done — see the recently-added-pages list above.
6. ~~The two-dimensional hit manager — verify completeness, fill in the timing detail if missing.~~ Done.
7. ~~The drawing-area editors group page (new).~~ Done.
8. ~~Move key paths into `architecture/ui/`.~~ Done.
9. ~~Distill this file into a useful set of instructions for the next time we update the guides.~~ Done — the distilled instructions live at `project/overview/updating guides.md`.
10. ~~The user manual filled out feature by feature.~~ Done. Eight new pages under `project/user manual/`: selection, re-parenting, formulas, library, build notes, undo and redo, units, save and load. Every claim has a code citation; the existing repeaters page was left as-is.
