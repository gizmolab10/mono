# Public Deliverables
**Started:** 2026-01-14  
**Status:** Complete ✅

## Problem
Needed a public-facing deliverables page for the Catalist demo. The "visit material" button in BuildNotes needed a working URL.

## Solution
Moved mono-docs to `sites/docs/` and deployed to Netlify.

## Completed

### Infrastructure
- [x] Move `.vitepress/` to `sites/docs/`
- [x] Update config.mts srcDir to `../../notes`
- [x] Move netlify.toml to `sites/docs/`
- [x] Update prebuild path in netlify.toml (`../../tools/docs/prebuild.sh`)
- [x] Set Netlify base directory to `sites/docs`
- [x] Add `sites/docs/package.json` with vitepress dependency
- [x] Update root `package.json` scripts to `cd sites/docs && vitepress build`
- [x] Update .gitignore with `**/.vitepress/cache/` and `**/.vitepress/dist/` wildcards

### UI
- [x] Add round button to BuildNotes (bottom left)
- [x] Wire up button click handler

### Tooling Fixes
Updated tools to handle mono's new `sites/docs/` layout:

**fix-links.ts:**
- Added `findBuildFile()` — checks `sites/docs/vitepress.build.txt` first
- Added `findConfigPath()` — checks `sites/docs/.vitepress/config.mts` first

**sync-sidebar.ts:**
- Added `findConfigPath()` — same pattern
- Fixed srcDir resolution to use `siteRoot` (parent of `.vitepress/`) not repo root
- Fixed backup directory to be relative to config location

**update-project-docs.sh:**
- Added `BUILD_OUTPUT` variable — writes to `sites/docs/vitepress.build.txt` for mono layout

### DNS & Cleanup
- [x] Point `docs.gizmolab.com` to mono-docs Netlify
- [x] Update hub config with new public URLs
- [ ] Retire separate ws-docs and di-docs Netlify sites (check if they watch mono repo first)

## Key Learnings

**Netlify base directory:** When set, all paths in netlify.toml are relative to it. The build command runs from there, so `../../tools/docs/prebuild.sh` is correct.

**vitepress srcDir:** Relative to where vitepress runs (the directory containing `.vitepress/`), not relative to `.vitepress/config.mts`.

**gitignore wildcards:** `**/` prefix matches at any depth. Useful for `.vitepress/cache/` that could exist in multiple locations.

**Build output location:** `yarn docs:build > file.txt` writes relative to where the shell runs, not where vitepress runs. Need to explicitly set the output path for mono layout.
