# Shared Architecture

How the shared repo works with project repos.

## Problem

Each project has its own institutional memory (CLAUDE.MD, notes/, guides/). When i `go w`, Claude loads webseriously's context. When i `go di`, Claude loads di's context. But:


1. **Isolation**: New learnings in webseriously aren't available when working on di
2. **Duplication**: Some guides apply to both projects (style, debugging patterns, voice)
3. **No shared commons**: No mechanism for cross-project knowledge

## Solution

Sibling repos with relative paths:

```
~/GitHub/
  shared/                        ← shared docs and tools (its own git repo)
    CLAUDE.MD
    guides/
      collaborate/               ← access, chat, voice, workflow
      develop/                   ← aesthetics, markdown, migration, refactoring, style
      test/                      ← debugging, testing
    tools/
      lib/                       ← source .ts files (committed)
      docs/                      ← test fixtures and documentation
      *.sh                       ← parameterized shell scripts
      tsconfig.json

  <project>/                     ← references ../shared/
    CLAUDE.MD
    notes/
      guides/                    ← project-specific guides only
      work/
      tools/
        config.sh                ← project-specific overrides
        dist/                    ← compiled .js (gitignored, local)
```

Each project's CLAUDE.MD includes:

```markdown
COMMON: Read ../shared/CLAUDE.MD
```

## What Goes Where

### Shared

**guides/collaborate/** — access, chat, voice, workflow, architecture (this file)

**guides/develop/** — aesthetics, markdown, migration, refactoring, style

**guides/test/** — debugging, testing

**tools/** — TypeScript libs, parameterized shell scripts, test fixtures

### Project-Specific

**webseriously** (`ws/notes/guides/`):

* `composition.md` — Svelte 4 patterns
* `gotchas.md` — Svelte 4 issues
* `plugin.md` — Bubble integration

**di** (`di/notes/guides/`):

* `develop/best.practices.md` — Svelte 5 patterns
* `develop/composition.md` — Svelte 5 patterns
* `develop/gotchas.md` — Svelte 5 issues
* `road.map.md` — di roadmap

## Setup for New Machines

### Clone Repos as Siblings

```bash
cd ~/GitHub
git clone <shared-url> shared
git clone <ws-url> ws
git clone <di-url> di
```

### Environment Variables

Add to `~/.zshrc`:

```bash
export NETLIFY_ACCESS_TOKEN="your-token-here"
```

Get token from: https://app.netlify.com/user/applications#personal-access-tokens

### Make Scripts Executable

```bash
chmod +x ~/GitHub/shared/tools/*.sh
```

### Project Config

Each project has `notes/tools/config.sh` with overrides:

```bash
NOTES_DIR="notes"
DOCS_SOURCE_DIR="notes/designs"
DOCS_OUTPUT="src/lib/ts/files/Docs.ts"
NETLIFY_SITE_ID="your-site-id"
```

## Workflow

* Edit shared guides/tools in shared repo, push normally
* Edit project docs in project repos, push normally
* Programmer B clones all three as siblings, pulls all when needed

Only friction: B must pull shared when you push to it.