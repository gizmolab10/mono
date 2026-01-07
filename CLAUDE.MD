# CLAUDE.MD

FILESYSTEM: Full read/write/execute within `~/GitHub`

REPO: `~/GitHub/di` EXECUTE: Always granted—just do it

WORK TRACKING: Keep `notes/work/<file>.md` updated as we go

GUIDES: Read all md files in `notes/guides` at start of session

MEMORY: Use `conversation_search/recent_chats` before claiming no context 

FILES: Always read current version before editing

DOCS STYLE: voice.md | Keep TOC updated

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

`delete` unavailable → user must delete manually

`execute` unavailable → user must run commands manually

## Commands

| Command | Meaning |
|----|----|
| `read claude` | reread this file |
| `update docs` | run `./notes/tools/update-docs.sh`, report output |
| `work on <X>` | if `notes/work/<X>.md` missing, create it + follow `notes/guides/chat.md`; else read + resume |
| `go` | ask which project: (d) di or (w) webseriously, then read that repo's CLAUDE.MD |
| `go d` / `di` | read `/Users/sand/GitHub/di/CLAUDE.MD` |
| `go w` / `web` | read `/Users/sand/GitHub/webseriously/CLAUDE.MD` |
| `chime in` | give me your observations, suggestions, corrections about the topic at hand |

## Typical Abbreviations

| Abbrev | Meaning |
|----|----|
| m | milestone |
| m<#> | milestone # |
| `n` | no |
| `ni` | no improvement, try something different |
| `y` | yes |
| ua | update accordingly |


