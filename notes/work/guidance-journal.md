# Guidance Journal

Chronicle of guide and work file evolution, extracted from timestamps in the files themselves.


**December 31, 2024** Tested MCP filesystem access. Despite intermittent "Server disconnected" errors, `Filesystem:list_directory` returned full directory listing. Documented that errors can be safely ignored. Added troubleshooting section to `guides/collaborate/access.md`.


**2025** Started webseriously as graph visualization tool. Built di as quaternion rotation demo, rebuilding a 20-year-old CAD program. Developed collaboration workflow with Claude through trial and error — CLAUDE.MD files, structured guides, work tracking. The pattern emerged: Claude handles execution and analysis, I handle direction and distillation.


**January 2025** Migrated to monorepo structure. Created `mono/` with unified docs, yarn workspaces, and consolidated tooling. Documented in `guides/setup/monorepo.md`.


**January 8, 2026** Wrote `work/next/pacing.md`. Captured the insight that this project moves differently — the gap between thinking and seeing has collapsed. Started the **commoditize** effort to package the AI collaboration methodology. Phase 1 complete: created `enhanced` repo with template CLAUDE.MD and starter structure. See `work/next/commoditize.md`.


**January 9, 2026** Started the hub app — browser-based dashboard for managing local dev servers. Defined port assignments, keyboard shortcuts, UI components. See `guides/develop/hub-app.md` and `guides/setup/hub-app-spec.md`.


**January 12, 2026** Started **monorepo migration** (`work/done/monorepo.md`). Used `git subtree add` to pull in ws, di, shared, enhanced with history. Discovered subtree doesn't preserve per-file history. Accepted the tradeoff — original repos exist if needed.


**January 14, 2026** Multiple work streams:
- **Cleanup audit** (`work/next/cleanup.md`) — found stale paths pointing to old `~/GitHub/shared` structure, TOCs out of sync.
- **Single-line progress display** (`work/done/single-line-progress.md`) — built `\r\033[K` trick for calm terminal output, hub console polling.
- **Hub console progress** (`work/done/sites-hub.md`) — live progress for Restart and Rebuild Docs, direct Python process management.
- **Guides clutter** (`work/done/guides-clutter.md`) — started thinking about minimal guide set.


**January 17, 2026** Fixed MCP connection issue in Claude Desktop. Root cause: npm prefix pointed to `.nvms` while node binary lived in `.nvm`. Solution: bypass npx entirely, call node directly with full path.


**January 18, 2026** Built `[+]` checkbox support for VitePress — orange box with "?" for "fixed but awaiting review" state. Created custom markdown-it plugin. Also created the journal system itself — `notes/work/journal.md` and documented format rules in `guides/collaborate/journals.md`. Added Code Analysis Discipline to chat.md (verify return types, trace call chains, quote signatures).


**January 21, 2026** Created `guides/collaborate/gating.md`. Documented the discovery that lessons acknowledged mid-conversation don't reliably stick. Identified the SKILL.md pattern from Claude's system prompt as a working solution. Core insight: ambient context is available but not active — principles need to be **gates** (checkpoints Claude must pass through before acting).
