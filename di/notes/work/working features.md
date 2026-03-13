# What's Working

| Layer       | Status                                                                                  |
| ----------- | --------------------------------------------------------------------------------------- |
| Rendering   | Quaternions, wireframe, depth-based alpha, 2D infinite-zoom, face intersections, face label occlusion |
| Main        | Three regions: controls, details, graph                                                 |
| Interaction | Hits managers -- 2D (RBush) and 3D, touch events (1-finger drag, 3-finger details)     |
| Docs        | VitePress configured, new guides content                                                |
| Testing     | ~450 tests -- types, algebra, orientation, units, constraints, coordinates              |
| Editing     | Select face, drag edge/vertex, inline dimension editing, face label editing, angular editing |
| Build Notes | 33 builds tracked                                                                       |
| Dimensions  | Dynamic value + layout, inline click-to-edit, unit-aware display                        |
| Controls    | Save, fit, straighten, edit/lock, decorations, 2D/3D, solid/x-ray, orient, scale, snap, color picker, responsive wrap |
| Units       | mm storage, imperial fractions, compound display/parse, 22 units across 4 systems       |
| Persistence | JSON serialize, localStorage auto-save, camera state, file import/export                |
| Hierarchy   | Parent-child SOs, named, add-child, ancestry, parent-relative offsets                   |
| Scenes      | SO, camera orientation, scale, hierarchy, constants                                     |
| Algebra     | Compiler, eval, reverse propagation, cycle detection, constraints                       |
| Orientation | Per-axis angles, axis compaction, swap axes, 90-degree steps, slider+sticky angles      |
| Formulas    | Aliases (x/X/w), dot-prefix parent refs, empty=offset, invariants                       |
| Details     | Hideable panels -- Prefs, Library, Parts; tabs + constants; precision, units, line thickness |
| Parts       | Hierarchy, position/size toggle, depth indent, repeat badges, select, name edit, 3 tabs |
| Selection   | Duplicate, empty, repeat/unrepeat, visible toggle, repeater options                     |
| Rotation    | Axis picker, 90-degree steps, swap axes, angle slider with sticky, editable per-axis    |
| Attributes  | 9-row bounds (x/y/z/w/d/h/X/Y/Z), formula+value edit, invariants, rotation+lock         |
| Library     | Bundled .di presets, IndexedDB user files, import/click-load/option-insert              |
| Constants   | Scene-wide named values, usable in all formulas, rename propagates                      |
| Repeaters   | Linear repeat, gap constraints, spacing presets, stairs/studs/joists, fireblocks        |
| Versions    | v1->v7 chain -- IDs, bounds->axes, offsets, constants, repeater fields                  |
| CSS Engine  | Design tokens from common_size, 3-tier pipeline (Constants → CSS vars → scoped styles), swept colors/fonts/spacing |
| Undo        | Snapshot-based, Cmd+Z / Cmd+Shift+Z, 50-state stack, covers drag/rotate/edit/delete/add/rename |
| Mobile      | Touch-only input (no mouse wired), 3-finger details toggle, browser pinch-to-zoom, no hover |
