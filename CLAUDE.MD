# CLAUDE.MD

REPO: `~/GitHub/di`
EXECUTE: Always granted—just do it
FILESYSTEM: Full read/write/execute within ~/GitHub
WORK TRACKING: Keep `notes/work/<file>.md` updated as we go
GUIDES: Read all md files in `notes/designs/guides/` at start of session

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

## Commands

| Command | Meaning |
|---------|---------|
| `n` | no |
| `y` | yes |
| `ni` | no improvement needed |
| `read claude` | reread this file |
| `update docs` | run `./notes/tools/update-docs.sh`, report output |
| `work on <file>` | if `notes/work/<file>.md` missing, create it + follow `notes/designs/guides/chat.md`; else read + resume |
