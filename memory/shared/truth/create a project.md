# Create a project

Two halves. The memory half is always done; the code half only when the project has an app.

## In memory

`memory/<name>/` holds:

```text
memory/<name>/
  index.md         what it is, how it stands, the truths listed
  truth/           empty; nothing is incorporated on day one
  zone/
    questions.md   what is unanswered, one line each
    ideas.md       one file to gather in
  logs/
    log.md         the diary, empty but for the day it was brought up; the app's own logs come to sit beside it
```

- **index.md** — frontmatter with only `description:`. Then the name as a heading, a line or two saying what the project is, a **Current state:** paragraph, and a `## Truths` heading reading "None yet."
- **logs/log.md** — the usual frontmatter (`kind: analyze`, title `<name> log`, `tags: [journal, now]`, today's date), the heading, then `<!-- consolidated: never -->`, then today's day heading with a `S:` line saying it was brought up. What is still unknown goes into `zone/questions.md`, not the log.
- **truth/** — left empty. A truth on day one is a guess.
- **zone/** — `questions.md`, and one file named for what will gather there: `ideas.md` for a project about building something, `observations.md` for one about watching something. Frontmatter and a heading, nothing else.

The zone file is what makes the project useful immediately: it is where everything goes until it is understood well enough to be a truth.

## In mono, when there is code

Copy ov's structure, and no more of it than the project uses:

- `package.json` — the name, and only the dependencies it actually has.
- `index.html` — the title, and a script tag pointing at `src/lib/ts/main.ts`.
- `vite.config.ts` — reads its port from `tools/hub/ports.json`.
- `tsconfig.json`, `svelte.config.js`, `.gitignore`, `src/vite-env.d.ts` — copied from ov unchanged.
- `src/lib/ts/main.ts` — mounts one component, nothing else.
- `src/lib/svelte/main/App.svelte` — the whole app on day one.
- `CLAUDE.md` — a few lines: what it is, and a pointer at `memory/<name>/`.

Every app takes core, so the new project takes a library on day one: the alias, the bridge and the test, per [libraries](../zone/architecture/libraries.md).

Then three registrations, all easy to forget:

1. **`tools/hub/ports.json`** — a new entry with the next free port and the repo url.
2. **mono's `package.json`** — the name added to `workspaces.packages`, in alphabetical order.
3. **`tools/hub/servers.sh`** — a `PORT_<NAME>=$(get_port "['<name>']['port']")` line beside the others, and a `"<name>|$PORT_<NAME>|<name>|yarn dev"` row in `SITES`. Without the row, start-all skips the project. Its log lands in `memory/<name>/logs/` by `start_site`'s own rule; nothing else to do.

Finally, `yarn install` at mono's top, on the Mac. Nothing runs until that links the new folder.

**Adding a workspace can move what yarn hoists.** ws pins svelte 4 and every other project wants 5; adding two projects on 1 September 2026 was enough for yarn to lift ws's 4 to the root, where the checker found it and refused svelte 5's own syntax in core, lv and gallery. Mono's workspaces hold a `nohoist` for `webseriously/svelte` to keep it down in ws alone. The pattern names the **package**, never the folder — `ws/svelte` does nothing at all. After bringing up a project, run `yarn run check` in one project to prove nothing moved — `run` is needed: `yarn check` alone is yarn's own integrity check, not the script.

## In the hub

Only a project with a port belongs here — the hub launches dev servers and opens sites, so a memory-only project would get a button that opens nothing.

Three edits, all in `tools/hub/index.html`:

1. **The button**, in the `project-row` group beside the others: `<button class="project" data-project="<name>"><name><span class="badge">?</span></button>` The badge is one free letter. Nearly every letter is taken — on 7 September 2026 only F, H and Q were free — so grep the keydown switch for `case '<letter>'` before picking, since a project's case placed above an action's with the same letter silently takes that action's key.
2. **Both config maps** — one line each in `config.app` and `config.docs`: `<name>: buildProjectConfig('<name>', 'app'),` `buildProjectConfig` reads `ports.json` and answers null where a mode has nothing, so a project with no docs needs no special case.
3. **The key**, copied from the line above it in the keydown switch, with the letter and the name changed.

The dispatcher also names collections it will read and write, in `dispatcher.py` — the one `COLLECTIONS` tuple near the top — and ov names them again in `T_Bundle`, in `ov/src/lib/ts/types/File.ts`. Add the new name to both only when ov should list that project's files; one without the other lists nothing.

## Both halves done

Say so in the new project's log, and nowhere else. A new project needs no announcement in shared — the folder is the announcement.
