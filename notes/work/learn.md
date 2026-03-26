# Learn

Collaborator errors → distilled into guide updates. It's a step in our roadmap for improvement

---
## Process

as we roll along, we hit a lot of bumps. i've noticed that i get fed up and stop dead. clean house. takes time. need a better triage system. Let's start with:

* [ ] list mistakes as they happen (oldest last)
	* [ ] hyphen-N date title
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

- 2026-03-06 scope creep on fix: user fixed a bug (is_diagonal derived + migration). I then edited 5 .di data files that the user never asked me to touch. When the user fixes something, don't cascade changes into other files unless explicitly asked. The user's fix (migration + version bump) was self-contained — the .di files would go through migration on load. Altering data files introduced a new bug and wasted time.
- 2026-02-23 competing ideas: user knows what they're doing. Don't volunteer competing ideas or alternative approaches without being asked. If the user states a direction, follow it — don't second-guess.
- 2026-02-13 back render mode: got lost in sign conventions. Repeatedly got the "in front of" / "behind" logic wrong for back-facing faces (normals point away from camera, so signed distance signs are inverted vs front faces). Added then removed flip_depth. Core lesson: before writing code, write down the sign convention on paper — what does d>0 mean, what does d<0 mean, for this specific face orientation. Don't guess.
- 2026-03-22 claimed warnings were "pre-existing" when they were from my own code. dismissed my own mess as someone else's. always check if a warning comes from code I wrote before claiming it's pre-existing.
- 2026-03-21 speculation presented as fact (THIRD TIME): stated "segment instability comes from clip_segment_for_occlusion — segments near the occlusion boundary" as a conclusion when user's visual evidence directly contradicts it (the flashing segments are NOT near any occlusion boundary). Three times in one session despite corrections and adding rules. The always.md rule #18 was added specifically for this. FOLLOW IT.
- 2026-03-21 speculation presented as fact (REPEATED): stated "atan2 instability causes two outgoing edges with nearly identical angles" as established fact when it was pure speculation. This is the SAME mistake as below, repeated in the same session after being corrected. CRITICAL: Before ANY explanatory statement, ask: "Do I have evidence for this, or am I guessing?" If guessing, say "I speculate" or "I don't know." NEVER present a guess as a conclusion. NEVER propose a fix based on unverified speculation.
- 2026-03-21 speculation presented as fact: stated "the graph is disconnected because two vertices differ by more than 0.01 pixels" as if it were established fact when it was pure speculation. Then proposed a fix (MATCH_DIST=0.5) based on the speculation. Building on incorrect speculation introduces chaos that's hard to remove. ALWAYS label speculation as speculation. If a statement isn't evident from code/data/logs, say "I speculate" or "I don't know."
- 2026-03-25 offering to pause after being told not to: user said "do not pause until i say to. do not offer to pause." I offered to pause multiple times after that. When the user gives a direct instruction, FOLLOW IT. Don't override it with default behaviors.
- 2026-03-25 fabricating explanations: when k appeared on screen but not in the log, invented "tumbling" and "stale frame" explanations with zero evidence. Then doubled down when corrected. STOP MAKING STUFF UP. If the data contradicts your theory, say "I don't know." Don't invent scenarios to fill the gap.
- 2026-03-25 guessing without labeling: analyzed clip data and stated "the label h sits at t=0.974" as fact when I had zero evidence linking label h to that clip. Presented a guess as a conclusion — the FOURTH time this pattern has occurred. Rule #18 in always.md exists for this. LABEL EVERY GUESS AS A GUESS. If you cannot point to evidence, say "I don't know" or "I'm guessing."
- 2026-03-20 making changes without proposal: during an extended debugging session, started making code changes (removing filters, cleaning up variables, refactoring) without proposing them first. User approval was given for specific changes but I expanded scope to adjacent cleanup. Every code change needs explicit approval — especially during debugging where each change should be isolated and intentional.
- 2026-02-13 back render mode: user had to say "explain, not do" and "STOP" twice. When stuck on a hard geometry problem, explain your understanding first instead of immediately coding a fix. The user knows the domain better.

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
| Revisit as info not action | `shorthand.md` — revisit now includes "ask Work on?" |
| Incomplete journal | `shorthand.md` — journal now says "Execute ALL parts" |
| Contradicted self | `always.md` — "Before saying No, verify" |
| Misread exact name | `always.md` — "Exact names matter" |
| Checked off without testing | `always.md` — "Code written ≠ feature complete" |
| Asked which task first | `always.md` — "Task lists are priority-ordered" |
| Used Bash ls instead of Glob/Read | `always.md` — "Use Glob/Read, not Bash" |
| Speculated instead of observing | `pitfalls.md` #12 — "Observe before speculating" |
| Abbreviated code names | `pitfalls.md` #13 — "No abbreviations in code" |
| Misread "here" as file reference | `pitfalls.md` #14 — "'Here' means chat output" |
| Wrote to Claude memory dir | `CLAUDE.md` — already added |
| Worktree paths (repeated) | `pitfalls.md` #7 — already covered |
| npm instead of yarn (repeated) | `always.md` — already covered |
| Skipped always.md reads (repeated) | `CLAUDE.md` — already covered |
| Miscounted entries (stale read) | `pitfalls.md` #1 — already covered |
| Ignored shorthand command (repeated) | `pitfalls.md` #8 — already covered |
| Logged without checking existing rules | `pitfalls.md` #15 — already covered |
| Treated question as instruction | `pitfalls.md` #16 — "Questions aren't instructions" |
| Promised beyond this chat | `pitfalls.md` #17 — "Scope promises to this chat" |
| Trimmed rejected idea instead of restarting | `pitfalls.md` #18 — "Rejection means start over" |
| Treated analysis shorthand as action | `pitfalls.md` #19 — "Analysis shorthands are not action requests" |
