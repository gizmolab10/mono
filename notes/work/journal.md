# Journal

**Summary** Started webseriously as graph visualization tool. Built di as quaternion rotation demo, rebuilding a 20-year-old CAD program. Developed collaboration workflow with Claude through trial and error — CLAUDE.MD files, structured guides, work tracking.

---

**February 18-19, 2026** (di) **Milestone 17** — SO Library. Library panel in details: bundled defaults via glob import, user-created files in IndexedDB. Click loads, option-click inserts as child. Save writes IDB + downloads backup file. Reorganized details UX — unified slot padding, disabled cells use accent color, moved add-child to far right, moved show/hide back to name-row. Reset preferences button (clears localStorage except scene/library). (mo) Guide reorganization — absorbed `simplicity.md` into `workflow.md` and `motive.md`, moved co discipline rules (approval gate, implementation, debugging, refactoring, file ops) from `workflow.md` to `chat.md`, moved origin story and philosophy to `motive.md`. Updated cross-references in `gates.md` and `kinds.of.tasks.md`.


**February 15-17, 2026** (di) **Milestone 16** — Formulas. Alias resolution (`x` → `x_min`, `w` → width), bare attributes reference self, dot-prefix references parent (`.x`), cross-SO references (`A.x`). Empty formula defaults to `parent.attribute + value`. Invariant attributes derive from other two in axis (`x = X - w`). Fixed compound imperial parsing (`1 1/2"`), value display, invariant persistence bugs. Simplified serialization encoding. Improved slider UX.


**February 14, 2026** (di) **Milestone 15** — Attributes. Nine-row attribute table (x, X, w, y, Y, h, z, Z, d) with formula and value columns. Three-row orientation table (axis angles). New `Axis` class. File encoding v3. Invariant column and locked rotation. Major cleanup — simplified encoding/storage, removed cruft. Details cosmetic tweaks, enumerations for T_Details and T_Layers.


**February 11-13, 2026** (di) **Milestone 14** — Details and editing polish. Segmented control for face selection. Rotation confined to single axis, composited quaternions. Pixel-perfect canvas editing — 2D snap, rotation snap, face labels, improved dimensional occlusion. Better 2D mode.


**February 9-10, 2026** (di) Import/export. Accent color picker. Better selection UX — drag corners/edges and rotate working well. Improved 2D mode, simplified Coordinates.


**February 8, 2026** (di) Face intersection lines — compute dihedral intersection for SO pairs that don't share axes. Cross product for line direction, Cyrus-Beck clipping for endpoints. Cruft cleanup — converted singleton functions to singleton classes, fixed mixed bugs. (mo) Distilled learn.md — 10 raw entries cleared, 3 new pitfalls added (observe before speculating, no abbreviations in code, "here" means chat output).


