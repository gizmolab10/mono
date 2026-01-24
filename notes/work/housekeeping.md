- [x] explain why we need "w_rubberband_grabs"
- [x] promote di and ws out of projects and up to mono itself and delete projects
- [x] move sites and tools from mono into mono/notes
- [ ] make sure everything in hub app still works (run manual test checklist)

---

## Filesystem Migration Plan

### Target Structure
```
mono/
  CLAUDE.MD
  di/                    ← from projects/di
  ws/                    ← from projects/ws
  notes/
    guides/
    work/
    sites/               ← from mono/sites
    tools/               ← from mono/tools
```

### Path Breakage Risk
Files that may reference old paths:
- CLAUDE.MD, shorthand.md
- package.json workspaces
- vite/tsconfig/vitepress configs
- Import statements with relative paths
- Hub app (api.py, servers.sh, ports.json)
- Netlify deploy configs

### Operations
1. Move `mono/projects/di` → `mono/di`
2. Move `mono/projects/ws` → `mono/ws`
3. Move `mono/sites` → `mono/notes/sites`
4. Move `mono/tools` → `mono/notes/tools`
5. Delete empty `mono/projects`
6. Update paths in CLAUDE.MD, shorthand.md, configs, scripts

### Change Map

| File | Line | Current | After |
|------|------|---------|-------|
| `package.json` | 8 | `"projects/*"` | `["di", "ws"]` |
| `di/vite.config.ts` | 3 | `../../sites/ports.json` | `../sites/ports.json` |
| `ws/vite.config.js` | 3 | `../../sites/ports.json` | `../sites/ports.json` |
| `sites/servers.sh` | 53 | `projects/ws\|yarn dev` | `ws\|yarn dev` |
| `sites/servers.sh` | 54 | `projects/ws\|...docs:dev` | `ws\|...docs:dev` |
| `sites/servers.sh` | 55 | `projects/di\|yarn dev` | `di\|yarn dev` |
| `sites/servers.sh` | 56 | `projects/di\|...docs:dev` | `di\|...docs:dev` |

After ops 3-4:
- `sites/servers.sh` → `notes/sites/servers.sh`
- `tools/health.sh` → `notes/tools/health.sh`
- `tools/validate-paths.ts` → `notes/tools/validate-paths.ts`

### Execution Flow
```
SEARCH — notes/tools/validate-paths.ts (once, before starting)
MAP — document all changes needed (this file)

for each operation 1-6:
  ONE OP — do it
  CHECKPOINT — bash notes/tools/health.sh
  confirm → next op
  fail → PANIC BUTTON, diagnose before continuing
```

### Test Suite
```bash
cd ~/GitHub/mono && npx tsx notes/tools/validate-paths.ts   # path references (~2s)
cd ~/GitHub/mono && bash notes/tools/health.sh              # paths, workspaces, builds (~15s)
cd ~/GitHub/mono && bash notes/tools/health.sh --full       # + docs, tests (~40s)
```

| Situation                       | Benefit                   | Cannot Detect                              |
| ------------------------------- | ------------------------- | ------------------------------------------ |
| **default**                     |                           |                                            |
| After each migration op         | Catch path breakage early | Runtime errors, .sh/.json paths            |
| After `git pull`                | Builds before you start   | Logic bugs                                 |
| After resolving merge conflicts | Merge introduced errors   | Broken logic                               |
| **--full**                      |                           |                                            |
| Before commit                   | Don't push broken code    | Browser bugs, perf regressions             |
| Before deploy                   | Last line of defense      | Might fail in production                   |
| After `yarn upgrade`            | Deps can break anything   | Silent library changes, version mismatches |
| "Darn, it worked yesterday"     | Narrow down the culprit   | Poor test coverage, corrupt data           |

### Manual Test Checklist

| #   | Test                     | Command / Action                                            | Expected                                   |
| --- | ------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| 1   | ws dev server            | cd ~/GitHub/mono/ws && yarn dev                             | Runs on localhost:5172                     |
| 2   | di dev server            | cd ~/GitHub/mono/di && yarn dev                             | Runs on localhost:5173                     |
| 3   | Hub static server        | cd ~/GitHub/mono/notes/sites && python3 -m http.server 5170 | localhost:5170 shows hub UI                |
| 4   | Hub API server           | cd ~/GitHub/mono/notes/sites && python3 api.py              | API server running on localhost:5171       |
| 5   | Hub: open ws app         | Click ws button, ensure App mode, click Local               | Opens localhost:5172                       |
| 6   | Hub: open di app         | Click di button, ensure App mode, click Local               | Opens localhost:5173                       |
| 7   | Hub: top row docs button | Click docs button (top row, next to vite)                   | Console shows progress, completes          |
| 8   | Hub: vite button         | Click vite button (top row) or press Esc                    | Console shows restart progress             |
| 9   | Hub: api button          | Click api button (top row)                                  | Console shows API restarted                |
| 10  | ws docs dev              | cd ~/GitHub/mono/ws && yarn docs:dev                        | VitePress starts                           |
| 11  | di docs dev              | cd ~/GitHub/mono/di && yarn docs:dev                        | VitePress starts                           |
| 12  | mono docs dev            | cd ~/GitHub/mono && yarn docs:dev                           | VitePress starts                           |
| 13  | Git status               | cd ~/GitHub/mono && git status                              | Shows moved files, no unexpected deletions |

Tests 1-2 and 10-12: run in separate terminals. Tests 5-9: require hub (5170) + API (5171) running.
