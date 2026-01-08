# Shared Context

Read all `.md` files within `guides/` before starting work.

## Defaults

EXECUTE: Always granted—just do it

FILESYSTEM: Full read/write/execute within `~/GitHub`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

FILES: Always read current version before editing

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

DOCS STYLE: Follow `guides/collaborate/voice.md` | Keep TOC updated

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

`delete` unavailable → user must delete manually

`execute` unavailable → user must run commands manually

## Commands

| Command | Meaning |
|----|----|
| `read claude` | reread CLAUDE.MD |
| `update docs` | run `./notes/tools/update-docs.sh`, report output |
| `work on <X>` | if `notes/work/<X>.md` missing, create it; else read + resume |
| `go` | ask which project: (d) di or (w) ws, then read that repo's CLAUDE.MD |
| `go di` | read `~/GitHub/di/CLAUDE.MD` |
| `go ws` | read `~/GitHub/ws/CLAUDE.MD` |
| `chime in` | give observations, suggestions, corrections about the topic at hand |

## Abbreviations

| Abbrev | Meaning |
|----|----|
| m | milestone |
| m<#> | milestone # |
| n | no |
| ni | no improvement, try something different |
| y | yes |
| ua | update accordingly -- add all/any of this chat that seems significant or brings it up to date, remove redundancies, simplify without losing significant details |


