# Worktrees

Claude Code spawns a worktree per session — a branch with an auto-generated name (loving-khayyam, funny-wozniak, etc.) living under `~/.claude-worktrees/mono/`. The worktree vanishes when the session ends, but the branch stays. They pile up fast. 28 branches and counting.

## The Problem

Stale branches accumulate silently. They don't hurt anything until they do — confusing branch lists, stale refs, disk clutter if worktrees aren't cleaned up.

## Remove Strategy

1. **Never delete the active worktree** — `git worktree list` shows what's live
2. **Prune dead worktrees first** — `git worktree prune` cleans up directories that no longer exist
3. **Delete stale branches in bulk** — everything except `main` and the current worktree branch:

```
git branch | grep -v -E '^\*|main|<current-branch>' | xargs git branch -D
```

4. **When to run** — whenever the branch list feels cluttered, or at session start as hygiene
5. **Never force-delete a branch that has a worktree** — prune first, then delete

## What NOT to Do

- Don't read or write files via worktree paths (`~/.claude-worktrees/...`). Always use `~/GitHub/mono/`.
- Don't assume worktree branches have meaningful content — they're session scaffolding, not feature branches.
