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
│   │   ├── Main.md ...................... root layout component reference
│   │   └── Separators.md ................ visual divider component reference
│   ├── core/
│   │   ├── index.md ..................... core table of contents
│   │   ├── algebra.md ................... formula language and propagation
│   │   ├── managers.md .................. singletons and their concerns
│   │   ├── Preferences.md ............... local-storage wrapper reference
│   │   ├── scenes.md .................... scene loading two-phase pattern
│   │   ├── Smart_Objects.md ............. part data shape reference
│   │   └── versions.md .................. file format migration chain
│   ├── graph/
│   │   ├── index.md ..................... graph pages table of contents
│   │   ├── axes.md ...................... rotation, swap, angular rendering
│   │   ├── dimensionals.md .............. measurement labels and witness lines
│   │   ├── drag.md ...................... edge and corner stretch history
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
│       ├── panel.layout.md .............. full-viewport region layout
│       └── style.md ..................... CSS conventions and design tokens
└── project/
    ├── index.md ......................... project table of contents
    ├── main/
    │   ├── index.md ..................... main table of contents
    │   ├── best.practices.md ............ Svelte patterns and what to avoid
    │   ├── file layout.md ............... every folder and file listed
    │   ├── map.md ....................... flat list of notes files
    │   ├── project.md ................... entry flow and core loop
    │   ├── stipulations.md .............. load-bearing rules catalog
    │   └── testing.md ................... test index per rule
    ├── research/
    │   ├── index.md ..................... research table of contents
    │   ├── 3D.primer.md ................. quaternions, projection, perspective basics
    │   ├── library-versioning.md ........ saving library objects, design notes
    │   └── spatial-acceleration.md ...... flatbush adoption research notes
    └── user manual/
        ├── index.md ..................... user manual table of contents
        └── repeaters.md ................. stairs, studs, joists configuration
```
