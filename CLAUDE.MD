# Shared Context

Read all `.md` files within `notes/guides/collaborate` before starting work.

## Defaults

EXECUTE: Always granted—just do it

FILESYSTEM: Full read/write/execute within `~/GitHub/mono`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

FILES: Always read current version before editing

FRESHNESS: When comparing files, checking differences, or claiming file contents—ALWAYS re-read immediately before. Never rely on cached content from earlier in conversation. If user says "these are different" or "that's not what's in the file", RE-READ before responding.

UNDO: Before `write_file`, always `read_file` first and hold content. On "undo", restore it.

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

DOCS STYLE: Follow `notes/guides/collaborate/voice.md` | Keep TOC updated

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

`delete` unavailable → user must delete manually

`execute` unavailable → user must run commands manually

## Commands

| Command | Meaning |
|----|----|
| `go` | read \~/GitHub/mono/projects/<current-go>/CLAUDE.MD |
| `go <X>` | set current-go to X, then read \~/GitHub/mono/projects/X/CLAUDE.MD |
| `what go` | tell current-go value |
| `work on <X>` | if `notes/work/<X>.md` missing, create it; else read + resume |
| `chime in` | give observations, suggestions, corrections about the topic at hand |
| `ua` | update current md file with chat content |
| `undo` | revert last file change |
| `propose` / `?` | explain plan before executing |
| `claude` | reread CLAUDE.MD |

## Abbreviations

| Abbrev | Meaning |
|----|----|
| cb | use checkboxes for this |
| m | milestone |
| m<#> | milestone # |
| n | no |
| ni | no improvement, try something different |
| y | yes |
| ua | update accordingly |

## Meanings

### update accordingly

Add all/any of this chat that seems significant or brings it up to date, remove redundancies, simplify without losing significant details