**February 7, 2026** (di) **Milestone 13** — Algebra engine, phases 1–4. Recursive descent compiler: tokenizer handles unit literals (6", 5', 2.5 mm) and SO references (wall.height), parser respects operator precedence. Forward eval, reverse propagation, cycle detection. Constraints module wired into Editor — formula on an attribute triggers eval, commit triggers propagation. Phase 4: orientation — fixed vs variable children. Fixed: rotate sets quaternion, origin stays put. Variable: endpoints track parent bounds, angle recomputes from geometry. 377 tests passing.


**February 6, 2026** (di) **Milestone 11** — Units. All dimensions stored in mm, displayed per user preference. 22 units across 4 systems (imperial, metric, marine, archaic). Imperial gets fractional display (5 1/4") and compound formatting (5' 3 1/4"). Inline dimensional editing — click a dimension label, type a value, Enter applies. Parser accepts any format regardless of current system. **Milestone 10** — Controls UI. Scale slider with logarithmic mode, compound slider (ported from ws), vertical/horizontal steppers, scale value display. Unit system switcher, precision segmented control (imperial: 1/2 through 1/64; metric: 0–3 decimals), 2D/3D toggle, straighten button. Scale SOT moved to Svelte writable store.


**February 5, 2026** (di) **Milestone 9** — Persistence. JSON serialize SO state (bounds, orientation, scale) + camera (eye, center, up). Auto-save to localStorage on drag, restore on load, reset button. **Milestone 12** — Hierarchy. Multiple named SOs with parent/child relationships. Name input in details, SO selector buttons, face labels on front-facing faces. Add child: smallest parent dimension ÷ 2, axes aligned. Cruft audit — catalogued unused code, redundant coordinate methods, over-engineered debug logging, scattered stores. Tagged "leave alone" items.


**February 4, 2026** (di) **Milestones 6–8**. Build Notes (M6) — structured progress tracking overlay with steppers and close button. Edit Drags (M7) — bounds-based geometry (6 values instead of 8 vertices), drag edges/corners confined to selected face plane, ray-plane projection for world-space deltas. Dimensionals (M8) — three algorithms: silhouette edge detection (A), witness plane via screen-space perpendicularity (B), crunch detection with projected text gap (C). Editable dimension text — click, type, Enter updates geometry with symmetric resize. (mo) Guide system refinement. Compressed `always.md` from detailed rules to 5-line checklist. Renamed `always.longer.md` → `pitfalls.md` (edge cases that cause mistakes). Created `tools.md` for tool-specific gotchas (write_file vs create_file, tool cycling on failure). Added `pitfalls.md` to session-start pre-flight and keyword triggers for "rename", "doesn't exist", "not found", "which one".


**February 3, 2026** Created `me/` project — third mono project alongside ws and di for ideas, research, creative exploration. Hub app: added `me` button (J), renamed `mono`→`mo` (M), auto-switch mode when clicking projects without config (app+mo→docs, docs+me→app), renamed md→resume button (R), consolidated all URLs into ports.json (single source of truth), simplified initConfig to build from ports.json. Cross-project links: implemented comment-based approach for Obsidian/VitePress compatibility (`[text](relative) <!-- @project/path -->`). Added `.env` config file support to dispatcher. Reorganized work files: renamed feedstock→adapt, merged guidance-journal into journal. (di) **Milestone 5** complete — integrated Hits_3D into main Hits manager: RBush 2D first, 3D fallback for Smart Objects.

**February 1, 2026** Hub app updates. Tests button with `;` shortcut runs both ws and di tests. Deploy status tooltip fix for missing Netlify token. Title buttons turn green while working, status dot repositioned behind "Mono" title, deploy status skips canceled builds. Button renames: localhosts → hosts, dispatcher → relay.

**January 28, 2026 (ws)** Selection fixes: shift-click on multiply-selected now deselects all, deselect-all no longer selects root, breadcrumb click changes focus AND level, radial mode focus change selects the focus, background click deselects all, rubber band fixed.

**January 28, 2026 (afternoon)** Netlify deployment fixes. Fixed base directory paths, added nohoist for Svelte version isolation, removed unused packages from ws. WS notes reorganization — moved architecture/ and collaborate/ to guides/. Fix-links path similarity scoring. Update-docs skip-if-unchanged logic.

**January 28, 2026** Guide system overhaul. Created pre-flight folder with gates.md, keywords.md, kinds.of.tasks.md, shorthand.md, workarounds.md. Slimmed CLAUDE.MD from 83 → 57 lines. Hub app refinements: deploy status tooltip, status dot, simpler docs rebuild progress. Retention test created — 5 probes to measure guide effectiveness.

**January 21, 2026** Created `guides/collaborate/gating.md`. Documented the discovery that lessons acknowledged mid-conversation don't reliably stick. Identified the SKILL.md pattern from Claude's system prompt as a working solution. Core insight: ambient context is available but not active — principles need to be **gates** (checkpoints Claude must pass through before acting).

**January 18, 2026** Checkbox plugin complete. Journal system established with format rules. Code analysis discipline added to chat.md — verify return types, trace call chains, quote signatures.

**January 17, 2026** Created journal, added `[+]` checkbox support across all VitePress sites. Built custom markdown-it plugin (`sites/markdown-it-task-list-plus.mts`) that transforms `[+]` into orange checkboxes with "?" — for "fixed but awaiting review" state.

**January 17, 2026** Fixed **MCP** connection issue in Claude Desktop. Root cause: npm prefix pointed to `.nvms` while node binary lived in `.nvm` — a split configuration I didn't know I had. When Claude Desktop launched the filesystem server via npx, it started with node v20 but subprocess calls found v14 in PATH, which crashed on modern syntax. **Solution: bypass npx entirely**, call node directly with full path to the installed module.

**January 15-16, 2026** WS bug fixes: levels slider wasn't updating graph (added `$w_depth_limit` to reactive trigger), color picker hover interference (new store to track picker state, suppress mouse events while open), text selection showing during drag (global `user-select: none`). Also styled indeterminate checkboxes in VitePress docs.

**January 14, 2026** Built single-line progress display for the dev hub. Now shows one updating line: "Step 3/7: Building docs..." with `\r\033[K` trick. Added live console to hub that polls status files. Discovered calling `servers.sh` from Python killed the API mid-process — switched to direct process management. Started cleanup audit — found stale paths and TOCs out of sync.

**January 12, 2026** Finished **monorepo** migration (Phase 3). Used `git subtree add` to pull in ws, di, shared, enhanced with history. Discovered subtree doesn't preserve per-file history. Attempted Phase 4: extract `Extensions.ts` to @work/core. Hit circular dependency wall in ws — reverted.

**January 11, 2026** Planned the **monorepo**. Four repos with duplicated code, separate node_modules, scattered docs. Key decision: yarn workspaces, single git repo (not submodules), `@work/core` for shared code.

**January 9, 2026** Started the hub app — browser-based dashboard for managing local dev servers. Defined port assignments, keyboard shortcuts, UI components.

**January 8, 2026** Wrote `pacing.md`. This project moves differently than webseriously — faster AND easier. The gap between thinking and seeing has collapsed. Pushed "enhanced" template to GitHub. Phase 1 of **commoditize** complete.

**January 8, 2026** (di) **Milestone 4** — Hits Manager. Ported the hits manager from ws. RBush-based hit detection with hover, click, long-click, and double-click handling.

**January 5-8, 2026** (di) **Milestone 3** — Document Publishing. Dual Netlify deployments: docs.designintuition.app (VitePress) and designintuition.app (main app) with SSL.

**January 6-7, 2026** (di) **Milestone 2** — Panel Layout. Clean panel layout with rounded-corner regions, separators, and fillets. Svelte 5 runes throughout.

**January 4-5, 2026** (di) **Milestone 1** — Solid Foundation. Created the project. Vite + TypeScript + Svelte 5 from day one. Built quaternion POC: two nested cubes rotating independently, wireframe rendering with depth-based opacity. Established the manager pattern (Scene, Camera, Render, Input, Animation). Dev environment, testing infrastructure, collaboration workflow system.

**December 2025** (ws) Builds 182-183. Finished show children counts as numbers in reveal dots. Fully wired dynamic/static focus control. **Installed VitePress** for documentation website. Massive documentation reorganization.

**November 2025** (ws) Builds 179-181. New Styles manager centralizes all color computation. Finished breadcrumbs history navigation. Major store refactoring: moved writables from Stores to UX.

**October 2025** (ws) Builds 177-178. **"Mouse responder is dead!"** — eliminated the old mouse handling abstraction entirely. Fully isolated mouse logic within hits manager. **Claude Code collaboration begins** — created CLAUDE.md, first PRs from claude branches.

**September 2025** (ws) Builds 173-176. **New hover system completed** — adopted RBush spatial index for hover detection. Renamed hover manager as hits. Curved cluster titles in radial.

**August 2025** (ws) Builds 170-172. Major refactor: `isOut` → `isHovering` with nearly perfect app-wide hover behavior. Enforce radial view for Bubble embed mode.

**July 2025** (ws) Builds 162-169. Fixed editing/layout/color/hover bugs, added print utility. Built super-fast search. Prepared Bubble plugin for production.

**June 2025** (ws) Builds 150-160. Peak month — 153 commits. **Started Bubble.io plugin**. **Finished rubberband selection** — command-drag to select multiple, works in both tree and radial.

**May 2025** (ws) Builds 141-149. Brand new Details view with hideables. Tags table reads from Firebase. Depth limit fully wired to graph with relayout. Hover indication working everywhere.

**April 2025** (ws) Builds 135-140. Wired all tools buttons. Started CSV import work. Reorganized Details to always show title.

**March 2025** (ws) Builds 133-134. New panel layout with box around controls and breadcrumbs. Gull wings (quarter-circle SVG arcs) at line intersections.

**February 2025** (ws) Builds 130-133. Completed new Ancestry-centric architecture — ancestry now owns its G_Widget. Much cleaner rings UX in radial mode. Added bidirectional relationship lines.

**January 2025** (ws) Builds 125-129. Fixed thing ID translation during import. Major refactor: rewrote S_Title_Edit using Mouse Responder pattern. Ancestry-centric architecture work begins.

**December 31, 2024** Tested MCP filesystem access. Despite intermittent "Server disconnected" errors, `Filesystem:list_directory` returned full directory listing.
