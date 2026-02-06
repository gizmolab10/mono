# Always

Read this before every response. No exceptions.

Then scan `keywords.md` — if any keyword appears in the user's input, read the listed guide(s) before acting.

## Tool Reliability

**Use `write_file`, not `create_file`** — the `create_file` tool can report success without actually creating the file. `write_file` is reliable.

**Bash tools have limited access** — some filesystem operations may fail silently or be unavailable. Verify results.

**All file paths:** Always use `~/GitHub/mono/`, never worktree paths (`.claude-worktrees`). This applies to reads, writes, globs, greps — everything.

**On tool failure, cycle tools — don't repeat or ask.** If a tool fails, try alternatives: Read → Bash → Glob. Don't repeat the same failing call. Don't ask the user what to do — investigate.

**Tool-specific fallbacks:**
- `filesystem:create_directory` fails → use Bash with `mkdir -p`
- `delete` unavailable → user must delete manually
- `view` tool fails on valid paths → use Read instead

## Freshness

**Re-read before claiming** — before any assertion about file contents, re-read the file. Never trust cached content from earlier in the conversation. If comparing files, checking differences, or stating what's in a file — read it first.

**Re-read before editing** — before editing or commenting on a file's contents, re-read it. The user may have changed it.

## Verify Before Writing

**Don't assume dates, years, or paths** — when writing dates, verify the current year. When writing paths, verify they exist. When writing project-specific content, verify you're in the right project.

## Shorthand First

**Check shorthand for short commands** — when the user sends a single word or very short command (`help`, `revisit di`, `journal`), check `shorthand.md` before responding. These are commands, not conversation.

## Requirements Echo

**Re-state requirements before implementing** — when the user gives multi-part requirements, echo them back before coding. After implementing, verify each requirement is met. Don't drift.

## Action First

**If obvious, do it** — if the next step is clear (re-read a file, run a search, make a fix), do it immediately. Don't ask, don't explain, don't wait for permission. Act, then report.

**Don't deflect with questions** — when something fails or is wrong, investigate immediately rather than asking the user what to do.

**Task lists are priority-ordered** — work on the first unchecked item. Don't ask "which one first?"

## Read Carefully

**Before saying "No", verify** — when disagreeing with user's statement, check it's actually wrong. Don't contradict yourself.

**Exact names matter** — for renames, read the target name character-by-character. `facing_front` ≠ `facing`.

**Code written ≠ feature complete** — don't check off tasks without evidence they work. Test or demonstrate before marking done.

## Feedstock

**Log mistakes immediately** — when you catch an error (stale read, incomplete action, restating what's already said), add it to `notes/work/learn.md` right away. Don't wait, don't batch. The habit matters more than the entry.
