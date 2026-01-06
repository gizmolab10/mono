# CLAUDE.MD

REPO: `~/GitHub/di`
EXECUTE: Always granted—just do it
FILESYSTEM: Full read/write/execute within \~/GitHub
WORK TRACKING: Keep `notes/work/<file>.md` updated as we go
GUIDES: Read all md files in `notes/guides/` at start of session

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

## Commands

| Command | Meaning |
|----|----|
| `read claude` | reread this file |
| `update docs` | run `./notes/tools/update-docs.sh`, report output |
| `work on <X>` | if `notes/work/<X>.md` missing, create it + follow `notes/guides/chat.md`; else read + resume |
| `go` | ask which project: (d) di or (w) webseriously, then read that repo's CLAUDE.MD |
| `go d` / `di` | read `/Users/sand/GitHub/di/CLAUDE.MD` |
| `go w` / `web` | read `/Users/sand/GitHub/webseriously/CLAUDE.MD` |

## Typical Abbreviations

| Abbrev | Meaning |
|----|----|
| m | milestone |
| ua | update accordingly |
| `n` | no |
| `y` | yes |
| `ni` | no improvement, try something different |


