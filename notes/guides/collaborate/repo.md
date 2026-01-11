# Shared Architecture

How the shared repo works with project repos. See [onboarding.md](../develop/onboarding.md) for new machine setup.

## Problem

Each project has its own context (CLAUDE.MD and notes). But:

* Learnings in one project aren't available in another
* Some guides apply to all projects
* Ahem, we need a shared commons

## Shared Commons Repo

If a guide is useful in multiple projects → shared
If it's project-specific → project repo

Shared is a sibling repo alongside the project repos. Very similar file structures:

```
~/GitHub/
  shared/               ← cross-project docs and tools
    CLAUDE.MD
    notes/
      guides/
        collaborate/    ← access, chat, voice, workflow, repo
        develop/        ← aesthetics, style, migration, refactoring
        test/           ← debugging, testing
      tools/

  <project>/            ← references ../shared/
    CLAUDE.MD           ← includes "Read ../shared/CLAUDE.MD"
    notes/
      guides/           ← project-specific only
      work/
```

