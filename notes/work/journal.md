# Journal

**Current** Fixed MCP, created this journal (distilled from work/done files), added `[+]` checkbox support across all VitePress sites. Built a custom markdown-it plugin (`sites/markdown-it-task-list-plus.mts`) that transforms `[+]` into orange checkboxes with "?" — for "fixed but awaiting review" state. Added plugin and CSS to mono, ws, and di configs.


**2025** Started webseriously as graph visualization tool. Built di as quaternion rotation demo, rebuilding a 20-year-old CAD program. Developed collaboration workflow with Claude through trial and error — CLAUDE.MD files, structured guides, work tracking. The pattern emerged: Claude handles execution and analysis, I handle direction and distillation.


**January 8, 2026** Wrote `pacing.md`. This project moves differently than webseriously — faster AND easier. The gap between thinking and seeing has collapsed. Say it, see it. Mere minutes from idea to artifact. Crazily like a lucid dream. Frees me, lets ideas settle, evolve. Pushed "enhanced" template to GitHub. Phase 1 of **commoditize** complete. The template captures the methodology: bidirectional docs, living guides, work tracking that survives sessions, context-switching rituals.


**January 11, 2026** Planned the **monorepo**. Four repos with duplicated code (`Extensions.ts` nearly identical), separate node_modules, scattered docs. Mapped out five phases with panic buttons at each step. Key decision: yarn workspaces, single git repo (not submodules), `@work/core` for shared code.


**January 12, 2026** Finished **monorepo** migration (Phase 3). Used `git subtree add` to pull in ws, di, shared, enhanced with history. Discovered subtree doesn't preserve per-file history — `git log <file>` doesn't trace back. Accepted it; original repos still exist if needed. Attempted Phase 4: extract `Extensions.ts` to @work/core. Hit circular dependency wall in ws — managers instantiate at module load time, depend on each other. Reverted. Both projects keep their own `Extensions.ts` for now.


**January 14, 2026** Built single-line progress display for the dev hub. Problem: `update-docs` spewed dozens of lines, hard to see what mattered. Now shows one updating line: "Step 3/7: Building docs..." with `\r\033[K` trick. Added live console to hub that polls status files. Discovered calling `servers.sh` from Python killed the API mid-process — switched to direct process management with `kill_port()` and `subprocess.Popen()`. Started cleanup audit. Found stale paths pointing to old `~/GitHub/shared` structure and TOCs out of sync with actual files. Listed everything, haven't fixed yet.


**January 15-16, 2026** WS bug fixes: levels slider wasn't updating graph (added `$w_depth_limit` to reactive trigger), color picker hover interference (new store to track picker state, suppress mouse events while open), text selection showing during drag (global `user-select: none`). Also styled indeterminate checkboxes in VitePress docs.


**January 17, 2026** Fixed **MCP** connection issue in Claude Desktop. Root cause: npm prefix pointed to `.nvms` while node binary lived in `.nvm` — a split configuration I didn't know I had. When Claude Desktop launched the filesystem server via npx, it started with node v20 but subprocess calls found v14 in PATH, which crashed on modern syntax. **Solution: bypass npx entirely**, call node directly with full path to the installed module. Industry standard is single `.nvm` directory; I had two competing setups.
