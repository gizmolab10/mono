# Revisit

- [ ] Assume i have approved these, and do not check them off
  - [ ] Keep the table below up to date
  - [ ] Read [[di/notes/work/code.debt]]

---

## What's Working

| Layer       | Status                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| Rendering   | Quaternions, wireframe, depth-based alpha, 2D grid, angulars overlay, invisible root       |
| Main        | Three regions: controls, details, graph                                                    |
| Interaction | Hits managers -- 2D (ported from ws) and 3D                                                |
| Docs        | VitePress configured, new guides content                                                   |
| Testing     | ~450 tests -- types, algebra, orientation, units, constraints, coordinates                 |
| Editing     | Select face, drag edge or vertex, inline dimensional editing, face label editing           |
| Build Notes | 33 builds tracked                                                                          |
| Dimensions  | Dynamic value + layout, inline click-to-edit, unit-aware display                           |
| Controls    | Save, fit, straighten, details, decorations, 2D/3D, solid/see-through, orient, scale       |
| Units       | mm storage, imperial fractions, compound display/parse, 22 units across 4 systems          |
| Persistence | JSON serialize, localStorage auto-save, camera state, file import/export                   |
| Hierarchy   | Parent-child SOs, named, add-child, ancestry, parent-relative offsets                      |
| Scenes      | SO, camera orientation, scale, hierarchy, constants                                        |
| Algebra     | Compiler, eval, reverse propagation, cycle detection, constraints                          |
| Orientation | Per-axis angles, axis compaction, swap axes, 90-degree steps, slider+sticky angles         |
| Formulas    | Aliases (x/X/w), dot-prefix parent refs, empty=offset, invariants                          |
| Details     | Hideable panels -- Prefs, Library, Parts; tabs + constants inside Parts                    |
| Parts       | Hierarchy, position/size toggle, depth indent, repeat badges, select, name edit, 3 tabs    |
| Selection   | Duplicate, empty, repeat/unrepeat, visible toggle, repeater options                        |
| Rotation    | Axis picker, 90-degree steps, swap axes, angle slider with sticky, editable per-axis       |
| Attributes  | 9-row bounds (x/y/z/w/d/h/X/Y/Z), formula+value edit, invariants, rotation+lock            |
| Library     | Bundled .di presets, IndexedDB user files, import/click-load/option-insert                 |
| Constants   | Scene-wide named values, usable in all formulas, rename propagates                         |
| Repeaters   | Linear repeat, gap constraints, spacing presets, stairs/studs/joists, fireblocks           |
| Migration   | v1->v7 chain -- IDs, bounds->axes, offsets, constants, repeater fields                     |
