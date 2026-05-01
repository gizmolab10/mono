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
