#!/bin/bash
# UserPromptSubmit hook: if the user's message contains a "done" command,
# inject the done-checklist (from shorthand.md) into the assistant's context.
#
# Matching rules (any line of the prompt, after trimming, case-insensitive):
#   1. The line equals "done".
#   2. The line starts with "v:" AND ends with "done".
#   3. The line contains "done." (word + period) anywhere.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // .prompt // ""' 2>/dev/null)

if [ -z "$PROMPT" ]; then
  exit 0
fi

SHOULD_FIRE=false
while IFS= read -r line; do
  trimmed=$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  lower=$(echo "$trimmed" | tr '[:upper:]' '[:lower:]')

  # Rule 1: bare "done"
  if [ "$lower" = "done" ]; then
    SHOULD_FIRE=true
    break
  fi

  # Rule 2: "v: ... done"
  if [[ "$lower" == v:* ]] && [[ "$lower" == *done ]]; then
    SHOULD_FIRE=true
    break
  fi

  # Rule 3: "done." anywhere in the line
  if [[ "$lower" == *done.* ]]; then
    SHOULD_FIRE=true
    break
  fi
done <<< "$PROMPT"

if [ "$SHOULD_FIRE" = "true" ]; then
  CHECKLIST='DONE COMMAND CHECKLIST (from shorthand.md "done"):

- [ ] move the done item from code.debt.md to code.debt.paid.md
- [ ] tighten handoff.md
    - [ ] move all completed proposal blocks to new session entries in work journal.md
    - [ ] keep open items and active proposals
- [ ] update working features.md -> add anything important from what got done
- [ ] update map.md if files were added or moved
- [ ] update file layout.md if file paths changed
- [ ] re-read code.debt.md for the next item
- [ ] propose the next item in handoff.md'
  echo "$CHECKLIST" | jq -Rs '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: .}}'
fi

exit 0
