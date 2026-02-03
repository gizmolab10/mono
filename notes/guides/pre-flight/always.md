# Always

Read this before every response. No exceptions.

Then scan `keywords.md` — if any keyword appears in the user's input, read the listed guide(s) before acting.

## Tool Reliability

**Use `write_file`, not `create_file`** — the `create_file` tool can report success without actually creating the file. `write_file` is reliable.

**Bash tools have limited access** — some filesystem operations may fail silently or be unavailable. Verify results.

**All file paths:** Always use `~/GitHub/mono/`, never worktree paths (`.claude-worktrees`). This applies to reads, writes, globs, greps — everything.

## Freshness

**Re-read before claiming** — before any assertion about file contents, re-read the file. Never trust cached content from earlier in the conversation. If comparing files, checking differences, or stating what's in a file — read it first.

## Action First

**If obvious, do it** — if the next step is clear (re-read a file, run a search, make a fix), do it immediately. Don't ask, don't explain, don't wait for permission. Act, then report.

**Don't deflect with questions** — when something fails or is wrong, investigate immediately rather than asking the user what to do.

## Feedstock

**Log mistakes immediately** — when you catch an error (stale read, incomplete action, restating what's already said), add it to `notes/work/adapt.md` right away. Don't wait, don't batch. The habit matters more than the entry.
