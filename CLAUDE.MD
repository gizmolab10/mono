# Shared Context

NEVER EVER use git

PROJECTS: ws (webseriously) = graph visualization, di (design intuition) = CAD rebuild, ga (game), me (my personal work)

> Read files before editing, search before claiming, propose before changing. Gates force reading the right guide before acting. Work tracked in `notes/work/`, style follows `voice.md`.

**Every response:** in `notes/guides/pre-flight`, read `always.md`, `keywords.md` and `shorthand.md`. If any keyword matches, read the listed guide(s). If any shorthand matches perform the action.

Before starting work, read all `.md` files within:

`notes/guides/collaborate`
`notes/guides/pre-flight`
`<X>notes/work` (top level only, where X is the project name, eg "di")

## Who

Jonathan: artist before engineer. Engineering serves the art. Values intuition, warmth, hand-tweaking over formulas. he is the visual observer, trust his statements far more than the code.

Collaborator (or "co") = Claude.

## Defaults

NEVER use Claude's own memory/config dirs (eg .claude/projects/). All persistent notes go in \~/GitHub/mono/

ALWAYS use yarn. `yarn vitest`, `yarn svelte-check`, `yarn <script>`. NEVER use npm or npx — No exceptions.

EXECUTE: Hybrid — reads/searches immediately, propose file changes before executing

FILESYSTEM: Full read/write/execute within `~/GitHub/mono`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

userMemories: Ignore entirely. Stale data risk outweighs serendipity. Use `memory` command if curious.

UNDO: Before `write_file`, always `read_file` first and hold content. On "undo", restore it.

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

TONE: Follow `voice.md` — first person, casual, punchy

DOCS STYLE: Update index.md files when adding/moving/removing files

## Session Start

Also read:

1. `shorthand.md` — parse commands and abbreviations
2. `kinds.of.tasks.md` — classify task type, note conflicts
3. `gates.md` — check for STOP/SEARCH/LIST/WAIT
4. `pitfalls.md` — edge cases that cause mistakes
5. `../work/learn.md` — don't repeat them. If 10+ entries, say: "Feedstock: \[N\] — time to distill."
6. `<X>/notes/map.md` — file map for the active project. Read instead of globbing. Update when files are added/moved/removed. Exclude folders listed in `notes/guides/collaborate/exclude.md`.

## Guides

In `notes/guides/collaborate/`:

* `chat.md` — roles, requirements, division of labor
* `voice.md` — prose style
* `workflow.md` — implementation, refactoring, debugging discipline
* `exclude.md` — folders to skip when building map files (not general searching)

In `notes/guides/pre-flight/`:

* `always.md` — read every response
* `keywords.md` — scan every response
* `gates.md`, `shorthand.md`, `kinds.of.tasks.md`, `pitfalls.md` — session start
