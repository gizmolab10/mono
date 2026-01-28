# Guidance Journal

Chronicle of guide and work file evolution, extracted from timestamps in the files themselves.


**December 31, 2024** Tested MCP filesystem access. Despite intermittent "Server disconnected" errors, `Filesystem:list_directory` returned full directory listing. Documented that errors can be safely ignored. Added troubleshooting section to `guides/collaborate/access.md`.


**January 2025** (ws) Milestones 125-129. Fixed thing ID translation during import. Built display details for controlling tiny dots visibility. Major refactor: rewrote S_Title_Edit using Mouse Responder pattern — the old title editor was fragile, new one treats editing as a proper mouse interaction state. Added TypeDoc. Ancestry-centric architecture work begins — moving toward ancestry as the primary abstraction rather than things.


**February 2025** (ws) Milestones 130-133. Completed new Ancestry-centric architecture — ancestry now owns its G_Widget, title clipping during edit fixed. Achieved fast and smooth response to editing and rotating. Much cleaner rings UX in radial mode. Added bidirectional relationship lines. New control to show related relationships.


**March 2025** (ws) Milestones 133-134. New panel layout with box around controls and breadcrumbs. New Tools section in Details — buttons grid for actions. Added depth limit slider wired to graph. Gull wings (quarter-circle SVG arcs) at line intersections for visual polish. Separator aesthetics work.


**April 2025** (ws) Milestones 135-140. Wired all tools buttons: show all, add/delete parent/related. Started CSV import work for Marianne's data. Fixed font size bug in segmented controls. Reorganized Details to always show title. Began work on tags extraction from CSV.


**May 2025** (ws) Milestones 141-149. Brand new Details view with hideables and v-stack. Tags table now reads from Firebase. Details banners use glowing buttons for next/previous on traits and tags. Depth limit fully wired to graph with relayout. Use filled dots to indicate grabbed. Detect and respond to control key for help overlay. Improved recents button logic. Hover indication working everywhere.


**June 2025** (ws) Milestones 150-160. Peak month — 153 commits. Began dual zoom work. Autorepeat for action buttons. **Started Bubble.io plugin** — major multi-month effort. Implemented Vincent's UI suggestions (inverted hover sense on glow buttons). Moved tree preferences into tree graph pane. Plugin now sends valid data. Plugin receives data from Bubble. Added focus and grabs to plugin fields. Adopted Vincent's proposal for parents/related data structure. New zoom buttons in upper left. Wire up focus and grabs events. **Finished rubberband selection** — command-drag to select multiple, works in both tree and radial.


**July 2025** (ws) Milestones 162-169. Fixed editing/layout/color/hover bugs, added print utility for exporting graphs. Suppress select/focus events during data download (plugin stability). Built super-fast search (initially disabled). Removed tab from search filters. Search controls moved to left of breadcrumbs. Needed for Bubble plugin publishing — prepared for production. Revised Bubble plugin API with better event names.


**August 2025** (ws) Milestones 170-172. Major refactor: `isOut` → `isHovering` with nearly perfect app-wide hover behavior. Tags and traits details now correctly use S_Items pattern. Enforce radial view for non-standalone UX (Bubble embed mode). Plugin arrays, grab/focus event refinements.


**September 2025** (ws) Milestones 173-176. Decreased spacing everywhere, introduced Bubble theme. Click on drag dot to become focus (not just show border). **New hover system completed** — adopted RBush spatial index for hover detection. Renamed hover manager as hits. Curved cluster titles in radial. Further refinements to radial UX.


**October 2025** (ws) Milestones 177-178. **"Mouse responder is dead!"** — eliminated the old mouse handling abstraction entirely. Fully isolated mouse logic within hits manager (double-click, long-click, autorepeat all centralized). Hover system refactoring proposal written. **Claude Code collaboration begins** — created CLAUDE.md, first PRs from claude branches, AI-assisted state migration work.


**November 2025** (ws) Milestones 179-181. New Styles manager centralizes all color computation — dynamic widget/button colors based on context. Finished integrating new breadcrumbs history type (navigate through recents). Restore grabs when navigating history. Major store refactoring: moved writables from Stores to UX, converted w_ancestry_focus into derived readable. Netlify deployment work.


**December 2025** (ws) Milestones 182-183. Finished show children counts as numbers in reveal dots. Fully wired dynamic/static focus control. **Installed VitePress** for documentation website. Massive documentation reorganization. Breadcrumb composition refactoring (and reverted when it broke things). Radial reveal dot bug fixes.


**January 4-8, 2026** (di) Created the project. Vite + TypeScript + Svelte 5 from day one. Built quaternion POC: two nested cubes rotating independently, wireframe rendering with depth-based opacity. Proof that gl-matrix + Canvas 2D pipeline works without gimbal lock. Established the manager pattern (Scene, Camera, Render, Input, Animation). Created the notes structure that would become the collaboration workflow. Milestone 1 (solid foundation) and Milestone 2 (panel layout) completed. Set up dual Netlify deployments: docs.designintuition.app (VitePress) and designintuition.app (main app). Milestone 3 (document publishing) and Milestone 4 (hits manager borrowed from ws) done.


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
