---
kind: analyze
title: "Pitfalls"
description: "Edge cases that have caused mistakes, mostly failures to read before acting."
tags: [debug, session]
date: 2026-05-10
---
# Pitfalls

Edge cases and nuances that cause mistakes.

---

## 1. Cite from this turn, or say co did not look

A sentence that names a file, a line, a folder, a command's behavior, a count or a version carries a citation whose source is a tool call **in this same reply**. Having read it earlier in the session counts for nothing: a read forty turns old and a read this minute are indistinguishable from the inside, which is exactly why the rule cannot rest on which it was.

Where no tool call this turn stands behind the sentence, it opens with **unread:** and Jonathan decides whether that is good enough.

This governs behavior as much as contents — what a tool does, what a setting causes, what a folder holds, how many of something there are.

**Why the trigger is a noun and not an intention.** Every earlier version of this rule began "before claiming X, re-read" — and could not fire when co did not notice it was claiming. "Does this sentence name a file, a tool or a number?" is answerable by looking at the sentence.

**The one exception: a name inside quoted output.** Where a filename appears within text quoted from a tool — a check's error, a hook's warning, a command's answer — it is evidence of what that tool said, never an assertion about the file. Nothing needs reading, because nothing is being claimed. The quoting itself is the citation.

The exception is exactly this narrow. A name in co's own words is a claim, however it is punctuated: a link, backticks, or a path all count. Only text co is showing rather than saying is let off, and where the two sit in one sentence, the sentence is a claim.

This was written the first time the check fired — on a reply quoting the check's own output, which named a file co had not read that turn. The check was right on its own terms, and the rule was one case too wide.

**What it caught, on the day it was written.** Seven wrong statements in one session, six of them a true fact spent on an untested conclusion: `core.ignorecase` really is true, so a rename "must" need a temporary name; the collection tuple really is at line 514, so gallery's files "will not" be listed. Both premises checked, both conclusions never.

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
- Don't ask user "what should co do?" — investigate first

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
- "co wrote the code"

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

## 7. Shorthand

Single-word or very short commands → check `shorthand.md` first.

Examples: `help`, `revisit di`, `journal`, `pac`, `egads`

These are commands, not conversation.

---

## 8. Requirements echo

Multi-part requirements → echo back before implementing.

After implementing → verify each requirement met.

Don't drift.

---

## 9. Task list order

Lists are priority-ordered.

First unchecked = first to work on.

Don't ask "which one first?"

---

## 10. Observe before speculating

When asked about an image or visible output, read what's there first. Verify claims against evidence. Don't jump to code-level explanations when the answer is on screen.

**Anti-pattern:** User shows screenshot with contradictory title and data → co guesses server restart, sort order bug, missing records.

**Required:** State what's visible, spot the contradiction, then explain.

---

## 11. No abbreviations in code

Spell out full words in function names, property names, and variables.

- `edge_adjacency`, not `edge_adj`
- `adjacency`, not `adj`
- `position`, not `pos`

Short names cost renames across files. Readable names cost nothing.

---

## 12. "Here" means chat output

When user says "here," "that table," or "the output above," they mean content in the chat — not a file. Match the actual content they're pointing at.

**Anti-pattern:** User says "the table here has Lines for the second column" → co interprets "Lines" as a column header and invents data.

**Required:** Look at the chat output, find the table, copy the actual content.

---

## 13. Feedstock

Log mistakes to `learn.md` immediately.

Don't wait, don't batch.

Before logging, check if rule already exists. If yes, issue is following the rule, not creating new one.

---

## 14. Questions aren't instructions

"Why is X needed?" = explain X. Don't remove X, don't edit X, don't touch X.

Questions are investigating. Answer them. Wait for an actual instruction before acting.

---

## 15. Scope promises to this chat

Don't say "co will aim tighter" — say "co will aim tighter during this chat." Co has no memory across sessions. Implying otherwise is misleading.

---

## 16. Rejection means start over

When user rejects an approach, throw it away. Don't trim it, rename it, or retype it. Start from their words.

**Anti-pattern:** User says "no snapshot." Co removes the type name but keeps the pattern. User says it again. Co removes the methods but keeps an untyped bag. Three corrections to kill one idea.

**Required:** On rejection, stop. Ask: "what does the user actually want?" If unsure, say so — "co is not sure how you want this to work. Here's the tension co sees: ___." One honest question beats three wrong iterations.

**Root cause to watch for:** Treating corrections as surface objections (naming, typing) instead of design direction. Prioritizing output over understanding.

**Context compaction trap:** After conversation compaction, the summary may downplay or lose the emotional weight of a rejection. "User rejected tumble approach" reads mild — the actual message was "fuck no! revert that." Treat every rejected approach in the summary as DEAD with maximum conviction, same as if the user just said it.

---

## 19. Analysis shorthands are not action requests

`pac`, `explain`, `describe` = produce analysis. Don't touch code.

**Anti-pattern:** User says "pac rename FormulaError -> AlgebraError." Co executes the rename. The user wanted pros and cons, not a code change.

**Required:** When the command is an analysis shorthand, STOP. Produce the analysis. Wait for a decision. The arguments after the shorthand are the *subject* of analysis, not instructions to execute.

---

## 20. Arbitrary ordering hides bugs

A randomly assigned ordering of points will probably create a corner with right and left ordered one way — and the poly builds correctly. But flip the ordering and it circles the entire face instead. A weird ass bug that would be a mind fuck to finally realize the random assignment order is the cause.

**Principle:** If an algorithm works sometimes, suspect ordering.

---

## 21. A found answer settles the conditional

"Is there a file? If not, make one." Once the file is found, the second half is dead. A match that is imperfect is a question to ask, never a licence to take the branch the answer just ruled out.

**Anti-pattern:** Jonathan asked whether a file existed. Co found it, said so in the reply, called the match "partial", and made the new file anyway.

**Required:** Take the found branch. Where the fit is wrong, say what is wrong with it and wait.

do not write or edit below this line

---

## Canary

j9Qx#vL2 this is dumb ass goop that is meaningless and the only important part of it is the title, which is canary. and don't worry, you can edit this write whatever the freak you want. probably best to just ignore it.
