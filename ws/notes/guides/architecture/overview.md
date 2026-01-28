# Architecture Overview

Start here. This is how the pieces fit together.

```mermaid
flowchart TB
    subgraph User["User Interaction"]
        Mouse["Mouse/Touch"]
        Keyboard["Keyboard"]
    end

    subgraph UI["UI Layer"]
        Svelte["Svelte Components"]
        Stores["w_* Stores"]
    end

    subgraph Managers["Manager Layer"]
        UX["UX<br/>focus, grabs, edit"]
        Hits["Hits<br/>mouse dispatch"]
        Geometry["Geometry<br/>layout"]
        Styles["Styles<br/>colors"]
        Search["Search<br/>find things"]
    end

    subgraph State["State Layer"]
        S_Objects["S_* Objects<br/>persist across re-renders"]
        Hierarchy["Hierarchy<br/>thing tree"]
    end

    subgraph Data["Data Layer"]
        Persistable["Persistable<br/>Thing, Trait, Tag, Relationship"]
        DB["Databases<br/>Firebase / Airtable / Local"]
    end

    Mouse --> Hits
    Keyboard --> UX
    Hits --> UX
    UX --> Stores
    Stores --> Svelte
    Svelte --> Geometry
    Geometry --> S_Objects
    S_Objects --> Stores
    UX --> Hierarchy
    Hierarchy --> Persistable
    Persistable --> DB
    Styles --> Svelte
    Search --> Hierarchy
```

## The Layers

**User Interaction** — Mouse and keyboard events enter here.

**UI Layer** — Svelte components render the interface. Stores (`w_*` writables) trigger reactivity.

**Manager Layer** — Singletons that coordinate domains. Hits dispatches mouse events. UX tracks focus and selection. Geometry computes layout. Styles computes colors. Search indexes content.

**State Layer** — `S_*` objects hold state that survives component re-renders. Hierarchy owns the tree of Things.

**Data Layer** — Persistable entities (Thing, Trait, Tag, Relationship) serialize to whichever database is active.

## Reading Order

1. [state.md](./core/state.md) — understand S_* objects and w_* stores
2. [managers.md](./core/managers.md) — the 16 singletons
3. [hits.md](./core/hits.md) — how mouse events flow
4. [ux.md](./core/ux.md) — focus, grabs, editing
5. [geometry.md](./core/geometry.md) — layout coordination

After that, pick what interests you.

## WRONG!
hierarchy is in the manager layer
