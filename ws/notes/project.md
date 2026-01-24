# Webseriously Project


**Webseriously** is a sophisticated Svelte-based visualization and data management application with hierarchical graph displays, interactive UI components, and multi-database support. Can be embedded as a Bubble.io plugin or run standalone.

Deeper Dives, beyond the scope of this file, [can be found here](./index.md).
## Table of Contents
- [Project Overview](#project-overview)
  - [Naming Conventions](#naming-conventions)
  - [Directory Structure](#directory-structure)
  - [Core Concepts](#core-concepts)
  - [Key Features](#key-features)
  - [Architecture & Patterns](#architecture--patterns)
- [Development](#development)
  - [Setup](#setup)
  - [Code Style](#code-style)
  - [Important Files](#important-files)
  - [Debugging](#debugging)
  - [Gotchas](#gotchas)
- [Notes](#notes)
  - [DO / DON'T](#do--dont)
  - [Additional Resources](#additional-resources)

This document provides comprehensive guidance for anyone working on the Webseriously project.

## Project Overview

- **Package**: `webseriously`
- **Repository**: `gizmolab10/seriously-svelte`
- **Framework**: Svelte 4 + SvelteKit 2.8.3 + Vite
- **Language**: TypeScript (strict mode)
- **Node**: ^20.19.0
- **Deployment**: Netlify (https://webseriously.netlify.app)

**Tech Stack**: Svelte 4, TypeScript, Tailwind CSS + SCSS, Skeleton Labs, D3.js v7, Two.js, InteractJS, Vitest + Jest

**Databases**: Firebase, Airtable, Bubble, Local (IndexedDB/Dexie), Neo4j, PostgreSQL, RxDB, Test (in-memory). Switch via `?db=local|firebase|airtable|bubble`

### Naming Conventions

**Critical - Follow strictly:**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `T_` | Types/Enums | `T_Trait`, `T_Startup` |
| `w_` | Svelte Stores | `w_hierarchy`, `w_ancestry_focus` |
| `S_` | State Classes | `S_Widget`, `S_Element` |
| `G_` | Geometry | `G_Point`, `G_Cluster` |
| `k` | Constants instance | `k.empty`, `k.hashLength` |
| `h` | Hierarchy manager | `h.thing_forHID()` |
| `g` | Geometry manager | `g.layout()` |
| `p` | Preferences manager | `p.get()` |
| `x` | UX manager | `x.w_ancestry_focus` |
| `core` | Core manager | `core.w_hierarchy` |

**Variables**: `is_`, `has_`, `should_` (booleans), `_id`/`ID` (identifiers), `count_` (counters)

### Directory Structure

```
src/lib/
├── js/              # JavaScript utilities
├── svelte/          # UI Components (~77 files)
│   ├── controls/    # Primary/secondary controls, breadcrumbs
│   ├── details/     # Detail panels (actions, data, preferences, tags, traits)
│   ├── draw/        # SVG primitives (circles, boxes, gradients, portals)
│   ├── experimental/# WIP components
│   ├── main/        # SeriouslyApp, Panel, Graph, Import
│   ├── mouse/       # Mouse interaction (buttons, sliders, rubberband)
│   ├── radial/      # Radial graph components
│   ├── search/      # Search interface
│   ├── text/        # Text rendering (curved, angled, tables)
│   ├── tree/        # Tree graph components
│   └── widget/      # Widget system (drag, reveal, title)
└── ts/              # TypeScript core (~89 files)
    ├── common/      # Constants, enumerations, extensions
    ├── database/    # DB abstraction (7 databases)
    ├── debug/       # Debug utilities, error tracing
    ├── files/       # File operations, pivot tables
    ├── geometry/    # Layout algorithms (tree, radial, paging)
    ├── managers/    # Singleton managers (16 managers)
    ├── persistable/ # Data models (Thing, Trait, Tag, etc.)
    ├── runtime/     # Runtime objects (Ancestry, Identifiable)
    ├── signals/     # Event system, mouse timers
    ├── state/       # State classes (13 S_ classes)
    ├── tests/       # Vitest test suite
    ├── types/       # Type definitions
    └── utilities/   # Colors, print, SVG paths, general utils

bubble/              # Bubble.io plugin (JavaScript)
notes/designs/       # Design documentation
```

### Core Concepts

**Data Model**: Things (hierarchical nodes), Tags (categorization), Traits (key-value properties), Ancestries (parent-child paths), Relationships (typed links)

**Hierarchy System**:
```typescript
import { h } from '$lib/ts/common/Global_Imports';
const thing = h.thing_forHID('someHashID');
const ancestry = h.ancestry_forThing(thing);
```

**Graph Modes**: Tree (horizontal layout) or Radial (circular with rings)

**Bubble Integration**: Iframe embedding, postMessage communication, state publishing

### Key Features

**Visualization**: Radial graphs (resize, paging, rotate), tree graphs, cluster pagination, drag & drop, rubberband selection

**Data**: Full CRUD, relationship management, advanced search, bulk operations, per-item preferences

**UI/UX**: Details panel tabs, multiple themes, responsive, keyboard nav, mouse detection (autorepeat, double-click, long-click)

**Import/Export**: JSON, CSV, PDF export (HTML2Canvas + jsPDF)

### Architecture & Patterns

#### 1. State Management

State objects (S_* classes) persist across component recreation and provide computed properties via getters. Svelte stores (w_* writables) provide reactivity. Stores organized by manager domain.

See [architecture/core/state.md](./architecture/core/state.md) for state objects, stores inventory, and why we use this hybrid approach.

#### 2. Manager Pattern

16 singleton managers coordinate different aspects: Components, Configuration, Controls, Core (system state), Details, Elements, Features, Geometry (layout), Hierarchy (data), Hits (click/hover), Preferences, Radial, Search, Styles, UX (focus/grabs), Visibility.

See [architecture/core/managers.md](./architecture/core/managers.md) for complete responsibilities, access patterns, and examples.

#### 3. Persistable Pattern

8 data models extend `Persistable`: Access, Persistable (base), Predicate, Relationship, Tag, Thing, Trait, User. Each has hash-based ID, database-agnostic CRUD, and serialization.

See [architecture/internals/persistable.md](./architecture/internals/persistable.md) for identity, serialization, and lifecycle.

#### 4. Database Abstraction

Supports 5 database backends: Local (IndexedDB), Firebase, Airtable, Bubble plugin, and Test (in-memory).

See [architecture/core/databases.md](./architecture/core/databases.md) for architecture, switching, and implementation.

#### 5. Component Architecture

11 component directories: controls/, details/, draw/ (SVG primitives), experimental/, main/ (app core), mouse/ (interactive), radial/, search/, text/, tree/, widget/. Components manager tracks S_Component state for complex interactive components.

See [architecture/core/components.md](./architecture/core/components.md) for organization, patterns, state management, and Components manager.

#### 6. Hit Testing & Hover

Centralized hit testing with RBush spatial indexing. Priority: dots > widgets > rings > controls > rubberband.

See [architecture/core/hits.md](./architecture/core/hits.md) for complete click system (autorepeat, long-click, double-click), migration guide, testing.

#### 7. Geometry Layout

Coordinates layout algorithms for tree and radial graph modes.

See [architecture/core/geometry.md](./architecture/core/geometry.md) for responsibilities, layout invocation, and coordination patterns.

## Development

### Setup

```bash
npm install          # Install dependencies
npm run dev          # Development server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production
npm run test         # Run tests
npm run test:ui      # UI tests
```

Tests in `src/lib/ts/tests/`, naming: `*.test.ts` or `*Test.ts`

#### URL Parameters

- `?db=local|firebase|airtable|bubble` - Database backend
- `?debug=bubble` - Enable Bubble debugging
- `?disable=auto_save,standalone_UI,details` - Disable features
- `?erase=settings` - Clear settings

#### Configuration Files

- `vite.config.js` - Dual build (plugin vs app)
- `svelte.config.js` - Preprocessing
- `tsconfig.json` - TypeScript strict mode
- `tailwind.config.ts` - Dark mode + Skeleton
- `netlify.toml` - Deployment
- `.prettierrc` - Formatting
- `typedoc.json` - API docs

#### Build & Deployment

**Vite builds**:
1. Default: Svelte app → `dist/` (sourcemaps enabled, minification disabled)
2. Plugin (`BUILD_TARGET=plugin`): Bubble.io → `dist/plugin/bubble-plugin.js` (ES module)

**Netlify**: Auto-deploys from main, Airtable headers configured, `netlify.toml`

#### Git Workflow

- Clear commit messages
- No force pushes to main
- Test before pushing
- Currently in a local github repo

### Code Style

**CRITICAL** - Follow these conventions:
- Length-based ordering (imports, props, CSS, case statements)
- Tab-based alignment
- Svelte formatting
- All codebase conventions

TypeScript strict mode, Prettier formatting, `Global_Imports` for imports, descriptive function names.

#### Common Patterns

```typescript
// Imports
import { k, h, core, x, g, databases, T_Trait } from '../common/Global_Imports';

// Store subscription
$: hierarchy = $core.w_hierarchy;

// Persistable
class MyThing extends Persistable {
  async persistent_create_orUpdate(already_persisted: boolean) { }
  get fields(): Airtable.FieldSet { }
}
```

### Important Files

- `Core.ts` - System state (w_t_startup, w_hierarchy)
- `Hierarchy.ts` - Data hierarchy management
- `Geometry.ts` - Layout coordination
- `Hits.ts` - Hit testing/hover
- `UX.ts` - User interaction state
- `Constants.ts` - Application constants

### Debugging

**Two Principles**:
1. **Verify source first** - Check imports/destructuring before assuming usage issues
2. **Be systematic** - Form multiple hypotheses, test complete pipeline

**Enable logging**: Check `enable_logging` flags, Bubble plugin properties, `[PLUGIN]` console messages

**Common Issues**:
- State not updating → check `.set()` or `.update()`
- Database not persisting → verify `?db=` parameter
- Build errors → TypeScript strict mode compliance
- Geometry rendering → check SVG attributes/CSS before math

### Gotchas

- `/bubble/` is js (not ts), maintain Bubble compatibility
- Geometry: precise coordinates, don't round prematurely
- SVG-based rendering: understand viewBox and transforms
- State updates: assure appropriate Svelte reactivity
- Database ops: async, handle promises
- Hit testing: spatial indexing, register targets properly
- Widget layout differences: tree vs radial modes
- Focus widget (radial): no reveal dot
- Race conditions

## Notes

### DO / DON'T

✅ **DO**:
- Follow naming conventions (T_, w_, S_, G_)
- Use `Global_Imports`
- Write tests
- TypeScript strict mode
- Respect Persistable pattern
- Update stores when changing data
- Test multiple databases
- Read before modifying
- Understand geometry (Point, Size, Rect)

❌ **DON'T**:
- Modify naming prefixes
- Break singleton pattern
- Skip TypeScript types
- Modify `bubble/` without testing in Bubble.io
- Commit to main untested
- Change schemas without migration
- Add dependencies without review
- Disable strict checks
- Round geometry prematurely
- Use `any` types

### Additional Resources

**External**:
- Svelte: https://svelte.dev/docs
- TypeScript: https://www.typescriptlang.org/docs
- Vite: https://vitejs.dev/guide
- Bubble Plugin API: https://manual.bubble.io/core-resources/bubble-made-plugins
- RBush: https://github.com/mourner/rbush

**Internal Documentation**:

**Index**: [index.md](./index.md) - Complete index of all design documentation

**Architecture** (architecture/):
- [buttons.md](./architecture/ux/buttons.md) - Button hierarchy, SVG icons
- [components.md](./architecture/core/components.md) - Component architecture: organization and Components manager
- [controls.md](./architecture/ux/controls.md) - Control components
- [database.md](./architecture/core/databases.md) - Database abstraction layer
- [details.md](./architecture/ux/details.md) - Details panel architecture
- [geometry.md](./architecture/core/geometry.md) - Layout coordination and positioning
- [hits.md](./architecture/core/hits.md) - Click/hover system, migration guide
- [managers.md](./architecture/core/managers.md) - Singleton manager pattern and responsibilities
- [paging.md](./architecture/ux/paging.md) - Radial paging system
- [persistable.md](./architecture/internals/persistable.md) - Persistable data models and serialization
- [preferences.md](./architecture/ux/preferences.md) - Settings management
- [search.md](./architecture/ux/search.md) - Search functionality
- [state.md](./architecture/core/state.md) - State objects and stores architecture
- [styles.md](./architecture/internals/styles.md) - Styling system
- [ux.md](./architecture/core/ux.md) - UX manager (focus, grabs, details)

---

**Last Updated**: 2025-12-30
