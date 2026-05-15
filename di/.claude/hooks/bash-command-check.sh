#!/bin/bash
# PreToolUse hook for the Bash tool. Blocks commands that violate hard rules
# captured in memory:
#   1) yarn-not-npx — in the di project, run package binaries through yarn
#   2) no-worktrees — git worktree leaves stale directories that break test runners

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
[ -z "$COMMAND" ] && exit 0

# 1) npx — block when the npx binary is invoked at a word boundary
if echo "$COMMAND" | grep -qE '(^|[[:space:]]|;|&|\||\()npx([[:space:]]|$)'; then
  REASON="BANNED COMMAND: the command uses npx. In the di project, run package binaries through yarn instead (e.g., \`yarn <bin>\` or \`yarn run <script>\`). Rewrite the command without npx."
  jq -n --arg reason "$REASON" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
fi

# 2) git worktree — block any git-worktree subcommand
if echo "$COMMAND" | grep -qE '\bgit[[:space:]]+worktree\b'; then
  REASON="BANNED COMMAND: the command uses git worktree. Worktrees leave stale directories that break test runners and are not used in this project. Do not use git worktree."
  jq -n --arg reason "$REASON" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
fi

exit 0
