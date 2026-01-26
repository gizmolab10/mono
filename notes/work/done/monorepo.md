# Monorepo

**Migrated:** January 2025

## Structure

```
mono/
├── notes/                    # unified docs (VitePress)
│   ├── guides/               # collaboration, setup, develop, test
│   └── work/                 # work-in-progress tracking
├── projects/
│   ├── ws/                   # webseriously app (Svelte 4)
│   ├── di/                   # design intuition app (Svelte 5)
│   └── core/                 # @work/core - shared utilities (deferred)
├── sites/                    # hub: servers.sh, api.py, index.html
├── tools/                    # shared tooling (docs scripts)
├── package.json              # workspace root
└── yarn.lock
```

## Why Monorepo

Before: Four separate repos (ws, di, shared, enhanced) with:
- Duplicated code (Extensions.ts nearly identical)
- Duplicated tooling (vitepress, vitest configs)
- Separate node_modules (disk bloat)
- Four .git histories to manage
- Scattered documentation

After: Single repo with:
- Unified docs at `notes/`
- Shared tooling at `tools/`
- Projects as yarn workspaces
- One hub to launch all dev servers

## Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Package manager | Yarn workspaces | Already using yarn |
| Git strategy | Single repo via subtree | Simpler than submodules |
| Svelte versions | Keep separate (4 vs 5) | Apps can have different deps |
| Docs | Single VitePress + per-project docs | Unified guides, project-specific notes |
| Shared code | Deferred | ws has circular deps blocking @work/core |

## Git History

Used `git subtree add` to bring in each project. Note: file-level history doesn't trace back — `git log <file>` shows only post-merge commits. Full history lives in original repos at `~/GitHub/work/` if needed.

## Shared Code Status

**Deferred.** Attempted to extract Extensions.ts to `@work/core` but:
- ws has circular dependencies through Global_Imports.ts
- Managers instantiate at module load time, depend on other managers not yet defined
- Both projects pass tests with their own Extensions.ts

Future: Refactor ws to break circular deps before migrating to @work/core.

## Issues Surfaced

| Issue | Resolution |
|-------|------------|
| di app vs docs serving same content | Fixed Netlify base directory settings |
| ws circular dependencies | Deferred @work/core migration |
| localStorage warnings in tests | Expected in Node/vitest — not a failure |
| netlify.toml conflicts | Deleted all toml files, use dashboard settings |
| sync-sidebar.ts wrong config | Fixed to detect project context |
