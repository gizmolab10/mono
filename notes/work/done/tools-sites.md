# Tools/Sites Migration

**Started:** 2026-01-26
**Status:** Complete

## Goal

Consolidate `notes/sites/` into `notes/tools/` and centralize logs to `mono/logs/`.

## What Moved

| From | To |
|------|-----|
| `notes/sites/` (hub app) | `notes/tools/hub/` |
| `notes/sites/docs/.vitepress/` | deleted (redundant, root `.vitepress/` already exists) |
| `notes/sites/markdown-it-task-list-plus.mts` | `mono/.vitepress/` |
| `notes/logs/` | `mono/logs/` |
| `notes/tools/logs/` | `mono/logs/` |
| `notes/tools/*.sh` (loose scripts) | `notes/tools/scripts/` |

## Files Updated

Config files with path changes:
- `mono/.vitepress/config.mts` — ports.json, plugin import
- `ws/.vitepress/config.mts` — plugin import
- `di/.vitepress/config.mts` — plugin import
- `ws/vite.config.js` — ports.json import
- `di/vite.config.ts` — ports.json import
- `notes/tools/hub/servers.sh` — hub dir, LOG_DIR
- `notes/tools/docs/update-project-docs.sh` — removed notes/sites/docs from sidebar sync

Documentation updates:
- `notes/guides/tools/hub-app.md` — all paths
- `notes/guides/setup/netlify.md` — script path
- `notes/guides/setup/access.md` — fixed `<project>` placeholders breaking VitePress
- `notes/index.md` — removed Sites link
- `notes/tools/index.md` — added hub/, scripts/

## Final Structure

```
mono/
  .vitepress/                    ← VitePress config (shared)
    config.mts
    markdown-it-task-list-plus.mts
  logs/                          ← all runtime logs

notes/tools/
  docs/                          ← docs tooling (sync-sidebar, etc.)
  hub/                           ← hub app (was notes/sites/)
    dispatcher.py
    index.html
    ports.json
    servers.sh
    start-hub.sh
  scripts/                       ← standalone utility scripts
    analyze-counts.sh
    delete-netlify-deploys.sh
    file-structure-check.sh
    update-docs.sh
    validate-paths.ts
```

## Lesson Learned

**Search ALL references before moving anything.**

Failed multiple times by doing piecemeal fixes instead of one comprehensive search upfront. Each fix revealed another broken path. The Refactoring Discipline exists for exactly this reason:

1. STOP
2. SEARCH all usages
3. LIST all files needing changes
4. WAIT for acknowledgment
5. CHANGE ALL at once
6. THEN TEST
