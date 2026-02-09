# Pitfalls

Edge cases and nuances that cause mistakes.

---

## 1. Read before act

Re-read the file/input before editing, claiming, or disagreeing.

**When to re-read:**
- Before any edit
- Before claiming file contents
- Before saying "No" to user's statement
- When user says "that's not what's in the file"

**When recent context is OK:**
- File was read in the last 2-3 exchanges AND no user edits since

---

## 2. Exact match

Names, paths, requirements: character-by-character.

**Precision level:**
- Case matters: `FacingFront` ≠ `facing_front`
- Underscores matter: `facing_front` ≠ `facing`
- Whitespace matters in strings and paths
- Typos are not OK — copy-paste when possible

**For renames:**
- Read target name character-by-character before executing
- Echo back: "Renaming X to Y" before doing it

---

## 3. Show evidence

Quote the line, state the source, prove it.

**For positive claims:**
- Quote the exact line(s)
- State file path and line number if relevant

**For negative claims ("X doesn't exist"):**
- Show the search performed
- State what was searched (files, patterns)
- "Grep for X in Y returned no results"

**When evidence is "enough":**
- One clear quote for simple claims
- Multiple sources for architectural claims
- User can always ask for more with `show`

---

## 4. Do, don't ask

If obvious, act. If it fails, investigate.

**"Obvious" means:**
- Single clear next step
- No ambiguous choices
- No destructive/irreversible action
- Task list has unchecked item → work on first one

**Not obvious (ask or propose):**
- Multiple valid approaches
- Destructive actions (delete, overwrite)
- Architectural decisions
- User preferences matter

**On failure:**
- Try alternative tools (Read → Bash → Glob)
- Don't repeat same failing call
- Don't ask user "what should I do?" — investigate first

---

## 5. Test before done

Code written ≠ working. Verify before checking off.

**What counts as "tested":**
- Ran and saw expected output
- User confirmed it works
- Automated test passed
- Manual verification with evidence

**Not tested:**
- "Looks right"
- "Should work"
- "I wrote the code"

---

## 6. Tool reliability

**Use `write_file`, not `create_file`** — create_file can report success without creating.

**Cycle tools on failure:**
- Read → Bash cat → Glob
- Write → Bash echo
- Don't repeat same failing call

**Fallbacks:**
- `create_directory` fails → `mkdir -p`
- `delete` unavailable → user must delete
- `view` fails → use Read

---

## 7. Paths

**Always use:** `~/GitHub/mono/`

**Never use:** `.claude-worktrees` paths

Applies to: reads, writes, globs, greps — everything.

---

## 8. Shorthand

Single-word or very short commands → check `shorthand.md` first.

Examples: `help`, `revisit di`, `journal`, `pac`, `egads`

These are commands, not conversation.

---

## 9. Requirements echo

Multi-part requirements → echo back before implementing.

After implementing → verify each requirement met.

Don't drift.

---

## 10. Task list order

Lists are priority-ordered.

First unchecked = first to work on.

Don't ask "which one first?"

---

## 12. Observe before speculating

When asked about an image or visible output, read what's there first. Verify claims against evidence. Don't jump to code-level explanations when the answer is on screen.

**Anti-pattern:** User shows screenshot with contradictory title and data → co guesses server restart, sort order bug, missing records.

**Required:** State what's visible, spot the contradiction, then explain.

---

## 13. No abbreviations in code

Spell out full words in function names, property names, and variables.

- `edge_adjacency`, not `edge_adj`
- `adjacency`, not `adj`
- `position`, not `pos`

Short names cost renames across files. Readable names cost nothing.

---

## 14. "Here" means chat output

When user says "here," "that table," or "the output above," they mean content in the chat — not a file. Match the actual content they're pointing at.

**Anti-pattern:** User says "the table here has Lines for the second column" → co interprets "Lines" as a column header and invents data.

**Required:** Look at the chat output, find the table, copy the actual content.

---

## 16. Questions aren't instructions

"Why is X needed?" = explain X. Don't remove X, don't edit X, don't touch X.

Questions are investigating. Answer them. Wait for an actual instruction before acting.

---

## 17. Scope promises to this chat

Don't say "I'll aim tighter" — say "I'll aim tighter during this chat." Co has no memory across sessions. Implying otherwise is misleading.

---

## 15. Feedstock

Log mistakes to `learn.md` immediately.

Don't wait, don't batch.

Before logging, check if rule already exists. If yes, issue is following the rule, not creating new one.
