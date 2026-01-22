# Docs Reorganization
**Started:** 2025-01-06 | **Status:** Complete ✅

## Problem
Extra nesting in `notes/designs/` adds friction. Key folders buried one level too deep.

## Goal
Flatten by promoting folders to `notes/`, eliminating `designs/`.

## What We Did

1. **Moved directories** to `notes/`:
   - `architecture/`
   - `guides/`
   - `work/`

2. **Moved files** to `notes/`:
   - `overview.md` → `architecture/overview.md`
   - `index.md`
   - `digest.md`
   - `project.md`

3. **Deleted** empty `designs/` folder

4. **Fixed dead links**:
   - `CLAUDE.MD` — updated guides/work paths
   - `architecture/index.md` — layout.md → internals/layout.md
   - `index.md` — fixed relative paths to promoted folders
   - `project.md` — removed `notes/designs/` from paths

## Final Structure

```
notes/
├── architecture/
├── archives/
├── digest.md
├── guides/
├── index.md
├── project.md
├── tools/
└── work/
```
