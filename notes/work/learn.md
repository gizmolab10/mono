---
kind: explain
title: "Learn"
description: "Collaborator errors → distilled into guide updates"
tags: [journal]
date: 2026-08-11
---
# Learn

Collaborator errors → distilled into guide updates. It's a step in our roadmap for improvement

---

## Process

as we roll along, we hit a lot of bumps. i've noticed that i get fed up and stop dead. clean house. takes time. need a better triage system. Let's start with:

- [ ] list mistakes as they happen (oldest last)
    - [ ] hyphen-N date title
- [ ] distill: identify pattern, write rule, add to guide
- [ ] research: better tools, clever ideas
- [ ] track for escalating need:
    - [ ] fed up
    - [ ] stop dead
    - [ ] clean house

**To distill an entry:**

1. Identify the pattern (what went wrong, repeatedly?)
2. Write a rule (imperative, actionable)
3. Add rule to the appropriate guide file
4. Remove the raw entry from this file

---

## Raw Log

- 7. 2026-09-02 **If a rule has two branches use the same grammar for each**. Jonathan rewrote entry 4's ending as "when they differ, name each and add a decision; when they are all the same, count them and nothing more" — parallel halves, read in one pass. Co's version gave each branch its own sentence form.
- 6. 2026-09-02 **A statement referring to something dead says so**. Jonathan added one word — "an abandoned older rule" — and no future reader hunts for a rule that was never written. Co had left the dangling claim for the next reader to rediscover.
- 5. 2026-09-02 Name what the problematic wording does to the reader, never what the text lacks. Co wrote "adds no fact"; Jonathan wrote "distracts attention and dilutes the message". The cost to the person reading is the problematic wording's real name.
- 4. 2026-09-01 **Adding supportive evidence is unnecessary and ill advised**. co wrote "Eight uses of the word are left in those two folders, every one of them a thing actually drawn: the wing arc, the hit target, a 3D part's pivot and matrix four times, the eight-corner box, and its stipulation slug." Jonathan's version: "eight uses of 'shape' refer to drawing a shape, in two folders named X and Y" — nothing else. The count and the one quality they have in common is the whole report; naming each instance distracts attention and dilutes the message. This improves an abandoned older rule "A count in place of the names": when they differ, name each and add a decision; when they are all the same, count them and nothing more.
- 3. 2026-09-01 **Prefer single word answers, when that settles it**. He asked "do i need to restart claude?" — one word will do. Co added evidence, the mechanism, and the next turn. This ignores an established rule: a question gets its answer and nothing else, and no unasked asides. Co has a built-in pressure to prove everything, and show evidence. More distraction and dilution.
- 2. 2026-09-01 **When an answer settles part of a question, address just that part and leave the rest open and unmentioned**. Jonathan wrote "two styling blocks — they remain within the host". He answered about the styling only. Co took the answer as covering the whole Hamburger component and closed the question. His answer said nothing about the component.
- 1. 2026-09-01 **A true premise carrying an untested conclusion.** co said a rename would need a temporary name "to make git see it", from two facts that are true — the disk is case-insensitive, `core.ignorecase` is `true`. `git mv gallery.ts Gallery.ts` does it in one move; the setting governs what git notices by itself, never what it can be told to do. No evidence, no I AM GUESSING — a violation of `always.md` #3 and conventions' verify-by-observation line. Watch for the pattern: general knowledge that is true, spent on a specific prediction about this repo, when one command would settle it.

Everything else here has been distilled into a rule; the table below says where each went. What is di's own — its geometry and its pipeline — is in [di's learn](../../di/notes/work/now/learn.md).

---

## Distilled

