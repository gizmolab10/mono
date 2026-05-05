# Guide layout

A bird's-eye view of every page under `notes/guides/` with a super-brief description.

```text
guides/
├── index.md ............................. top-level table of contents
├── guides.layout.md ...................... this page — every guide at a glance
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
│   │   ├── dimensionals.md .............. measurement labels and witness lines
│   │   ├── drag.md ...................... edge and corner stretch history
│   │   ├── editors.md ................... canvas input editors group page
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
│       ├── details.md ................... right-side panel architecture
│       ├── hits.md ...................... click and hover dispatch
│       ├── key paths.md ................. keyboard shortcuts by context
│       ├── panel.layout.md .............. full-viewport region layout
│       └── style.md ..................... CSS conventions and design tokens
└── project/
    ├── index.md ......................... project table of contents
    ├── development/
    │   ├── index.md ..................... development table of contents
    │   ├── adherence dashboard.md ....... auto-generated scorecard, refreshed on every build
    │   ├── adherence log.md ............. hand-recorded sweeps, compliance, triage entries
    │   ├── areas.json ................... module count per area (hand-maintained)
    │   ├── best.practices.md ............ Svelte patterns and what to avoid
    │   ├── build-status.json ............ last build outcome, written by the wrapper script
    │   ├── dashboard guide.md ........... how to read the adherence dashboard
    │   ├── lessons.md ................... meta-lessons from mothballed work
    │   ├── logic driven design.md ....... logic-driven design notes
    │   ├── stipulations.md .............. load-bearing rules catalog
    │   ├── testing.md ................... test index per rule
    │   └── updating guides.md ........... instructions for guide updates
    ├── overview/
    │   ├── index.md ..................... overview table of contents
    │   ├── file layout.md ............... every folder and file listed
    │   ├── map.md ....................... flat list of notes files
    │   └── project.md ................... entry flow and core loop
    └── research/
        ├── index.md ..................... research table of contents
        ├── 3D.primer.md ................. quaternions, projection, perspective basics
        ├── library-versioning.md ........ saving library objects, design notes
        └── spatial-acceleration.md ...... flatbush adoption research notes
```

The user-manual markdown files no longer live under `notes/guides/project/`. They are now in `src/manual/` (the in-app help component imports them directly). See the overview file map for the full listing.
