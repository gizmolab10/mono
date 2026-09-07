# Combined Docs Architecture

## Task History

- [x] Create `~/GitHub/shared/` repo with CLAUDE.MD and guides/
- [x] Update di/CLAUDE.MD: add `COMMON: Read ../shared/CLAUDE.MD`
- [x] Update webseriously/CLAUDE.MD: same
- [x] Delete now-redundant files from di
- [x] Delete now-redundant files from webseriously
- [x] Consolidate tools (parameterized scripts in shared, config in projects)
- [x] Move test fixtures to shared/tools/docs/
- [x] Split reference content into guides/collaborate/docs.md
- [x] Create onboarding.md — junior dev setup guide
- [x] Create jonathan.md — PAT setup (Jonathan only)
- [x] Remove PAT section from onboarding.md (moved to jonathan.md)

## Consolidation Confirmed

**Shared repo:**
- `guides/collaborate/` — access, chat, docs, voice, workflow
- `guides/develop/` — aesthetics, jonathan, markdown, migration, onboarding, refactoring, style
- `guides/test/` — debugging, testing
- `tools/` — parameterized scripts, TypeScript libs, test fixtures
- `work/done/` — completed task tracking

**ws/notes/guides/:**
- `composition.md` — Svelte 4 patterns
- `gotchas.md` — Svelte 4 issues
- `index.md`
- `plugin.md` — Bubble integration

**ws/notes/tools/:**
- `config.sh`
- `dist/`
- `index.md`

**di/notes/guides/:**
- `develop/best.practices.md` — Svelte 5 patterns
- `develop/gotchas.md` — Svelte 5 issues
- `index.md`
- `road.map.md`

✅ Complete — ready to commit and push all three repos.
