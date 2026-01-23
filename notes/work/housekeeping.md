- [x] explain why we need "w_rubberband_grabs"
- [ ] promote di and ws out of projects and up to mono itself and delete projects
- [ ] move sites and tools from mono into mono/notes
- [ ] make sure everything in hub app still works

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
SEARCH — validate-paths.ts (once, before starting)
MAP — document all changes needed (this file)

for each operation 1-6:
  ONE OP — do it
  CHECKPOINT — bash tools/health.sh
  confirm → next op
  fail → PANIC BUTTON, diagnose before continuing
```

### Test Suite
```bash
cd ~/GitHub/mono && npx tsx tools/validate-paths.ts   # path references (~2s)
cd ~/GitHub/mono && bash tools/health.sh              # paths, workspaces, builds (~15s)
cd ~/GitHub/mono && bash tools/health.sh --full       # + docs, tests (~40s)
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
