# The Recipe (It's Not Foolproof)

*A practical guide to building your own AI collaborator*


---

I hope you are curious, and skeptical. I am, too. 


This is all technical stuff, where details matter. I'll try my best to take your hand and guide you through this handicraft. I can't know where your pinch points will be, and of course there will be some. Here's what i actually did. Take whatever appeals.

## What You'll Need

### **An AI with filesystem access.**

I use Claude with a Pro or Max subscription through claude.ai. Max gives you more usage — important when you're having long collaborative sessions. But Pro works fine to start.

The key feature: Claude can read and write files on your machine through MCP (Model Context Protocol). Without filesystem access, you're back to copy-pasting. That's slower and more tedious.

### **A code editor.**

I use VSCode. Nothing fancy. The important thing is having your project files organized in a way both you and the AI can navigate.

### **Basic Unix comfort.**

You don't need to be a wizard. But you should know:

* `cd` to change directories
* `ls` to list files
* `mkdir` to create folders
* How paths work (`~/GitHub/myproject` means your home folder → GitHub folder → myproject folder)

If that's gibberish, spend an hour with a Unix basics tutorial first. It'll pay off. Or, of course, jump off.

## The File Structure

Here's what my project looks like:

```
myproject/
├── CLAUDE.MD          ← the bootstrap file
├── src/               ← actual code
├── notes/
│   ├── architecture/  ← institutional memory
│   │   ├── foo.md
│   │   ├── bar.md
│   ├── guides/        ← institutional memory
│   │   ├── style.md
│   │   ├── gotchas.md
│   │   ├── debugging.md
│   │   └── voice.md
│   ├── tools/         ← useful unix scripts
│   │   ├── update_docs.sh
│   └── work/          ← active tasks
│       ├── current-feature.md
│       └── done/      ← archive
```

That's it. Nothing exotic. The magic is in the content, not the structure.

## The Bootstrap File

Create `CLAUDE.MD` in your project root. Here's a starter template:

```markdown
# CLAUDE.MD

REPO: ~/GitHub/myproject
GUIDES: Read all md files in `notes/guides` at start of session
WORK TRACKING: Keep `notes/work/<file>.md` updated as we go
FILES: Always read current version before editing

## Commands

| Command | Meaning |
|---------|---------|
| `work on <X>` | read `notes/work/<X>.md` and resume |
| `update docs` | update relevant documentation |
```

Customize it. Add your own commands. The point is: when you start a session, point the AI here first.

"Read CLAUDE.MD" becomes your greeting at the beginning a new chat.

## Building Guides (Slowly)

The guides and work folders start out empty. With each problem that you tackle with AI, at the end of the chat, ask it "Summarize what we just learned in `guides/<foo>.md`." I found this to be easy enough that I'm eager to do it, curious what it will write. I carefully read the file and spend some back and forth making it sensible, standalone, and tightly focused.

You might tackle similar problems several more times, capturing the essence and adding it to `<foo>.md`. As you tackle other problems, the guides files pile up. Copy and post this query: "review all the guide files highlighting redundancy, suggesting merges or clipping, and generally make this into a set of easily absorbed material. your audience is either you or a junior level software developer." It did a sweet job for my material.

## Work Tracking

When you start a task, paste this into a new `work` file:

```markdown
# Feature: User Authentication
**Started:** 2026-01-06
**Status:** Phase 1 in progress

## Problem
Users can't log in. Need OAuth integration.

## Goal
Working Google OAuth flow.

## Phase 1: Research
- [ ] Understand OAuth flow
- [ ] Find a library
- [ ] Sketch the implementation

## Next Action
**Phase 1:** Research OAuth libraries
```

Fill in the specific details. Of course, you only need enough to jog your memory of the problem. Update it as you go. Check boxes. Add notes. Pause a week or a month and give it no thought. Read it when you resume. Usually the generated material is brief and interesting.

Once the problem is resolved, consider whether you want to keep it. The ones I keep are ones that capture an important lesson. I sort them into three categories, moving them out of `work`:


| Folder | Purpose |
|--------|---------|  
| architecture | aspect of my software design |
| guides | common task or something learned |
| work/done | might be worth keeping |

## Things That Will Go Wrong

### **The AI will forget.**

Even with guides, Claude doesn't have infinite context. Long sessions get fuzzy. If things drift, say "reread CLAUDE.MD and the relevant guides." Reset the context.

### **Your guides will get stale.**

You'll change a pattern and forget to update the guide. Then the AI will do it the old way. When you notice, fix the guide. It's gardening, not architecture.

### **You'll over-engineer.**

I did. I made elaborate templates, complex folder structures, detailed taxonomies. Most of it was waste. Start simple. Add complexity only when the simple version fails.

### **The AI will make mistakes.**

It'll misunderstand. It'll break something. It'll confidently do the wrong thing. That's why "execute without asking" requires trust — and the ability to course-correct. Use git. Commit often. Undo is your friend.

## What Success Looks Like

After a few weeks:

* You start sessions with "work on X" and the AI knows what X is
* You stop re-explaining your coding style
* The AI catches things you'd miss ("this violates the pattern in style.md")
* Boring refactoring takes minutes instead of hours
* You feel less alone

It's not a replacement for thinking. It's a multiplier for doing.

## The Honest Truth

Some days it's magic. Some days it's frustrating. The AI hallucinates. The context window fills up. The MCP connection drops. I growl.


But the baseline keeps rising. Each guide you write, each pattern you capture, each gotcha you document — it accumulates. The AI you work with in a few weeks is meaningfully better than the one you started with. Not because the model changed. Because you taught it.


Your’e building a knowledge base of what, how, and the daily grind. Only corporations with deep pockets create such things, and they typically quickly go stale, wrong, useless. With a habit of proceeding this way, yours can always be updated by asking “review my code. Then review the notes and tell me what is out-of-date, disorganized or redundant.” Personally, I find that the experience is breathtaking.

## Getting Started Today

1. **Create the folder structure.** Five minutes.
2. **Write a minimal CLAUDE.MD.** Five minutes.
3. **Start your first work file.** Whatever you're working on right now.
4. **After your next "aha" moment, write it down.** First guide entry.

Don't overthink it. The system will evolve. Let it be messy at first. AI strikes me as a very capable janitor.


---

*Questions? Hit me up. I'm happy to share more of my actual guides if it helps.*