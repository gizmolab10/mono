1 # s3 Design Spec

Design spec for the Svelte 5 port of ws. One file per subsystem.

## Files

* [3 types.md](3%20types.md) — Global_Imports (every `h`/`x`/`g` alias), all T_\* enums, type aliases, Coordinates API
* [4 entities.md](4%20entities.md) — Thing, Relationship, Predicate, Trait, Tag, User, Access, Persistable base
* [5 hierarchy.md](5%20hierarchy.md) — Hierarchy god object: all 8 responsibilities, every method
* [6 rendering.md](6%20rendering.md) — All 74 Svelte components: props, stores, signals, render tree
* [7 geometry.md](7%20geometry.md) — G_Widget, G_TreeGraph, G_TreeBranches, G_TreeLine, G_Cluster, G_RadialGraph, Coordinates
* [8 ancestry.md](8%20ancestry.md) — Ancestry runtime type: path model, depth limit, visibility, uniqueness cache
* [9 ux.md](9%20ux.md) — UX: focus/grabs/recents model, S_Items, all state objects, Visibility
* [10 utilities.md](10%20utilities.md) — SVG_Paths, Colors, Utilities, Extensions, Constants, Debug, Print
* [11 database.md](11%20database.md) — DB_Common interface, Firebase, Filesystem, Local, Bubble, Airtable, Test, Docs
* [12 signals.md](12%20signals.md) — Signals pub/sub, Events (keyboard + mouse dispatch), Hits, Mouse_Timer
* [13 managers.md](13%20managers.md) — Core, Configuration, Files, Preferences, Search, Radial, Controls, Details, Components, Elements, Features, Styles

## Build plan

* [fresh.build.md](./fresh.build.md) — 14 phases, \~21 sessions, vertical slice first

## Architecture decisions

Option 3 + A + di CSS:

* **Store**: normalized reactive tables (`$state`), no god-object Hierarchy
* **Reactivity**: Svelte 5 runes only (`$state`, `$derived`, `$effect`), no typed-signals
* **Layout**: flex + gap + border-radius, no SVG draw components

See [ws/notes/work/w2.md](../../../ws/notes/work/w2.md) for full rationale.
