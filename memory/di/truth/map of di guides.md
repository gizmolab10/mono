---
kind: explain
title: "Guide Layout (di)"
description: "A bird's-eye list of every page under the di guides, one line each."
tags: [journal, notes, incorporated]
date: 2026-08-09
---
# Map of di guides

A bird's-eye view of every page under `notes/guides/` with a super-brief description.

```text
guides/
├── index.md ............................. top-level table of contents
├── architecture/
│   ├── index.md ......................... architecture table of contents
│   ├── components/
│   │   ├── index.md ..................... components table of contents
│   │   ├── Controls.md .................. toolbar component reference
│   │   ├── Details.md ................... right-side panel component reference
│   │   ├── Graph.md ..................... drawing area component reference
│   │   ├── Library.md ................... saved-arrangement panel reference
│   │   ├── Main.md ...................... root layout component reference
│   │   └── Separators.md ................ visual divider component reference
│   ├── core/
│   │   ├── index.md ..................... core table of contents
│   │   ├── algebra.md ................... formula language and propagation
│   │   ├── errors.md .................... structured errors and suggestions
│   │   ├── history.md ................... undo and redo, snapshot sites
│   │   ├── managers.md .................. singletons and their concerns
│   │   ├── Preferences.md ............... local-storage wrapper reference
│   │   ├── scenes.md .................... scene loading two-phase pattern
│   │   ├── Smart_Objects.md ............. part data shape reference
│   │   ├── units.md ..................... millimetre storage, four families
│   │   └── versions.md .................. file format migration chain
│   ├── graph/
│   │   ├── index.md ..................... graph pages table of contents
│   │   ├── axes.md ...................... rotation, swap, angular rendering
│   │   ├── drag.md ...................... edge and corner stretch history
│   │   ├── editors.md ................... the four modules handling typing and dragging on the drawing
│   │   ├── Hits_3D.md ................... three-dimensional hit testing
│   │   ├── intersecting.faces.md ........ face-pair plane crossings
│   │   ├── render.md .................... per-frame render pipeline overview
│   │   ├── rendering.types.md ........... projected-vertex and scene-entry types
│   │   ├── repeaters.md ................. clone generation for studs and stairs
│   │   ├── rotation.md .................. world-versus-camera split, view extent
│   │   ├── three.dimensions.md .......... full render pipeline in detail
│   │   └── two.dimensions.md ............ face-aligned mode snap behavior
│   └── ui/
│       ├── index.md ..................... ui pages table of contents
│       ├── hits system.md ............... click and hover dispatch
│       ├── key paths.md ................. keyboard shortcuts by context
│       ├── panel.layout.md .............. full-viewport region layout
│       └── style.md ..................... CSS conventions and design tokens
├── development/
│   ├── index.md ......................... development table of contents
│   ├── running e2e tests.md ............. what must already be running before an end-to-end test can pass
│   └── rules/
│       ├── index.md ..................... rules table of contents
│       ├── dimensionals.md .............. how a measurement label finds its place on every redraw
│       └── stipulations.md .............. the load-bearing rules, each pinned by a test
├── pre-flight/
│   ├── index.md ......................... pre-flight table of contents
│   ├── always.md ........................ di's own standing rules, read every session
│   ├── banned words.md .................. di's own words to use and never use
│   └── lexicon.md ....................... the exact words di uses, no near-synonyms
└── project/
    ├── index.md ......................... project table of contents
    ├── map of di files.md ............... where everything lives in the di source
    ├── map of di guides.md .............. this page — every guide at a glance
    ├── map of di notes.md ............... every folder under notes/, and what it holds
    ├── overview/
    │   ├── index.md ..................... overview table of contents
    │   └── project.md ................... entry flow and core loop
    ├── philosophy/
    │   ├── index.md ..................... philosophy table of contents
    │   ├── best.practices.md ............ Svelte patterns and what to avoid
    │   ├── unit testing.md .............. which tests cover which rules, and how each names its rule
    │   └── update guides.md ............. instructions for guide updates
    └── research/
        ├── index.md ..................... research table of contents
        ├── 3D.primer.md ................. quaternions, projection, perspective basics
        ├── dimensionals research.md ..... whether an existing constraint library beats the custom search
        ├── library versioning.md ........ what happens to placed instances when the saved original changes
        └── occlusion performance.md ..... ways to speed up working out what hides what
```

The user-manual markdown files no longer live under `notes/guides/project/`. They are now in `src/manual/` (the in-app help component imports them directly). See the file map for the full listing.
