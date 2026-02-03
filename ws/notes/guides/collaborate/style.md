# Style (ws-specific)

ws-specific conventions that differ from shared mono guides.

## Imports

**Use Global_Imports barrel** — all manager instances and types re-exported from one place:

```typescript
import { g, k, p, s, g_graph_tree, features } from '../common/Global_Imports';
```

### Import Order

**Import statement groups** follow this order (by category):

1. **Geometry classes** (G_*)
2. **State classes** (S_*)
3. **Persistable/Runtime classes** (Thing, Ancestry, etc.)
4. **Type imports from Enumerations** (T_*)
5. **Side-effect imports** (`import './Extensions'`)
6. **Manager instances** (k, g, h, s, u, x, etc.)
7. **Utility imports** (builds, busy, files, etc.)
8. **Type imports** (`import type { Dictionary }`)
9. **External library imports** (`import { get, writable } from 'svelte/store'`)
10. **Local relative imports** (`import { x } from '../managers/UX'`)

**Within each import statement**, items are ordered by **length** (shortest first):

```typescript
import { T_Graph, T_Detail, T_Kinship, T_Startup, T_Breadcrumbs } from '../common/Global_Imports';
// Ordered by length: T_Graph (7), T_Detail (8), T_Kinship (9), T_Startup (9), T_Breadcrumbs (12)

import { T_Preference, T_Cluster_Pager, T_Auto_Adjust_Graph } from '../common/Global_Imports';
// Ordered by length: T_Preference (12), T_Cluster_Pager (14), T_Auto_Adjust_Graph (18)

import { g, k, p, s, g_graph_tree, features } from '../common/Global_Imports';
// Ordered by length: g (1), k (1), p (1), s (1), features (8), g_graph_tree (12)
```

## Manager Instance Access

- Import from `Global_Imports`: `import { g, k, p, s, x } from '../common/Global_Imports'`
- Access properties/methods directly: `g.layout()`, `k.empty`, `s.w_hierarchy`
- Destructure when needed: `const { w_t_graph } = show;`
