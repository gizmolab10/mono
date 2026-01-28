# Resume

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

---

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

- [x] Analyzed code that ensures selected widget is visible in tree graph
- [x] Key method: `ancestry_assureIsVisible()` in `Ancestry.ts`
- [+] Proposed change to `Breadcrumb_Button.svelte`

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

**Added to `guides/collaborate/chat.md`:**
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
