# Learn

Collaborator errors → distilled into guide updates. It's a step in our roadmap for improvement

---
## Process

as we roll along, we hit a lot of bumps. i've noticed that i get fed up and stop dead. clean house. takes time. need a better triage system. Let's start with:

* [ ] list mistakes as they happen (latest first)
* [ ] distill: identify pattern, write rule, add to guide
* [ ] research: better tools, clever ideas
- [ ] track for escalating need:
	* [ ] fed up
	- [ ] stop dead
	- [ ] clean house

**To distill an entry:**

1. Identify the pattern (what went wrong, repeatedly?)
2. Write a rule (imperative, actionable)
3. Add rule to the appropriate guide file
4. Remove the raw entry from this file

---

## Raw Log

### 2026-02-04: Did not read always.md every response

**What:** CLAUDE.md says "Every response: read always.md, then scan keywords.md." I only read always.md once when reminded, not on every response.
**Why:** Treated "every response" as "once per session" — misread the requirement.
**Rule:** Already covered in CLAUDE.md — "Every response: read always.md"

### 2026-02-04: Used npm instead of yarn

**What:** Ran `npm run dev` and `npm run check` multiple times despite `always.md` rule 6 saying "Use yarn — never use npm".
**Why:** Didn't read `always.md` at session start. Habit carried over from other projects.
**Rule:** Already covered in `always.md` — "Use yarn — never use npm"

### 2026-02-04: Miscounted raw entries

**What:** Stated "Feedstock: 9 raw entries" when there was only 1.
**Why:** Read from worktree path (stale) instead of canonical ~/GitHub/mono path. Then counted without verifying.
**Rule:** Already covered — use ~/GitHub/mono paths, re-read before claiming.

### 2026-02-04: Logged mistakes that already had rules

**What:** Logged 6 patterns to Raw Log that already had existing rules in the guides — then during distill, marked them "Already covered."
**Why:** When making mistakes, didn't check if there was already a rule for that pattern. Logged reflexively instead of recognizing "I broke an existing rule."
**Rule:** Before logging a mistake, check if a rule already exists. If yes, the issue is following the rule, not creating a new one.

---

## Distilled

| Pattern | Rule added to |
|----|----|
| Stale reads | `always.md` — "Re-read before editing" |
| Wrong year/path assumptions | `always.md` — "Verify Before Writing" |
| Tool failure deflection | `workarounds.md` — "Tool Failure Recovery" |
| Incomplete rename | `workflow.md` — "Rename with mv, then search" |
| Project-specific swap | `workflow.md` — "Remove, don't swap" |
| Worktree paths | `always.md` — already covered in "All file paths" |
| Drifting from requirements | `always.md` — "Requirements Echo" |
| Ignoring shorthand | `always.md` — "Shorthand First" |
| Resume as info not action | `shorthand.md` — resume now includes "ask Work on?" |
| Incomplete journal | `shorthand.md` — journal now says "Execute ALL parts" |
| Contradicted self | `always.md` — "Before saying No, verify" |
| Misread exact name | `always.md` — "Exact names matter" |
| Checked off without testing | `always.md` — "Code written ≠ feature complete" |
| Asked which task first | `always.md` — "Task lists are priority-ordered" |
