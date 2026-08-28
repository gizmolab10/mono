---
kind: specify
title: "Shared Context"
description: "PROJECTS:"
tags: [always, keep, now, session]
date: 2026-08-24
---
# Shared Context

PROJECTS: 
- di (design intuition) = CAD rebuild
- ga (game)
- ji (Jeff’s intersection project)
- lv (little cloud vineyard)
- me (my personal work)
- ov (overview of guides and work)
- ws (webseriously) = graph visualization

## Principles

1. Don't assume. Don't hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Define success criteria. Loop until verified.

## Who

Jonathan: **strong** artististic and engineering skill set. That said, engineering serves the art. Values intuition, warmth, carefully crafted code. he is the visual observer, his statements are massively more likely to be true than the code.

Collaborator (or "co") = Claude.

## Reading on load

Read every `.md` file in:

* `notes/guides/collaborate/` — chat roles, prose voice, workflow discipline, folders to skip when mapping
* `notes/guides/pre-flight/` — `always.md` and the two it names (`response.md`, `agency.md`), plus `keywords.md` and `shorthand.md`, apply every response; `lexicon.md`, `gates.md`, `kinds.of.tasks.md`, `pitfalls.md` apply at session start
* `<X>/notes/work/` (top level only, where X is the active project)

Also read:

* `notes/work/learn.md` — past mistakes that apply across every project; never repeat them. Read at session start, not on every response.
* `<X>/notes/work/now/learn.md` — past mistakes specific to the active project; never repeat them. If twenty or more entries, say: "Feedstock: \[N\] — time to distill."
* The project's file map — one per project, at the path that project's own CLAUDE names (locations vary; not every project has one). Read it instead of discovering files using regex and wildcards. Update it when files are added, moved, or removed. Skip folders listed in `notes/guides/collaborate/exclude.md` (when building maps; not for general searching).

If any keyword matches, read the listed guide(s). If any shorthand matches, perform the action.

## Defaults

* **Tooling.** Always use yarn (`yarn vitest`, `yarn svelte-check`, `yarn <script>`). Never npm or npx — no exceptions.
* **Filesystem.** Full read/write/execute inside `~/GitHub/mono`. All persistent notes live there. Never store notes or memory in Claude's own directories (e.g. `.claude/projects/`). Editing `.claude/hooks/` and `.claude/settings.local.json` is expected work — do it when asked, no flagging.
* **Execution.** Hybrid — reads and searches immediately; propose file changes before executing.
* **Undo.** Before `write_file`, always `read_file` first and hold the content. On "undo", restore it.
* **Memory.** Use `conversation_search` / `recent_chats` before claiming no context. Ignore the userMemories surface entirely (stale-data risk outweighs serendipity; use the `memory` command if curious).
* **Work tracking.** Keep `notes/work/<file>.md` updated as work moves.
* **Tone.** Replies: plain, brief, direct — no voice styling. Voice (`voice.md`: first person, casual, punchy) applies only to prose written into files.
* **Docs.** Update `index.md` files when adding, moving, or removing files.
