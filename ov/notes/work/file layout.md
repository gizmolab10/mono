# File Layout

Where everything lives. What each file does is in the [map](../guides/map.md).

```text
ov/
├── index.html                    # the page the app mounts into
├── package.json                  # two dependencies: the color math, the markdown reader
├── vite.config.ts                # dev server (port 5185) and build; reaches outside this folder
├── svelte.config.js
├── tsconfig.json
├── CLAUDE.md
├── notes/
│   ├── guides/
│   │   ├── map.md                # what every source file does
│   │   └── pre-flight/
│   │       └── banned words.md
│   └── work/
│       ├── index.md
│       ├── handoff.md            # where to pick up
│       ├── code debt.md          # what is still owed
│       ├── work journal.md       # what is finished, newest first
│       ├── working features.md   # what the app can do
│       ├── file layout.md        # this file
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
        │   │   ├── Guides_List.svelte
        │   │   ├── View_Guide.svelte
        │   │   └── D_Preferences.svelte
        │   └── support/          # the pieces the rest lean on
        │       ├── Filters.svelte
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
            ├── types/
            │   ├── Guide.ts      # kinds, tags, collections, labels
            │   ├── App.ts
            │   ├── Details.ts
            │   ├── DB_Records.ts
            │   ├── Angle.ts
            │   ├── Coordinates.ts
            │   └── Types.ts
            └── utilities/
                ├── Colors.ts
                ├── SVG_Paths.ts
                └── Tooltip.ts
```
