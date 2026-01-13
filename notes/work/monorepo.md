# Monorepo Migration

**Started:** 2025-01-12  
**Status:** Phase 4 in progress

## Problem

Multiple repos (ws, di, shared, enhanced) with duplicated code, separate doc sites, and no shared tooling. Context switching between projects is friction-heavy.

## Goal

Single monorepo with:
- Unified docs at root
- Shared code in `@work/core`
- Projects as workspaces
- One hub to launch all dev servers

## File Structure

```
mono/
├── notes/                    # unified docs (VitePress)
│   ├── guides/               # collaboration, style guides
│   ├── tools/
│   │   └── sites/            # hub: servers.sh, api.py, ports.json
│   └── work/                 # work-in-progress files
├── projects/
│   ├── core/                 # @work/core - shared utilities
│   │   └── src/
│   │       ├── Extensions.ts
│   │       └── index.ts
│   ├── di/                   # design intuition app
│   ├── ws/                   # webseriously app
│   ├── sh/                   # shared (docs, tools)
│   └── en/                   # enhanced
├── node_modules/
├── package.json              # workspace root
└── yarn.lock
```

## Phase 0: Backup ✅

- [x] Create backup of ~/GitHub/work

## Phase 1: Docs Consolidation ✅

- [x] Copy docs from all projects to unified `mono/notes/`
- [x] VitePress config at root serves all docs
- [x] Unified docs on port 5175

## Phase 2: Workspace Structure ✅

- [x] Create `mono/projects/` with ws, di, sh, en, core
- [x] Root package.json with workspaces
- [x] Copy hub files to `mono/notes/tools/sites/`
- [x] Update servers.sh paths for monorepo structure
- [x] Rename shared → sh, enhanced → en

## Phase 3: Git Consolidation ✅

- [x] Update CLAUDE.MD files with monorepo paths
- [x] Commit changes to original repos
- [x] git init in mono
- [x] git subtree add for each project
- [x] Push to GitHub

**Note:** Subtree didn't preserve file history — commits show but `git log <file>` doesn't trace back. History lives in original repos at `~/GitHub/work/` if needed. Decided to accept this and move forward.

## Phase 4: Extract Shared Code

- [x] Create `mono/projects/core/` scaffold — exists but empty
- [x] Tests pass in di (206 tests)
- [x] Tests pass in ws (66 tests)

**Deferred:** ws has circular deps that block @work/core migration. Fixed ws test issues (Visibility.ts import, test guards, deleted broken serializers.test.ts). Both projects pass tests with their own Extensions.ts.

- [ ] Add package.json for @work/core — needs verification
- [ ] Copy Extensions.ts to core — reverted, core is empty
- [ ] Copy Extensions.test.ts to core — reverted
- [ ] Create index.ts export — reverted
- [ ] Tests pass in core — no tests to run
- [ ] Add @work/core dependency to di — reverted
- [ ] Update di test import to use @work/core — reverted
- [ ] Delete Extensions.ts from di — reverted, di has its own
- [ ] ws uses @work/core — DEFERRED
- [ ] Verify ws app runs — not tested yet
- [ ] Verify di app runs — not tested yet
- [ ] Commit phase 4

## Phase 5: Cleanup

- [ ] Delete old repos from ~/GitHub/work/ (or rename to -archive)
- [ ] Update Netlify configs for monorepo paths
- [ ] Fix di app vs docs serving same content issue
- [ ] Final verification of all sites

## Next Action

**Phase 4:** Run ws tests, fix any remaining Extensions imports

---

## Issues Surfaced (Non-Mono)

### Testworthy_Utilities import path
- di test file had wrong path: `../utilities/` instead of `../common/`
- Fixed during this session

### ws package.json version
- Was `"0.1"` — invalid semver
- Fixed to `"0.1.0"`

### localStorage in tests
- Colors tests log warnings about localStorage not defined
- Expected in Node/vitest — not a real failure

### di app vs docs same content
- https://designintuition.app serves docs instead of app
- Likely Netlify config issue — deferred to Phase 5

### ws circular dependencies
- Attempted to migrate ws to @work/core
- Tests failed: `core` undefined when `Visibility.ts` constructor runs
- Root cause: circular imports through Global_Imports.ts
- Managers instantiate at module load time, depend on other managers not yet defined
- Reverted ws to use local Extensions.ts
- Future: refactor ws to break circular deps before migrating to @work/core

---

## Guide Updates Made

Added to `mono/notes/guides/collaborate/chat.md`:
- **File Freshness** — always re-read files before comparing or making claims
- **Destructive Commands** — one at a time, confirm before rm -rf
- **Package Manager** — use yarn, not npm
- **Paths and Locations** — always specify wd, relative to ~/GitHub

---

## Design Decisions

### Sharing code via @work/core

**Problem:** When extracting shared code to core, every file importing it needs updating. Options considered:

1. **Symlinks** — Replace deleted Extensions.ts with symlink to core's version
   - Git tracks symlinks as text (the path), not real links
   - Windows handles symlinks poorly
   - Requires post-clone setup script
   - Another failure point

2. **Sed replace imports** — One-time bulk replace `../common/Extensions` → `@work/core`
   - Works on all platforms
   - No setup scripts
   - But: repeat for every future extraction

3. **Keep duplication** — Don't extract, copy code to each project
   - Simpler initially
   - Drift over time, bugs fixed in multiple places

**Decision:** Sed replace, combined with Global_Imports pattern.

Most files already import from Global_Imports.ts, which re-exports @work/core. Only outlier files (those avoiding Global_Imports for circular dep reasons) need direct imports fixed.

Future extractions: update Global_Imports.ts, most files get it automatically. Outliers are a fixed, small set.
