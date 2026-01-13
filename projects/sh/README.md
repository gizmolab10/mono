# Shared Documentation & Tools

This repo contains common guides and tools shared across projects.

## Structure

```
shared/
  guides/
    collaborate/    ← working with Claude
    develop/        ← coding patterns
    test/           ← debugging, testing
  tools/
    lib/            ← TypeScript tools for VitePress docs
```

## Guides

Read these to understand how we work:

- `guides/collaborate/voice.md` — writing style
- `guides/collaborate/chat.md` — problem-solving with Claude
- `guides/collaborate/workflow.md` — the meta-system
- `guides/develop/markdown.md` — doc formatting patterns
- `guides/test/debugging.md` — systematic debugging

## Tools

TypeScript tools for VitePress documentation management:

- `fix-links.ts` — find and fix broken links
- `merge-files.ts` — merge markdown files, update references
- `sync-sidebar.ts` — regenerate sidebar from filesystem
- `generate-sidebar.ts` — sidebar generation logic
- `markdown-parser.ts` — link parsing and updating
- `link-finder.ts` — file search utilities
- `config-updater.ts` — VitePress config manipulation

### Usage

Projects compile these tools locally:

```bash
cd <project>/notes/tools
npx tsc -p ../../shared/tools/tsconfig.json --outDir ./dist
node dist/fix-links.js
```

## For Projects Using This Repo

Each project's CLAUDE.MD should include:

```markdown
COMMON: Read ../shared/CLAUDE.MD and guides first
```

Clone as sibling:
```
~/GitHub/
  shared/        ← this repo
  di/            ← project
  webseriously/  ← project
```
