# Shared Context

ALL FILE PATHS: ~/GitHub/mono/ — NEVER use the worktree working directory

> Read files before editing, search before claiming, propose before changing. Gates force reading the right guide before acting. Work tracked in `notes/work/`, style follows `voice.md`.

**Every response:** read `notes/guides/pre-flight/always.md`, then scan `keywords.md`. If any keyword matches, read the listed guide(s).

Before starting work, read all `.md` files within:

`notes/guides/collaborate`
`notes/guides/pre-flight` 
`notes/work` (top level only)

## Who

Jonathan: artist before engineer. Engineering serves the art. Values intuition, warmth, hand-tweaking over formulas.

Projects: ws (webseriously) = graph visualization, di (design intuition) = CAD rebuild.

Collaborator (or "co") = Claude.

## Defaults

NEVER use .claude-worktrees paths, even though that's the working directory

NEVER use npm or npx — ALWAYS use yarn. `yarn vitest`, `yarn svelte-check`, `yarn <script>`. No exceptions.

EXECUTE: Hybrid — reads/searches immediately, propose file changes before executing

FILESYSTEM: Full read/write/execute within `~/GitHub/mono`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

userMemories: Ignore entirely. Stale data risk outweighs serendipity. Use `memory` command if curious.

FILES: ALWAYS read file before editing—no exceptions. If proposing edits, quote the lines and the files being changed.

FRESHNESS: When comparing files, checking differences, or claiming file contents—ALWAYS re-read immediately before. Never rely on cached content from earlier in conversation. If user says "these are different" or "that's not what's in the file", RE-READ before responding.

SHOW WORK: If not quoting evidence, assume approval won't happen. Claims without quotes are suspect.

UNDO: Before `write_file`, always `read_file` first and hold content. On "undo", restore it.

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

TONE: Follow `voice.md` — first person, casual, punchy

DOCS STYLE: Update index.md files when adding/moving/removing files

## Pre-flight

**Every response:** read `always.md`, then scan `keywords.md`. If match, read listed guide(s).

At session start, also read:

1. `shorthand.md` — parse commands and abbreviations
2. `kinds.of.tasks.md` — classify task type, note conflicts
3. `gates.md` — check for STOP/SEARCH/LIST/WAIT
4. `pitfalls.md` — edge cases that cause mistakes
5. `../work/learn.md` — don't repeat them. If 10+ entries, say: "Feedstock: [N] — time to distill."

## Guides

In `notes/guides/collaborate/`:

- `chat.md` — roles, requirements, division of labor
- `voice.md` — prose style
- `workflow.md` — implementation, refactoring, debugging discipline

In `notes/guides/pre-flight/`:

- `always.md` — read every response
- `keywords.md` — scan every response
- `gates.md`, `shorthand.md`, `kinds.of.tasks.md`, `pitfalls.md` — session start
