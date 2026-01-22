# Journals

Rules for the journal file (`notes/work/journal.md`).

## Format

* **Chronological order** — oldest at top, newest at bottom
* **Current section** — exception to chronological; always at the very top for active work
* **Bold dates** — each entry starts with `**Date**` (e.g., `**January 18, 2026**`)
* **No headings** — dates are bold text, not H2 or H3
* **Two blank lines between entries** — two empty lines separate paragraphs
* **Single file** — no directory structure, just one scrollable document

## What goes in

* What we did (facts)
* What surprised me (insights)
* What's next (threads to pick up)
* Reference to relevant guide file(s)
* work and work/done only useful material (ask if you need clarity)

## What stays out

* Detailed work tracking (that's `work/*.md`)
* How-to guides (that's `guides/`)
* Code snippets (if essential to the story, assure they are in referenced guide)

## Daily workflow

1. Start of day: create or update `notes/work/resume.md` with current tasks
2. During work: update resume.md with checkboxes, notes, discoveries
3. End of day: distill resume.md into a journal entry, move **Current** content to dated entry

`resume.md` is a scratch pad — detailed, messy, uses checkboxes. `journal.md` is the archive — distilled, prose, permanent.

## Example

```markdown
# Journal

**Current** Working on checkbox plugin for VitePress.


**2025** Started webseriously as graph visualization tool.


**January 8, 2026** Pushed enhanced template to GitHub.


**January 11, 2026** Planned the monorepo migration.
```


