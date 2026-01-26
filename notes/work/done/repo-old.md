# Monorepo Architecture

How the mono repo organizes shared and project-specific content.

## Structure

```
~/GitHub/mono/
  CLAUDE.MD              ← shared context, loaded with `go mo`
  notes/
    guides/
      collaborate/       ← chat, shorthand, voice, workflow, etc.
      develop/           ← aesthetics, style, refactoring, etc.
      setup/             ← onboarding, deploy, vitepress, etc.
      test/              ← debugging, testing
    work/                ← active work files
    tools/               ← scripts, docs tooling
    sites/               ← hub app, dispatcher

  ws/                    ← webseriously (graph visualization)
    CLAUDE.MD            ← project-specific context
    src/
    notes/

  di/                    ← design intuition (CAD rebuild)
    CLAUDE.MD            ← project-specific context
    src/
    notes/
```

## Navigation

| Command | Result |
|---------|--------|
| `go mo` | Read mono/CLAUDE.MD |
| `go ws` | Read mono/ws/CLAUDE.MD |
| `go di` | Read mono/di/CLAUDE.MD |

## What Lives Where

**In `mono/notes/`** (shared):
- Collaboration guides — how co and Jonathan work together
- Development guides — code style, refactoring, aesthetics
- Setup guides — onboarding, deployment, tooling
- Work files — active tasks, journals

**In `<project>/notes/`** (project-specific):
- Project-specific guides
- Project-specific work tracking

## Rule

If a guide applies to multiple projects → `mono/notes/guides/`
If it's project-specific → `<project>/notes/`
