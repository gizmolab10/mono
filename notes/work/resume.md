# Resume

**January 28, 2026 (early afternoon)**

## Netlify Deployment Fixes & Package Cleanup

Major cleanup of ws build configuration and dependencies.

**Netlify fixes:**

- [x] Fixed base directory paths (projects/ws → ws, projects/di → di)
- [x] Added nohoist in mono/package.json for Svelte version isolation (ws=4, di=5)
- [x] Added `define: { global: 'globalThis' }` in vite.config.js — Firebase uses `global` for environment detection

**Removed unused packages from ws:**

- [x] `neo4j-driver`, `pg`, `pg-promise`, `pg-query-stream` — server-only, never imported
- [x] `@sveltejs/kit`, `@sveltejs/adapter-netlify` — ws uses plain Vite, not SvelteKit
- [x] `@skeletonlabs/skeleton`, `@skeletonlabs/tw-plugin`, `@tailwindcss/typography` — no tailwind directives in source
- [x] `typedoc-plugin-markdown` — not referenced in typedoc.json
- [x] `vite-plugin-singlefile` — not in vite.config.js
- [x] `rollup` — Vite bundles its own

**Config cleanup:**

- [x] Removed SvelteKit block from svelte.config.js
- [x] Deleted tailwind.config.ts
- [x] Zero yarn warnings achieved

## WS Notes Reorganization

**Moved to guides:**

- [x] `ws/notes/architecture/` → `ws/notes/guides/architecture/`
- [x] `ws/notes/collaborate/` → `ws/notes/guides/collaborate/`
- [x] Updated ws/.vitepress/config.mts sidebar links
- [x] Updated ws/notes/index.md

**Removed ws/notes/tools/:**

- [x] Audited config.sh — all values just restated defaults
- [x] Removed dead code: DOCS_LOG_FILE, NETLIFY_SITE_ID, DOCS_SOURCE_DIR
- [x] Deleted entire folder (scripts use sensible defaults)

## Hub App

- [x] Renamed "pre-publish" button to "docs" in hub app

## Fix-Links Path Similarity

Improved `link-finder.ts` to auto-resolve ambiguous matches:

- [x] Added `scoreMatch()` — counts path segments shared with broken link
- [x] Added `selectBestMatch()` — picks highest score if clear winner
- [x] Updated `promptUserChoice()` — tries auto-select first, only skips if scores tied
- [x] Example: `./architecture/ux/search` → `guides/architecture/ux/search.md` (score 3) beats `work/next/search.md` (score 1)

## Update-Docs Skip-If-Unchanged

Added timestamp-based skip logic to `update-project-docs.sh`:

- [x] Added `--force` / `-f` flag to bypass check
- [x] Added `check_needs_rebuild()` — compares `.vitepress/.last-build` marker against sources
- [x] Checks: md files in notes/, config.mts, shared tools .ts files
- [x] Early exit with `○ $PROJECT_NAME up to date` if no changes
- [x] Touches marker after successful build
- [x] Added debug output in verbose mode
- [x] Updated .gitignore for marker files

## Guide Updates

- [x] Added to `chat.md`: "Reads logs/errors directly when debugging — never asks user to cat files co can access"

---

**January 28, 2026 (morning)**

## Hub App Refinements

Three improvements to the hub app dashboard.

**Deploy status tooltip** — Hover over "Work Sites" title shows per-site Netlify status:

- Format: `site: ✓ ready -2m` or `⋯ building` or `⊘ canceled` or `✗ error`
- Polls `/deploy-status` every 10s
- Handles canceled vs error distinction (canceled = not an error)

**Status dot** — Persistent colored indicator above title:

- Green = all ready/canceled
- Yellow = building/enqueued
- Red = error/failed

**Simpler docs rebuild progress** — Console shows compact format:

```
ws 3/7 build → bundling
ws 3/7 build → dead links: 2
ws 6/7 rebuild → done
✓ mono, ws, di
```

- Added `run_vp_build()` function that tails `vitepress.build.txt` for real-time progress
- Translation table filters VitePress noise
- Dead link counter during builds

**Files updated:**

- [x] `notes/tools/hub/index.html` — tooltip, status dot, CSS
- [x] `notes/tools/docs/update-project-docs.sh` — progress format, translation, vp build streaming
- [x] `notes/guides/tools/hub-app.md` — documented new features
- [x] `notes/work/hub-app-refinements.md` — marked complete

**Other:**

