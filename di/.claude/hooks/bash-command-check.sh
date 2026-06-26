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

# 3) auto-approve read-only exploration so compound greps/finds/cats never
# prompt, no matter how they are chained. Allow only when EVERY pipeline segment
# is a safe read-only command and nothing in the line can write or run other
# programs. Anything else falls through to the normal permission flow.
DANGER='\$\(|`|find[^|;&]*-(exec|execdir|delete|fprint|fls)|sed[^|;&]*-i|>>|>[[:space:]]*[^&/[:space:]]'
if ! echo "$COMMAND" | grep -qE "$DANGER"; then
  SAFE='^(grep|egrep|fgrep|find|cat|ls|wc|head|tail|sort|uniq|cut|tr|sed|awk|echo|printf|cd|dirname|basename|shasum|comm|column|nl|true)$'
  ALL_SAFE=1
  SEGMENTS=$(printf '%s' "$COMMAND" | tr '\n' ';' | sed -E 's/\|\||&&/;/g; s/\|/;/g')
  OLDIFS="$IFS"; IFS=';'
  for seg in $SEGMENTS; do
    word=$(printf '%s' "$seg" | sed -E 's/^[[:space:]]+//' | awk '{print $1}')
    [ -z "$word" ] && continue
    echo "$word" | grep -qE "$SAFE" || { ALL_SAFE=0; break; }
  done
  IFS="$OLDIFS"
  if [ "$ALL_SAFE" = "1" ]; then
    jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", permissionDecisionReason: "read-only exploration auto-approved by bash-command-check"}}'
    exit 0
  fi
fi

exit 0
