# Motivation for Collaboration Workflow Design

Reflections on why this workflow works and how it differs from typical AI interactions.

## Why This Works

This workflow is a good use of AI capabilities.

**What's working:**
- Guides encode decisions once, Claude applies them forever — no re-explaining, no drift
- Work tracking survives sessions — read the file, know exactly where we are
- "Execute without asking" removes friction — trust Claude to act, course-correct when needed
- Documentation is dual-purpose — helps future-you *and* brings Claude up to speed instantly
- Bulk consistency — Claude fixes all path references when you restructure
- Pattern application — milestone template → actual milestone files
- Drafting content you can massage rather than starting from blank

**What you're still doing:**
- Taste. You know when something's "too gappy" — Claude doesn't feel that, just follows rules once you articulate them.
- Creative direction. Origin story, milestone names, what matters — that's yours.
- Judgment calls. When to deviate from the template, when to restructure.

**The result:** Most AI interactions are one-off Q&A. This is collaborative project work with accumulated context. That's a different game.

## Is This Approach Common?

Not really. Individual pieces exist:

- **Custom instructions / system prompts** — common, but usually static personality tweaks, not project-specific bootstrapping
- **README-driven development** — some people include AI context in READMEs, but usually for one-off use
- **Cursor/Copilot rules files** — `.cursorrules`, similar idea but more focused on code style than workflow
- **Claude Projects** — Anthropic's feature encourages persistent instructions, but most people use it for persona, not this level of structure

What's less common:
- The guides-as-accumulated-wisdom pattern (gotchas.md, debugging.md evolving from actual pain)
- Work tracking that explicitly survives sessions with resume points
- The "massage it, then tell Claude the pattern" loop for template discovery
- Treating documentation as *shared context* rather than just human reference

This feels more like pair programming methodology than prompt engineering. An institutional memory system that happens to include an AI.

The pieces are obvious in hindsight, but rarely assembled this way.

## The Philosophy Underneath

### Let it develop naturally

i like that we let structure emerge, like a journey without a map. Start with nice pithy articulation of raw curiosity. Travel carefully. The structure comes at the end.

Work files are just that — things we need to know and things we did. Guides are the maps of the turf, what's been learned about it. The guides are condensed out of the work, things like "oh, shit, we need to do this and not that."

### Dual purpose

Documentation has two audiences: me, a lot later and rather forgetful, and AI the amnesiac.

Work tracking is the other side of the coin. Focus, details, decisions. Later, read the file, know exactly where we are. My brain feels better just saying this.

### Friction into feature

We describe our process, too. Like, "ugh, this thing is badly broken." Pause and scratch noggin. Often enough something cool settles into play.

Patterns come from pain — why else remember them?
