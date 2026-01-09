# Commoditize the Workflow

**Started:** 2026-01-08
**Status:** Planning

## Problem

i built a system for AI collaboration that works better than existing tools (Claude Projects, Cursor rules, etc.). It's sitting in my repos, useful only to me.

## Goal

Package this into something others can use. Template repo + methodology guide + visibility.

## What i'm Selling

Not files — a methodology:
- Bidirectional docs (Claude reads AND writes)
- Living guides that accumulate wisdom
- Work tracking that survives sessions
- Context-switching rituals ("go ws", "go di")
- Voice/style docs that shape output

## Phases

### Phase 1: Template Repo
- [x] Create `enhanced` repo ✅
- [x] Minimal CLAUDE.MD with instructions ✅
- [x] Starter notes/guides/ structure (voice.md, workflow.md, style.md stubs) ✅
- [x] Starter notes/work/ structure ✅
- [x] README explaining the system ✅
- [ ] Initialize git repo
- [ ] Push to GitHub

#### Git Setup Steps

```bash
cd ~/GitHub/enhanced
git init
git add .
git commit -m "Initial commit: template for AI collaboration workflow"
```

Then create repo on GitHub (github.com/new), and:

```bash
git remote add origin git@github.com:gizmolab10/enhanced.git
git branch -M main
git push -u origin main
```

### Phase 2: Methodology Article
- [ ] Write "Why Your AI Forgets Everything (And How to Fix It)"
- [ ] Cover: the problem, existing solutions, why they fall short, this approach
- [ ] Include concrete examples from real usage
- [ ] Publish on Medium (drafts already in work/articles/)

### Phase 3: Visibility
- [ ] Post to Hacker News
- [ ] Share in relevant Discord/Slack communities
- [ ] Maybe Twitter/X thread version
- [ ] Consider short demo video

### Phase 4: Iterate
- [ ] Collect feedback from early users
- [ ] Refine template based on friction points
- [ ] Add examples for different use cases (not just dev)

## Open Questions

- License? MIT probably
- Name? "enhanced" for now
- How minimal should template be? (too much = overwhelming, too little = useless)
- Include my actual guides as examples, or keep abstract?

## Competition

| Tool | What it does | Gap |
|------|--------------|-----|
| Claude Projects | Static knowledge blob | No bidirectionality, stale |
| Cursor .cursorrules | Code style hints | Not workflow, not docs |
| Custom GPTs | Persona + static knowledge | Same as Projects |
| Prompt libraries | Copy-paste prompts | Miss the point entirely |

## Next Action

**Phase 1:** Create the template repo structure. Start minimal.
