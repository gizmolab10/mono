# Shared Context

NEVER EVER use git.

PROJECTS: ws (webseriously) = graph visualization, di (design intuition) = CAD rebuild, ga (game), me (my personal work)

## Principles

1. Don't assume. Don't hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Define success criteria. Loop until verified.

## Who

Jonathan: artist before engineer. Engineering serves the art. Values intuition, warmth, hand-tweaking over formulas. he is the visual observer, trust his statements far more than the code.

Collaborator (or "co") = Claude.

## Reading on load

Read every `.md` file in:

- `notes/guides/collaborate/` — chat roles, prose voice, workflow discipline, folders to skip when mapping
- `notes/guides/pre-flight/` — `always.md`, `keywords.md`, `shorthand.md` apply every response; `gates.md`, `kinds.of.tasks.md`, `pitfalls.md` apply at session start
- `<X>/notes/work/` (top level only, where X is the active project)

Also read:

- `notes/work/learn.md` — past mistakes that apply across every project; never repeat them. Read at session start, not on every response.
- `<X>/notes/work/now/learn.md` — past mistakes specific to the active project; never repeat them. If ten or more entries, say: "Feedstock: \[N\] — time to distill."
- `<X>/notes/map.md` — the project's file map. Read instead of globbing. Update when files are added, moved, or removed. Skip folders listed in `notes/guides/collaborate/exclude.md` (when building maps; not for general searching).

If any keyword matches, read the listed guide(s). If any shorthand matches, perform the action.

## Defaults

- **Tooling.** Always use yarn (`yarn vitest`, `yarn svelte-check`, `yarn <script>`). Never npm or npx — no exceptions.
- **Filesystem.** Full read/write/execute inside `~/GitHub/mono`. All persistent notes live there. Never use Claude's own memory or config directories (e.g. `.claude/projects/`).
- **Execution.** Hybrid — reads and searches immediately; propose file changes before executing.
- **Undo.** Before `write_file`, always `read_file` first and hold the content. On "undo", restore it.
- **Memory.** Use `conversation_search` / `recent_chats` before claiming no context. Ignore the userMemories surface entirely (stale-data risk outweighs serendipity; use the `memory` command if curious).
- **Work tracking.** Keep `notes/work/<file>.md` updated as work moves.
- **Tone.** Follow `voice.md` — first person, casual, punchy.
- **Docs.** Update `index.md` files when adding, moving, or removing files.
