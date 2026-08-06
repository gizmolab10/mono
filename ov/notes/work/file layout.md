# File Layout

Where everything lives. What each file does is in the [map](../guides/map.md).

```text
ov/
├── index.html                    # the page the app mounts into
├── package.json                  # two dependencies: the color math, the markdown reader
├── vite.config.ts                # dev server (port 5185) and build; reaches outside this folder
├── vitest.config.ts              # the test runner: anything ending in .test.ts under src
├── svelte.config.js
├── tsconfig.json
├── CLAUDE.md
├── notes/
│   ├── guides/
│   │   ├── index.md
│   │   ├── map.md                # what every source file does
│   │   ├── editing.md            # changing a guide from inside the app
│   │   └── pre-flight/
│   │       ├── index.md
│   │       └── banned words.md
│   └── work/
│       ├── index.md
│       ├── handoff.md            # where to pick up
│       ├── code debt.md          # what is still owed
│       ├── work journal.md       # what is finished, newest first
│       ├── working features.md   # what the app can do
│       ├── file layout.md        # this file
│       ├── tags hierarchy.md     # the six areas, and the pill that folds them away
│       ├── repair staleness.md   # the repair buttons, and what they mend
│       ├── rewritten guides.md   # the guides that had fallen behind, and what each wants
│       ├── stale guides.md
│       ├── organize.md
│       ├── ov.md
│       └── okf.md                # the guide format, and how it sits in the code
└── src/
    ├── vite-env.d.ts
    └── lib/
        ├── main.css              # global styles, and the stacking-layer classes
        ├── md/
        │   └── builds.md         # the build-notes table, read at runtime
        ├── svelte/
        │   ├── main/             # the frame
        │   │   ├── App.svelte
        │   │   ├── Controls.svelte
        │   │   ├── Details.svelte
        │   │   ├── Operation.svelte
        │   │   └── BuildNotes.svelte
        │   ├── content/          # what the content box shows
        │   │   ├── Browse.svelte
        │   │   ├── List_Files.svelte
        │   │   ├── Edit_File.svelte
        │   │   └── D_Preferences.svelte
        │   └── support/          # the pieces the rest lean on
        │       ├── Filters.svelte
        │       ├── Big_Pill.svelte   # one area of tags, folding away behind its own name
        │       ├── Steppers.svelte   # the two marks that step from one thing to the next
        │       ├── Separator.svelte
        │       ├── Hideable.svelte
        │       └── ToolTip.svelte
        └── ts/
            ├── main.ts           # entry point
            ├── common/
            │   ├── Constants.ts  # every size, from one base number
            │   ├── Configuration.ts
            │   ├── Debug.ts      # the diagnostic log
            │   ├── Dirty.ts
            │   └── Extensions.ts
            ├── managers/
            │   ├── Guides.ts     # sweeps the guides, reads their labels
            │   ├── Hierarchy.ts  # the folders, files, tags, narrowing, and link following
            │   ├── Filters.ts    # every filter in one place
            │   ├── Operations.ts # browsing or reading, and the stepping
            │   └── Preferences.ts
            ├── database/
            │   └── Indexes.ts
            ├── tests/
            │   ├── runner.test.ts
            │   ├── markdown_blocks.test.ts   # the lines each piece claims, and putting words back
            │   ├── saving.test.ts   # where a guide sits in the repo
            │   ├── labels.test.ts   # writing the five labels back
            │   ├── index_files.test.ts   # mending the index files a move leaves lying
            │   ├── tag_areas.test.ts     # the areas and the closed tag list agree exactly
            │   ├── stepping.test.ts      # the step marks, and the holding that repeats a step
            │   └── sections.test.ts      # what a heading owns, and what folding hides
            ├── types/
            │   ├── Guide.ts      # kinds, tags, collections, labels
            │   ├── Tag_Areas.ts  # the six areas the tags are gathered into
            │   ├── App.ts
            │   ├── Details.ts
            │   ├── DB_Records.ts
            │   ├── Angle.ts
            │   ├── Coordinates.ts
            │   └── Types.ts
            └── utilities/
                ├── Markdown_Blocks.ts   # a guide's text into a page, and a change back into the text
                ├── Index_Files.ts   # mending the two index files a move leaves lying
                ├── Sections.ts   # what each heading owns, and what a fold hides
                ├── Stepping.ts   # which way each step mark points, and the repeating hold
                ├── Labels.ts     # writing the five labels back to the top of a file
                ├── Saving.ts     # handing a changed guide to the local write server
                ├── Colors.ts
                ├── SVG_Paths.ts
                └── Tooltip.ts
```
