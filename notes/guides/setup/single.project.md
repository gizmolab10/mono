# Single Project

**Started:** 2026-01-11 | **Status:** Analysis complete

## Problem

Four separate repos with:
- Duplicated code (Extensions.ts nearly identical between di and ws)
- Duplicated tooling (vitepress, vitest configs)
- Separate node_modules (disk bloat)
- Four .git histories to manage
- Scattered documentation
- No code sharing despite clear overlap

## Goal

Monorepo with shared code, single workspace, separate deployable apps, unified docs.

---

## Current State

| Project | Purpose | Tech | Has Code | Has Docs |
|---------|---------|------|----------|----------|
| **ws** | Graph visualization app | Svelte 4, Vite, VitePress | ✓ (large) | ✓ |
| **di** | Quaternion rotation demo | Svelte 5, Vite, VitePress | ✓ (medium) | ✓ |
| **shared** | Common docs/tools | VitePress only | ✗ | ✓ |
| **enhanced** | ? (minimal) | None | ✗ | ✓ (small) |

### Code Overlap Found

| Directory | ws | di | Shareable? |
|-----------|----|----|------------|
| `src/lib/ts/common/Extensions.ts` | ✓ | ✓ | **YES** - nearly identical |
| `src/lib/ts/common/Constants.ts` | ✓ | ✓ | Likely |
| `src/lib/ts/signals/` | ✓ | ✓ | Likely |
| `src/lib/ts/types/` | ✓ | ✓ | Likely |
| `src/lib/ts/managers/` | ✓ | ✓ | Possibly |
| `src/lib/ts/state/` | ✓ | ✓ | Possibly |
| `src/lib/ts/runtime/` | ✓ | ✓ | Possibly |

### Shared Dependencies

Both use: `gl-matrix`, `rbush`, `color2k`, `typed-signals`, `uuid`, `vitepress`, `vitest`

---

## Proposal: Yarn/npm Workspaces Monorepo

```
~/GitHub/work/
├── package.json              # Root workspace config
├── work.code-workspace       # Single VSCode project
├── CLAUDE.MD                 # Unified collaborator context
├── notes/                    # Combined documentation
│   ├── guides/               # From shared (collaboration, develop, test)
│   ├── projects/
│   │   ├── di/               # di-specific docs (architecture, designs, milestones)
│   │   ├── ws/               # ws-specific docs (architecture, work)
│   │   └── enhanced/         # enhanced docs
│   └── work/                 # Active work tracking
├── packages/
│   ├── core/                 # Shared TypeScript library
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── common/       # Extensions.ts, Constants.ts
│   │   │   ├── signals/      # Shared signal utilities
│   │   │   ├── types/        # Common type definitions
│   │   │   └── geometry/     # Math utilities (from ws)
│   │   └── tests/
│   ├── di/                   # Design Intuition app
│   │   ├── package.json      # depends on @work/core
│   │   ├── src/
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── ws/                   # WebSeriously app
│       ├── package.json      # depends on @work/core
│       ├── src/
│       ├── index.html
│       └── vite.config.ts
├── .vitepress/               # Single docs site
└── .git/                     # Single repo (or keep separate with git submodules)
```

### Key Decisions

| Aspect | Recommendation | Rationale |
|--------|----------------|-----------|
| **Package manager** | Yarn workspaces | Already using yarn in both projects |
| **Shared code** | `@work/core` package | Clean import: `import { ... } from '@work/core'` |
| **Git strategy** | Single repo | Simpler; submodules add complexity |
| **Svelte versions** | Keep separate (4 vs 5) | Apps can have different deps |
| **Docs** | Single VitePress site | Unified with project-specific sections |
| **VSCode** | One `.code-workspace` | All packages visible together |

---

## Migration Steps

### Phase 0: Backup (do this first!)
```bash
cp -r ~/GitHub/work ~/GitHub/work-backup-$(date +%Y%m%d)
```

---

### Phase 1: Docs Consolidation (quick win)
- [ ] Create unified `notes/` structure at root
- [ ] Move `shared/notes/guides/` → `notes/guides/`
- [ ] Move `di/notes/` → `notes/di/`
- [ ] Move `ws/notes/` → `notes/ws/`
- [ ] Move `enhanced/notes/` → `notes/enhanced/`
- [ ] Create single `.vitepress/` config at root
- [ ] One sidebar: Guides | DI | WS | Enhanced
- [ ] Delete old `.vitepress/` dirs from each project
- [ ] Verify `yarn docs:dev` works

**🔴 Panic button:**
```bash
rm -rf ~/GitHub/work/notes ~/GitHub/work/.vitepress
cp -r ~/GitHub/work-backup-*/di/notes ~/GitHub/work/di/
cp -r ~/GitHub/work-backup-*/ws/notes ~/GitHub/work/ws/
cp -r ~/GitHub/work-backup-*/shared/notes ~/GitHub/work/shared/
cp -r ~/GitHub/work-backup-*/enhanced/notes ~/GitHub/work/enhanced/
# Restore .vitepress dirs similarly
```

---

### Phase 2: Monorepo Structure
- [ ] Create root `package.json` with workspaces config
- [ ] Create `work/` directory for packages
- [ ] Move di → `work/di` (code only, notes already moved)
- [ ] Move ws → `work/ws`
- [ ] Move enhanced → `work/enhanced`
- [ ] Create `work/core` scaffold
- [ ] Single `yarn install` at root

**🔴 Panic button:**
```bash
rm -rf ~/GitHub/work/work ~/GitHub/work/package.json ~/GitHub/work/node_modules
# Original repos still in ~/GitHub/work/di, ws, etc.
```

---

### Phase 3: Git Consolidation
- [ ] Use `git subtree add` to preserve history:
  ```bash
  git subtree add --prefix=work/di ../di main
  git subtree add --prefix=work/ws ../ws main
  git subtree add --prefix=work/shared ../shared main
  git subtree add --prefix=work/enhanced ../enhanced main
  ```
- [ ] Verify `git log work/di` shows full history
- [ ] Archive old repos (don't delete yet!)

**🔴 Panic button:**
```bash
# Undo last subtree add
git reset --hard HEAD~1

# Undo all subtree adds (if you did 4)
git reset --hard HEAD~4

# Nuclear option: restore entire backup
rm -rf ~/GitHub/work
cp -r ~/GitHub/work-backup-* ~/GitHub/work
```

---

### Phase 4: Extract Shared Code
- [ ] Move `Extensions.ts` to `work/core`
- [ ] Move shared types to core
- [ ] Update imports in di and ws: `import { ... } from '@work/core'`
- [ ] Verify builds work

**🔴 Panic button:**
```bash
# Revert to before extraction
git checkout HEAD~1 -- work/core work/di work/ws

# Or restore specific files from backup
cp ~/GitHub/work-backup-*/di/src/lib/ts/common/Extensions.ts work/di/src/lib/ts/common/
```

---

### Phase 5: Cleanup
- [ ] Unified VSCode `work.code-workspace`
- [ ] Update CLAUDE.MD for new structure
- [ ] Update Netlify configs to point to monorepo subdirs
- [ ] Delete redundant files (old package.jsons in shared, etc.)
- [ ] **Only after living with it:** delete backup

**🔴 Panic button:**
```bash
# Full restore at any time (as long as backup exists)
rm -rf ~/GitHub/work
mv ~/GitHub/work-backup-* ~/GitHub/work
```

---

## Open Questions

1. **enhanced** - what is it? Keep or absorb?
2. **Git history** - preserve or start fresh?
3. **Deploy targets** - still separate Netlify sites?
4. **Naming** - `@work/core` or something else?

---

## Notes