- [x] Moved `notes/philosophy/` → `notes/guides/philosophy/`
- [x] Updated `notes/guides/index.md`

**January 28, 2026**

## Guide System Overhaul

Major reorganization of collaboration guides and CLAUDE.MD.

**Pre-flight folder created** — `notes/guides/collaborate/pre-flight/`:

- [x] `gates.md` — extracted from CLAUDE.MD
- [x] `keywords.md` — new, word → guide mapping
- [x] `kinds.of.tasks.md` — new, task type → guides + conflicts
- [x] `shorthand.md` — moved from collaborate/
- [x] `workarounds.md` — extracted from CLAUDE.MD
- [x] `index.md` — numbered reading order

**CLAUDE.MD slimmed** from 83 → 57 lines:

- [x] Added synopsis blockquote at top
- [x] Pre-flight section points to folder
- [x] Guides list simplified
- [x] TONE separated from DOCS STYLE
- [x] Clarified "including pre-flight/" for recursion

**Workflow.md cleaned**:

- [x] Added "relearn" command
- [x] Extracted Build & Deploy to `develop/build.md`

**Other moves**:

- [x] `housekeeping.md` → `done/migrations.md`
- [x] `journal.md`, `guidance-journal.md` → `journals/` folder
- [x] `evolve.md` content merged into `develop/aesthetics.md` Process section
- [x] `claude.md` renamed to `personas.md`

**Stale content removed**:

- [x] "`execute` unavailable" workaround (bash_tool exists)

## Retention Test

Created `notes/work/retention-test.md` — 5 probes to measure guide effectiveness across sessions:

1. `pac` shorthand
2. Refactoring gate (STOP/SEARCH/LIST/WAIT)
3. Multi-file gate (search references first)
4. Voice (first person, casual, punchy)
5. Freshness (re-read before claiming)

**January 18, 2026**

## Checkbox Plugin

Built `[+]` checkbox support for VitePress — orange box with "?" for "fixed but awaiting review" state.

**Files created:**

- [x] `sites/markdown-it-task-list-plus.mts` — shared plugin that transforms `[+]` into styled checkbox

**Files updated:**

- [x] `sites/docs/.vitepress/config.mts` — added plugin
- [x] `projects/ws/.vitepress/config.mts` — added `markdown-it-task-lists` + plugin
- [x] `projects/ws/.vitepress/theme/custom.css` — added checkbox styles
- [x] `projects/di/.vitepress/config.mts` — added plugin
- [x] `projects/di/.vitepress/theme/index.ts` — created (imports custom.css)
- [x] `projects/di/.vitepress/theme/custom.css` — created with checkbox styles
- [x] `projects/ws/notes/guides/deliverables.md` — changed `[-]` back to `[+]`

**Issue discovered:** Initial approach (CSS `:indeterminate`) failed because markdown-it only parses `[ ]` and `[x]`. Required custom plugin to intercept `[+]` at parse time.

## Journal System

- [x] Created `notes/work/journal.md` — distilled from work/done files
- [x] Documented format rules in `guides/collaborate/journals.md`
- [x] Documented daily workflow (resume.md → journal.md)

**Format rules:**

- [x] Chronological order (oldest first)
- [x] **Current** section at top (exception to chronological)
- [x] Bold dates, no headings
- [x] Two blank lines between entries
- [ ] Reference relevant guide files

## Breadcrumb Visibility

```typescript
function handle_s_mouse(s_mouse) {
    if (!!h && h.hasRoot && s_mouse.isDown) {
        search.deactivate();
        ancestry.grabOnly();
        if (ancestry.ancestry_assureIsVisible()) {
            g.ancestry_place_atCenter(ancestry);
        }
        g.grand_build();
    }
}
```

## Code Analysis Discipline

- [x] Identified mistake: proposed `if (ancestry.grabOnly())` without verifying return type
- [x] `grabOnly()` returns void, not boolean

**Added to** `guides/collaborate/chat.md`:

- [x] Verify return types before writing conditionals
- [x] Trace full call chain
- [x] Don't trust patterns across similar method names
- [x] Quote signatures when proposing code
- [x] Don't assume existing code is correct
- [x] Read implementations, not just calls

## Guide Consolidation

- [x] Moved commands/abbreviations from CLAUDE.MD to `guides/collaborate/shorthand.md`
- [x] Removed duplicate commands section from chat.md, now links to shorthand.md
- [x] CLAUDE.MD now minimal — just context and defaults
