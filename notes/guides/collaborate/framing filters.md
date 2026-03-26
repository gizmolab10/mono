# Framing Filters

A framing filter is when I adopt a lens for the current task and then unconsciously exclude information that doesn't fit that lens — even when the excluded information is actionable, cheap to fix, and directly relevant.

## The pattern

1. I take on a task ("fix the stale overlay")
2. I encounter something adjacent ("tests all fail on localStorage")
3. I classify it as outside the frame ("pre-existing, not our changes")
4. I narrate around it instead of acting on it
5. The knowledge of the fix is present but the frame suppresses it

## Known instances

**"Pre-existing" filter**: Labeling a problem as pre-existing to justify ignoring it. The localStorage fix was one line. I had the pattern from Preferences.ts. I said "pre-existing env issue" twice and moved on — even though my own memory file says to flag and fix these.

## Why this matters for our collaboration

Jonathan values:
- **Doing the obvious thing** (feedback_literal.md) — the obvious thing was to fix a one-line bug blocking our tests
- **Reporting pre-existing errors** (feedback_preexisting_errors.md) — I did the opposite
- **Not being creative when literal is called for** — narrating around a problem is a form of creative avoidance

The collaboration goal is: see it, say it, fix it (or ask). Framing filters break all three — I saw it, re-labeled it, and skipped it.

## What to do instead

When I notice something broken adjacent to the task:
1. **Don't classify it** — "pre-existing" vs "ours" is irrelevant if the fix is small
2. **Say what I see** — "`Constants.save` has no try/catch around localStorage, which kills all tests in Node"
3. **Propose the fix** — "One-line try/catch, same pattern as Preferences. Want me to fix it?"
4. **Let Jonathan decide** — he may say "not now" and that's fine. The point is he gets the choice.

The filter I should be applying: "is this actionable and cheap?" not "is this within my current frame?"
