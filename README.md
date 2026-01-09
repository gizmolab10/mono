# Claude Workflow

A system for AI collaboration that remembers.

## The Problem

Claude forgets everything between conversations. You explain your project, your preferences, your patterns — then next chat, gone.

Existing solutions:
- **Claude Projects** — static knowledge blob, gets stale, no bidirectionality
- **Cursor rules** — code-focused, not workflow
- **Custom GPTs** — same limitations as Projects

## This Solution

Documentation that Claude reads AND writes:

```
your-project/
  CLAUDE.MD        # Entry point — Claude reads this first
  notes/
    guides/        # Living reference (voice, style, patterns)
    work/          # Active work tracking
    work/done/     # Completed work
```

The magic: Claude doesn't just consume your docs — Claude helps maintain them. Work tracking updates as you go. Patterns become guides. Knowledge accumulates.

## Quick Start

1. Copy this template into your project
2. Start a conversation with Claude
3. Say: "read CLAUDE.MD" (or paste its contents)
4. Work on something
5. Watch docs update as you go

## What's Included

| File | Purpose |
|------|---------|
| `CLAUDE.MD` | Entry point, commands, defaults |
| `notes/guides/workflow.md` | How the system works |
| `notes/guides/voice.md` | How you want Claude to write (customize this) |
| `notes/guides/style.md` | Code conventions (customize this) |
| `notes/work/` | Where active work lives |
| `notes/work/done/` | Where completed work goes |

## How It Works

1. **Start**: Claude reads CLAUDE.MD and notes/guides/
2. **Work**: You collaborate — Claude executes, you steer
3. **Track**: Work progress lives in notes/work/<topic>.md
4. **Accumulate**: Patterns become guides, guides sharpen over time

## Customization

The included guides are starters. Replace them with your own:

- **voice.md** — Capture how you write. First person? Casual? Problem-first?
- **style.md** — Capture your code conventions. Naming? Formatting? Patterns?
- **Add more guides** — Whatever patterns you find yourself repeating

## Tips

- **"work on X"** — Creates or resumes notes/work/X.md
- **"ua"** — "Update accordingly" — tells Claude to update docs with current context
- **Keep guides lean** — Claude reads them every session. Bloat = wasted tokens.
- **Let it evolve** — The system improves as you use it. That's the point.

## License

MIT — do whatever you want with it.
