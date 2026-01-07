# I Accidentally Built a Junior Programmer

*How a pile of markdown files turned AI into a real collaborator*

---

I accidentally built an astonishingly helpful, inexpensive junior programmer. What a team!

It didn't start that way. It started with annoyance.

## The Frustration

Every conversation with AI began from scratch. I'd explain my project. Explain my preferences. Explain the ad-hoc decisions i made six months ago that have matured into a tangled mess. The AI would nod along (metaphorically), help me solve something, and then — poof. Gone. Start over and encounter lapses in judgement that I've already addressed. Rinse and repeat.

Every AI has amnesia.

## The Accident

So i started saving things. When the AI explained something well, i'd ask it to write it up. Markdown files. Just notes to my future self.

"Here's how we handle state in this project."
"Watch out for this Svelte gotcha — it'll bite you."
"This is the naming convention. Stick to it."

The pile grew. Dozens of files. It became its own problem — where did i put that thing about debugging?

Then, curious, i asked the AI to help me organize the mess it had helped create. And something unexpected happened.

## The Click

I made one file that pointed to all the others. A table of contents. A starting point. And i told the AI: "Read this first, every time."

Suddenly the AI *knew things*. It remembered the patterns. It followed the house rules. It didn't ask me to re-explain the architecture — it had already read the doc.

It felt different. Not like talking to a stranger. Like picking up a conversation with someone who'd done their homework.

## The Delight

Here's what i wasn't expecting: joy.

Not just efficiency. Not just "fewer keystrokes." Actual delight in the collaboration.

There's a rhythm now. I describe a problem. The AI digs into the large and complex codebase, and comes back with observations and suggestions. We brainstorm. It proposes. I push back. It adjusts. We find something neither of us would've found alone.

It's pair programming. Real collaboration. The kind where two minds are better than one, where the back-and-forth generates something new.

Plus, my pair partner never gets tired. Never gets frustrated when i change my mind. Never judges me for the terrible code i wrote at 2am last year. Doesn't get offended when I say "this is a terrible idea." It just... helps.

Salary for this pretty-darned-awesome employee: way less than any human hire.

## The Junior Dev Analogy

I keep coming back to this framing: it's like having a junior developer who actually reads the documentation, down to the finest details it contains. And THEN begins collaborating. It's the junior dev that doesn't exist in real life. Infinite patience. Perfect memory. Eager to help. Cheap.

## The Team

"What a team" isn't ironic. I mean it.

Early on, i was alone. Steep learning curve. Thin documentation. Industry standards that felt unknowable. The pace of my project was heartbreakingly slow. 

Now, two years on, there's something almost giddy about the dynamic. I'll start a work session and the AI already knows what we were doing yesterday. Plus, the boring parts — the tedious chores of ... refactoring, the repetitive consistency fixes, the "update all 47 references to this thing" — the AI handles those. Never quite as fast as I want, but insanely faster than me doing it manually.

Massively less stressed by complexity and consistency, I get to play with interesting parts: aesthetics, algorithms, sudden flashes. My hireling handles the grunt work and occasionally spots things i missed.

## The Compound Effect

Another plus: it compounds.

Every problem we solve, every pattern we establish, every gotcha we document — it goes into the pile. And the pile makes the AI smarter. Not in some sci-fi way. Just... more useful. More aligned. More *mine*.

My AI today knows a mountain of things because i've been teaching it, one markdown file at a time. Each problem we work on gets added to this accumulated teaching. Baby steps that add up to a giant leap. The office i sit in now feels like driving a Mack truck, gobbling up the miles, hauling my soul.

## An Invitation

I'm not selling anything. There's no course, no framework, no SaaS product.

Just this: if you're using AI as a fancy search engine, you're leaving something on the table. The real magic isn't in the answers. It's in the relationship. The accumulated context. The institutional memory.

Build the pile. Teach the AI how you work. Let it learn your quirks.

You might end up with your own high-tech, endlessly helpful junior programmer.

---

## The How

Okay. Enough poetry. Here's what i actually did.

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

*I write about software development and occasionally about making AI actually helpful. Follow along if that sounds interesting.*
