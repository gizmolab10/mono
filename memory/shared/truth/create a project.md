---
type: howto
title: Create a project
description: The steps to bring up a new project in the memory system, and in mono when it needs code.
tags: [howto, projects, setup, incorporated]
use_when: [creating a project, bringing up a new project, adding to memory]
updated: 28 August 2026
---
# Create a project

Two halves. The memory half is always done; the code half only when the project has an app.

## In memory

`memory/<name>/` with four things:

```
memory/<name>/
  index.md      what it is, how it stands, the truths listed
  log.md        the diary, empty but for the day it was brought up
  questions.md        what is unanswered, one line each
  truth/        empty; nothing is incorporated on day one
  zone/         one file to gather in
```

- **index.md** — frontmatter with only `description:`. Then the name as a heading, a line or two saying what the project is, a **Current state:** paragraph, and a `## Truths` heading reading "None yet."
- **log.md** — the usual frontmatter (`kind: analyze`, title `<name> log`, `tags: [journal, now]`, today's date), the heading, then `<!-- consolidated: never -->`, then today's day heading with a `S:` line saying it was brought up. What is still unknown goes into `questions.md`, not the log.
- **truth/** — left empty. A truth on day one is a guess.
- **zone/** — one file, named for what will gather there: `ideas.md` for a project about building something, `observations.md` for one about watching something. Frontmatter and a heading, nothing else.

The zone file is what makes the project useful immediately: it is where everything goes until it is understood well enough to be a truth.

## In mono, when there is code

Copy ov's structure, and no more of it than the project uses:

- `package.json` — the name, and only the dependencies it actually has.
- `index.html` — the title, and a script tag pointing at `src/lib/ts/main.ts`.
- `vite.config.ts` — reads its port from `notes/tools/hub/ports.json`.
- `tsconfig.json`, `svelte.config.js`, `.gitignore`, `src/vite-env.d.ts` — copied from ov unchanged.
- `src/lib/ts/main.ts` — mounts one component, nothing else.
- `src/lib/svelte/main/App.svelte` — the whole app on day one.
- `CLAUDE.md` — a few lines: what it is, and a pointer at `memory/<name>/`.

Then two registrations, both easy to forget:

1. **`notes/tools/hub/ports.json`** — a new entry with the next free port and the repo url.
2. **mono's `package.json`** — the name added to `workspaces.packages`, in alphabetical order.

Finally, `yarn install` at mono's top, on the Mac. Nothing runs until that links the new folder.

**Adding a workspace can move what yarn hoists.** ws pins svelte 4 and every other project wants 5; adding two projects on 1 September 2026 was enough for yarn to lift ws's 4 to the root, where the checker found it and refused svelte 5's own syntax in core, lv and gallery. Mono's workspaces hold a `nohoist` for `webseriously/svelte` to keep it down in ws alone. The pattern names the **package**, never the folder — `ws/svelte` does nothing at all. After bringing up a project, run one project's `check` to prove nothing moved.

## In the hub

Only a project with a port belongs here — the hub launches dev servers and opens sites, so a memory-only project would get a button that opens nothing.

Three edits, all in `notes/tools/hub/index.html`:

1. **The button**, in the `project-row` group beside the others: `<button class="project" data-project="<name>"><name><span class="badge">?</span></button>` The badge is one free letter. Taken so far: M, J, W, V, I, Z, O, U — and the action badges B, E, X, R, G, Y, N, P, L, D.
2. **Both config maps** — one line each in `config.app` and `config.docs`: `<name>: buildProjectConfig('<name>', 'app'),` `buildProjectConfig` reads `ports.json` and answers null where a mode has nothing, so a project with no docs needs no special case.
3. **The key**, copied from the line above it in the keydown switch, with the letter and the name changed.

The dispatcher also names collections it will read and write, in `dispatcher.py` — the tuples at roughly lines 339 and 514. Add the new name there only when ov should list that project's files.

## Both halves done

Say so in the new project's log, and nowhere else. A new project needs no announcement in shared — the folder is the announcement.
