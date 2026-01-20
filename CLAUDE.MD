# Shared Context

Read all `.md` files (do not recurse) within `notes/guides/collaborate` and `notes/work` before starting work.

## Defaults

EXECUTE: Always granted—just do it

FILESYSTEM: Full read/write/execute within `~/GitHub/mono`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

FILES: Always read current version before editing

FRESHNESS: When comparing files, checking differences, or claiming file contents—ALWAYS re-read immediately before. Never rely on cached content from earlier in conversation. If user says "these are different" or "that's not what's in the file", RE-READ before responding.

UNDO: Before `write_file`, always `read_file` first and hold content. On "undo", restore it.

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

DOCS STYLE: Follow `notes/guides/collaborate/voice.md` | Keep TOC updated

## Implementation from Plans

When a `notes/work/*.md` file contains a migration plan or spec:

1. **Before implementing:** Re-read the plan. Quote the relevant section.
2. **Match the plan exactly.** No shortcuts, no "equivalent" hacks.
3. **If stuck:** Re-read the plan, not recent chat.
4. **If plan seems wrong:** Say so explicitly, don't silently deviate.

**"relearn"** — Stop. Re-read CLAUDE.MD, `notes/guides/collaborate/*.md`, and the active work doc. Quote the relevant section before continuing.

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

`delete` unavailable → user must delete manually

`execute` unavailable → user must run commands manually
