#!/usr/bin/env bash
#
# clean.worktrees.sh — prune dead worktrees, delete stale branches
#
# Claude Code spawns a branch per session. They pile up.
# This script removes the dead ones, keeps main and any live worktree branches.
#
# Usage: ./clean.worktrees.sh [--dry-run]

set -euo pipefail

REPO="$HOME/GitHub/mono"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

cd "$REPO"

# 1. Prune worktrees whose directories no longer exist
echo "=== Pruning dead worktrees ==="
if $DRY_RUN; then
  git worktree prune --dry-run
else
  git worktree prune -v
fi

# 2. Collect live worktree branches (never delete these)
live_branches=()
while IFS= read -r line; do
  branch=$(echo "$line" | sed -n 's/.*\[\(.*\)\]/\1/p')
  if [[ -n "$branch" ]]; then
    live_branches+=("$branch")
  fi
done < <(git worktree list)

echo ""
echo "=== Live worktree branches (protected) ==="
for b in "${live_branches[@]}"; do
  echo "  $b"
done

# 3. Delete all local branches except main and live worktree branches
echo ""
echo "=== Stale branches ==="

stale=()
while IFS= read -r raw; do
  branch=$(echo "$raw" | sed 's/^[* +]*//')
  # skip main
  [[ "$branch" == "main" ]] && continue
  # skip live worktree branches
  skip=false
  for lb in "${live_branches[@]}"; do
    [[ "$branch" == "$lb" ]] && skip=true && break
  done
  $skip && continue
  stale+=("$branch")
done < <(git branch)

if [[ ${#stale[@]} -eq 0 ]]; then
  echo "  (none)"
  exit 0
fi

for b in "${stale[@]}"; do
  if $DRY_RUN; then
    echo "  would delete: $b"
  else
    echo "  deleting: $b"
    git branch -D "$b"
  fi
done

echo ""
echo "=== Done: ${#stale[@]} branch(es) ${DRY_RUN:+would be }removed ==="
