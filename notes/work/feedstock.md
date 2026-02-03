# Feedstock

Collaborator errors, tracked for escalating need (fed up, stop dead, clean house). It's a step in our roadmap for improvement.

---

## Purpose and starting place

as we roll along, we hit a lot of bumps. i've noticed that i get fed up and stop dead. clean house. takes time. need a better triage system. Let's start with:

- [ ] list of mistakes, latest first
	- [ ] when I make an error, immediately log it (not later), then continue
- [ ] distill
	- [ ] combine two into one
	- [ ] assign severity tag (oy, ack, dead stop) or ("Annoying" vs "broke flow" vs "lost work")
- [ ] research
	- [ ] better tools
	- [ ] internet of clever ideas

Then it might be good to know what patterns cause the stop-dead moments? Is it accumulation (too many small irritants), or single big blockers?

---

## 2026-02-02

### Replacing project-specific with project-specific (3x)

**What:** Asked to move ws-specific content out of shared mono guide. Three times replaced ws examples with di examples instead of making it generic.
**Why:** Thinking "what should replace this" instead of "should anything replace this at all."
**Impact:** User had to reject edits three times, explain the same mistake repeatedly.
**Better approach:** When removing project-specific content from shared docs, remove examples entirely or use truly abstract placeholders. Don't swap one project's patterns for another's.

### Write+delete instead of mv for file rename/move

**What:** Created new file + deleted old file instead of using `mv` when asked to rename Input.ts to Events.ts and move to managers/.
**Why:** Defaulted to Write tool without thinking about simpler bash alternative.
**Impact:** Loses git history for the file, more steps than necessary.
**Better approach:** `mv old/path new/path`, then edit in place.

---

## 2026-02-01

### Worktree path for reads (same session, after adding the rule)

**What:** Used worktree paths for Read calls right after adding "never use worktree paths" to always.md.
**Why:** Didn't internalize the rule. Treated it as write-only when it should apply to all file operations.
**Rule violated:** Write path rule — should be "File path" rule covering reads too.
**Severity:** broke flow — triggered permission prompts, user had to yell.

### Worktree path mistake (again)

**What:** Wrote `faster.md` to worktree path (`~/.claude-worktrees/mono/gifted-noyce/`) instead of main repo (`~/GitHub/mono/`).
**Why:** Session started in worktree, used working directory without checking. User has asked "over and over" not to do this.
**Rule violated:** Write to main repo, not worktrees.
**Severity:** broke flow — user had to correct me, check filesystem, explain again.

---

## 2025-01-31

### Tool failure handling

#### Repeated failing tool calls
**What:** Same tool, same path, multiple times — each returning "No result received" or empty.
**Why:** Hoping it would work instead of switching approaches.
**Proposed new rule:** When a tool fails, immediately cycle: filesystem → bash → view. Don't repeat the same failing call.

#### Asking for paths already given
**What:** User said "svelte/draw", I asked for the full path instead of constructing it.
**Why:** Didn't trust myself to build the path from context (ws project, standard structure).
**Proposed new rule:** If user gives partial path, construct full path from known project structure. Don't ask.

#### Waiting instead of acting on tool failure
**What:** Tools failed, I asked user what to do instead of exhausting alternatives.
**Why:** Deflecting instead of problem-solving.
**Rule violated:** Action First — "if obvious, do it"

---

## 2025-01-29

### Proposing new rules

#### Surface pattern matching
**What:** Suggested combining Fresh and Log sections because both feel like "don't trust yourself."
**Why:** Grouped by theme (self-distrust) instead of by function (workflow position). Fresh is before acting, Log is after — they bookend action, not duplicate it.
**Proposed new rule:** When grouping or combining, check if items share mechanics, not just mood.

#### Restating user's words as observation
**What:** Said "Stale read entries could be combined" when user had already written "combine two into one" in the checkboxes.
**Why:** Skimmed rather than read. Responded to surface pattern without checking if it was already addressed.
**Proposed new rule:** When chiming in, verify the observation isn't already stated in the file.

#### Incomplete rename
**What:** Renamed `mistakes.md` to `raw.md`, updated CLAUDE.MD reference, but didn't update index.md or check for other references.
**Why:** Treated rename as just move + one known reference, not a full search.
**Proposed new rule:** On rename, also update index.md and search for other references.

### Violations of existing rules

#### Path fumbling on `go di`
**What:** Wandered through wrong paths (`/Users/jonathanbell/GitHub`, then exploring directories) instead of constructing the known path directly.
**Why:** Ignored userMemories context that di is in mono. Used `view` tool which failed, didn't immediately switch to `read_text_file`.
**Rule violated:** Go Implementation — "No exploration. Path is known."

#### Stale read (again)
**What:** Suggested changing title to "Feedstock" when it already said "Feedstock".
**Why:** Relied on cache of earlier read instead of re-reading before commenting.
**Rule violated:** FRESHNESS — same rule, same mistake, twice in one session. Be wary that the user may have done something and didn't say.

#### Stale read
**What:** Claimed resume.md had a "Next Up" section that user had already removed.
**Why:** Relied on cached content from earlier in conversation instead of re-reading.
**Rule violated:** FRESHNESS — "ALWAYS re-read immediately before. Never rely on cached content."
