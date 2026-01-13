# I Accidentally Built a Junior Programmer

*How a pile of markdown files turned AI into a real collaborator*

---

I accidentally built an astonishingly helpful, inexpensive junior programmer. What a team!

It started with frustration. I kept asking AI the same questions. How do i structure this Svelte component? What's the pattern for that store subscription? Each session started from zero. The AI had no memory. I'd re-explain my codebase, my preferences, my quirks. Every. Single. Time.

So i started saving answers. Just markdown files. "Here's how we do X." "Watch out for Y." The pile grew. It became unmanageable.

Then i asked the AI to help organize it.

And something clicked.

## The Bootstrap File

The breakthrough was simple: one file that tells the AI where everything is.

I call it `CLAUDE.MD`. It lives at the root of my project. When i start a session, the AI reads it first. Here's the gist:

```markdown
REPO: ~/GitHub/myproject
GUIDES: Read all md files in `notes/guides` at start of session
WORK TRACKING: Keep `notes/work/<file>.md` updated as we go
FILES: Always read current version before editing
```

That's it. A bootstrap file. The AI now starts every session already knowing:
- Where the code lives
- Where the documentation lives
- What the house rules are
- What we're currently working on

No more re-explaining. The AI reads the manual first, like a good junior dev should.

## Living Guides

The `notes/guides/` folder is where institutional memory lives.

- `style.md` — naming conventions, formatting rules, code patterns
- `gotchas.md` — bugs we've hit, workarounds we've found
- `debugging.md` — how to investigate problems systematically
- `voice.md` — how i write documentation (casual, first-person, problem-first)

These aren't static docs i wrote once. They're living documents. When we hit a new gotcha, we add it. When a pattern emerges, we capture it. The AI helped write most of them — i just massage and approve.

The magic: once a pattern is in a guide, the AI applies it forever. No drift. No forgetting. No "actually, we do it this way" corrections.

It's like onboarding a junior dev who actually reads the wiki. And remembers it.

## Work Tracking

Here's where it gets good.

I have a `notes/work/` folder for active tasks. Each task gets a markdown file with a simple structure:

```markdown
# Fix the Widget Bug
**Started:** 2026-01-05
**Status:** Phase 2 in progress

## Problem
Widget crashes when user clicks too fast.

## Goal
Handle rapid clicks gracefully.

## Phase 1: Investigate
- [x] Reproduce the bug ✅
- [x] Find the root cause ✅

## Phase 2: Fix
- [ ] Debounce the click handler
- [ ] Add tests

## Next Action
**Phase 2:** Implement debounce
```

When i say "work on widget bug," the AI reads this file and picks up exactly where we left off. Different session. Different day. Doesn't matter. The context survives.

Resume points. For AI.

## The Dynamic Shift

Once the system was in place, something changed in how we work together.

My `CLAUDE.MD` includes this line:

```
EXECUTE: Always granted—just do it
```

No more "Should i proceed?" No more "Would you like me to...?" The AI acts. I course-correct when needed.

It sounds small. It's not. The friction disappeared. Instead of a back-and-forth approval dance, we have flow. The AI proposes and executes. I review and adjust. Like working with a junior dev who's learned to take initiative.

Trust, then verify. Not ask, then wait, then do.

## What AI Is Good At (And What You Still Do)

Let's be clear about what this is and isn't.

**What the AI handles:**
- Bulk consistency (fix all the path references when you restructure)
- Pattern application (follow the style guide, every time)
- Never forgetting what's in the guides
- Drafting content you can massage
- Tedious refactoring you'd otherwise procrastinate on

**What you still do:**
- Taste. You know when something feels wrong — the AI doesn't feel, it follows rules.
- Creative direction. What to build, what matters, what to name things.
- Judgment calls. When to break the rules, when to restructure, when to push back.

The result isn't AI replacing you. It's AI amplifying you. The boring parts get handled. The interesting parts stay yours.

## Try It Yourself

You don't need a complex system to start. You need one file.

**Step 1:** Create `CLAUDE.MD` in your project root. Tell the AI where things are and how you work.

**Step 2:** When you solve a problem, ask the AI to write it up. Save it to a `guides/` folder.

**Step 3:** When you start a task, create a work file. Update it as you go.

That's it. The system grows organically. Pain points become guides. Guides become institutional memory. Memory becomes leverage.

Most AI interactions are one-off Q&A. This is something different. It's collaborative project work with accumulated context. A junior programmer who never forgets, never gets tired, and costs pennies per hour.

What a team.

---

*If you found this useful, i write about software development and occasionally about making AI actually helpful. Follow for more.*
