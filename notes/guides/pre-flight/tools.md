# Tools

Gotchas and workarounds for Claude Code tools.

## File Operations

**Use `write_file`, not `create_file`** — `create_file` can report success without actually creating the file. `write_file` is reliable.

**Bash has limited access** — some filesystem operations fail silently. Verify results.

## Tool Failures

**Cycle tools, don't repeat or ask.** If a tool fails, try alternatives:
- Read fails → Bash cat → Glob
- create_directory fails → Bash mkdir -p
- delete unavailable → user must delete manually

Don't repeat the same failing call. Don't ask the user what to do — investigate.
