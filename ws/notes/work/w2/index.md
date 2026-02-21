# w2 Design Spec

Design spec for the Svelte 5 port of ws. One file per subsystem.

## Files

- [entities.md](./entities.md) — Thing, Relationship, Predicate, Trait, Tag, User, Access, Persistable base
- [ancestry.md](./ancestry.md) — Ancestry runtime type: path model, depth limit, visibility, uniqueness cache
- [hierarchy.md](./hierarchy.md) — Hierarchy god object: all 8 responsibilities, every method
- [ux.md](./ux.md) — UX: focus/grabs/recents model, S_Items, all state objects, Visibility
- [signals.md](./signals.md) — Signals pub/sub, Events (keyboard + mouse dispatch), Hits, Mouse_Timer
- [geometry.md](./geometry.md) — G_Widget, G_TreeGraph, G_TreeBranches, G_TreeLine, G_Cluster, G_RadialGraph, Coordinates
- [database.md](./database.md) — DB_Common interface, Firebase, Filesystem, Local, Bubble, Airtable, Test, Docs
- [rendering.md](./rendering.md) — All 74 Svelte components: props, stores, signals, render tree
- [managers.md](./managers.md) — Core, Configuration, Files, Preferences, Search, Radial, Controls, Details, Components, Elements, Features, Styles
- [utilities.md](./utilities.md) — SVG_Paths, Colors, Utilities, Extensions, Constants, Debug, Print
- [types.md](./types.md) — Global_Imports (every `h`/`x`/`g` alias), all T_* enums, type aliases, Coordinates API

## Architecture decisions

Option 3 + A + di CSS:
- **Store**: normalized reactive tables (`$state`), no god-object Hierarchy
- **Reactivity**: Svelte 5 runes only (`$state`, `$derived`, `$effect`), no typed-signals
- **Layout**: flex + gap + border-radius, no SVG draw components

See [../w2.md](../w2.md) for full rationale.