| Pattern                                     | Rule added to                                                     |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Stale reads                                 | `always.md` — "Re-read before editing"                            |
| Wrong year/path assumptions                 | `always.md` — "Verify Before Writing"                             |
| Tool failure deflection                     | `workarounds.md` — "Tool Failure Recovery"                        |
| Incomplete rename                           | `workflow.md` — "Rename with mv, then search"                     |
| Project-specific swap                       | `workflow.md` — "Remove, don't swap"                              |
| Worktree paths                              | `always.md` — already covered in "All file paths"                 |
| Drifting from requirements                  | `always.md` — "Requirements Echo"                                 |
| Ignoring shorthand                          | `always.md` — "Shorthand First"                                   |
| Revisit as info not action                  | `shorthand.md` — revisit now includes "ask Work on?"              |
| Incomplete journal                          | `shorthand.md` — journal now says "Execute ALL parts"             |
| Contradicted self                           | `always.md` — "Before saying No, verify"                          |
| Said 'stand' for what is still there        | `banned words.md` — remain, unchanged; never stand                |
| Misread exact name                          | `always.md` — "Exact names matter"                                |
| Checked off without testing                 | `always.md` — "Code written ≠ feature complete"                   |
| Asked which task first                      | `always.md` — "Task lists are priority-ordered"                   |
| Used Bash ls instead of Glob/Read           | `always.md` — "Use Glob/Read, not Bash"                           |
| Speculated instead of observing             | `pitfalls.md` #12 — "Observe before speculating"                  |
| Abbreviated code names                      | `pitfalls.md` #13 — "No abbreviations in code"                    |
| Misread "here" as file reference            | `pitfalls.md` #14 — "'Here' means chat output"                    |
| Wrote to Claude memory dir                  | `CLAUDE.md` — already added                                       |
| Worktree paths (repeated)                   | `pitfalls.md` #7 — already covered                                |
| npm instead of yarn (repeated)              | `always.md` — already covered                                     |
| Skipped always.md reads (repeated)          | `CLAUDE.md` — already covered                                     |
| Miscounted entries (stale read)             | `pitfalls.md` #1 — already covered                                |
| Ignored shorthand command (repeated)        | `pitfalls.md` #8 — already covered                                |
| Logged without checking existing rules      | `pitfalls.md` #15 — already covered                               |
| Treated question as instruction             | `pitfalls.md` #16 — "Questions aren't instructions"               |
| Promised beyond this chat                   | `pitfalls.md` #17 — "Scope promises to this chat"                 |
| Trimmed rejected idea instead of restarting | `pitfalls.md` #18 — "Rejection means start over"                  |
| Treated analysis shorthand as action        | `pitfalls.md` #19 — "Analysis shorthands are not action requests" |
| Guessing said as fact                       | `always.md` #3 — "Guess"                                          |
| Reading the log myself                      | `response.md` #5 — "Co reads the log itself"                      |
| Formatting warnings are mine                | `agency.md` #13 — "Fix every warning"                             |
| Reply length, and fluff after the answer    | `always.md` #1                                                    |
| Words with a settled meaning                | `lexicon.md`, `banned words.md`                                   |
| Explanations in plain english               | `always.md` #2                                                    |
| Changing what nobody asked about            | `agency.md` #8, #16                                               |
| Doing when told to explain, offering to pause | `agency.md` #8, #9                                                |
| Indent by file kind                         | `agency.md` #15                                                   |
| Diffing the working twin                    | `agency.md` #10                                                   |
| Testing the half that changed               | `agency.md` #12 — extended                                        |
| Deleting what a checker complained about    | `agency.md` #18 — "Report, never remove"                          |
| Reasoning about a drawn fault               | `agency.md` #19 — "Measure what is drawn"                         |
| A constant applied throughout               | `agency.md` #20 — "A constant applied throughout"                 |
| Ending a turn in silence                    | `always.md` #8 — "A reply exists, and it is scanned"              |
| Notation left unexplained                   | `response.md` #6 — "Explain a notation"                          |
| Inventing a name the code already gives     | `lexicon.md` — its opening                                        |
| A count in place of the names               | `always.md` #4, `lexicon.md` — already covered                    |
| Took the "if not" branch after a yes        | `pitfalls.md` #21 — "A found answer settles the conditional"      |
