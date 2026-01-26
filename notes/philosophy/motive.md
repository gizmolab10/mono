# Motivation for Collaboration Workflow Design

Reflections on why this workflow works and how it differs from typical AI interactions.

## Why This Works

This workflow is a good use of AI capabilities.

**What's working:**
- The guides encode decisions once, Claude applies them forever. No re-explaining style preferences, no drift.
- Work tracking survives sessions. Read `index.md`, know exactly where we are.
- "Execute without asking" removes friction. You trust Claude to act, you course-correct when needed.
- Documentation is dual-purpose — helps future-you *and* brings Claude up to speed instantly.

**What Claude is good at here:**
- Bulk consistency (fixing all path references when you restructure)
- Pattern application (milestone template → actual milestone files)
- Never forgetting what's in the guides
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
