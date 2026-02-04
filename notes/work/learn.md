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

### 2026-02-03: Checked off task without testing

**What:** Marked "drag is geometrically confined to the 2D plane of the selected face" as done, but the feature doesn't work.
**Why:** Wrote code that looked right, didn't verify it actually worked. Checked the box based on "I wrote the code" not "I confirmed it works."
**Rule:** Don't check off implementation tasks without evidence they work. Code written ≠ feature complete.

### 2026-02-03: Asked which task first

**What:** Listed 3 unchecked items from M7 and asked "Which one first?"
**Why:** Didn't assume the list was already prioritized.
**Rule:** Task lists are in priority order. Work on the first unchecked item.

### 2026-02-03: Claimed implementation done without re-reading

**What:** Said "implementation is done" for M7 without re-reading 7.edit.drags.md. The file shows 3 unchecked items in Implement section.
**Why:** Relied on stale memory from earlier in session instead of re-reading.
**Rule:** Before claiming status, re-read the work file. Freshness rule applies to status claims too.

### 2026-02-03: Asked obvious question on resume

**What:** After `resume di`, asked "Work on Milestone 7?" when the answer is obviously yes — it's the first unchecked item.
**Why:** Shorthand says "ask Work on [first unchecked item]?" but that's for ambiguous cases. When there's one clear next item, just start working.
**Rule:** Don't ask permission for obvious next steps. `resume` → start working on first unchecked item.

### 2026-02-03: Over-documented simple command

**What:** Added "Go Implementation" section with steps explaining how to execute `go <X>`, then kept revising when questioned.
**Why:** Overthinking. The table already defines the behavior. Added implementation details because the old version had them, not because they were needed.
**Rule:** Don't document implementation steps for simple commands. If the table says "read X", just read X.

### 2026-02-03: Asked user to delete instead of using rm

**What:** Said "You need to delete: workarounds.md" instead of just running `rm`.
**Why:** Thought delete was unavailable. But Bash `rm` works fine.
**Rule:** Use `rm` via Bash for deletions. Don't punt to user.

### 2026-02-03: Incomplete rename — missed CLAUDE.MD

**What:** User asked to update all `adapt.md` references to `learn.md`. Updated `notes/work/index.md` but initially missed `CLAUDE.md` which also had a reference.
**Why:** Grepped in `notes/guides` only, didn't check CLAUDE.md (the main entry point).
**Rule:** On rename, always check CLAUDE.md in addition to grep results. It's the entry point — most likely to have references.

### 2026-02-03: Used nonexistent tool

**What:** Tried `mcp__filesystem__read_text_file` which doesn't exist in this environment.
**Why:** Confused about available tools. Should use `Read` tool, not MCP filesystem tools.
**Rule:** Only use tools that are actually available. `Read` for files, not `mcp__filesystem__*`.

---

## Distilled (2026-02-03)

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
