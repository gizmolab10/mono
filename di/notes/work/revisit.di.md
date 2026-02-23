# Revisit

- [ ] Assume i have approved these:
	- [ ] Keep the table below up to date
	- [ ] Read [[code.debt]]

---

## What's Working

| Layer       | Status                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| Rendering   | Quaternions, wireframe, depth-based alpha                                         |
| Main        | Three regions: controls, details, graph                                           |
| Interaction | Hits managers — 2D (ported from ws) and 3D                                        |
| Docs        | VitePress configured, new guides content                                          |
| Testing     | ~391 tests — types, algebra, orientation, units, constraints, coordinates         |
| Editing     | Select face, drag edge or vertex, inline dimensional editing                      |
| Build Notes | List of important steps in our progress                                           |
| Dimensions  | Dynamic value + layout, inline click-to-edit, unit-aware display                  |
| Controls    | Steppers (h/v), slider, scale +/−/wheel                                           |
| Units       | mm storage, imperial fractions, compound display/parse, 22 units across 4 systems |
| Persistence | JSON serialize, localStorage auto-save, camera state, file import/export          |
| Hierarchy   | Parent-child SOs, named, add-child, ancestry, parent-relative offsets             |
| Scenes      | SO, camera orientation, scale, hierarchy, constants                               |
| Algebra     | Compiler, eval, reverse propagation, cycle detection, constraints                 |
| Orientation | Fixed/variable, derived from bounds, trig redistribution                          |
| Formulas    | Aliases (x/X/w), dot-prefix parent refs, empty=offset, invariants                 |
| Details     | Hideables, banner-zone, D_Preferences, D_Selection, D_Library, D_Constants        |
| Library     | Bundled .di presets, IndexedDB user files, import/click-load/option-insert        |
| Constants   | Scene-wide named values, usable in all formulas, rename propagates                |
| Repeaters   | Linear repeat, gap constraints, spacing presets, stairs/studs/joists              |
| Migration   | v1→v7 chain — IDs, bounds→axes, offsets, constants, repeater fields               |

