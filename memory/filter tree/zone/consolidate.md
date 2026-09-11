# Consolidate the guides

## Success criteria

**Drive dissolved 7 September 2026:** the mechanical move is done and logged; this file is now the detail behind a pending pac in shared's `truth/decisions.md`, no longer the drive. **Moved 7 September 2026:** all 19 folders sit whole under `truth/` in their project, `git mv`, links re-pointed, no `notes/guides/` folder remains anywhere. **Not yet done:** the sorting below — nothing has folded, archived, or died; every file that entered truth sits there unsorted, waiting for the fold/archive/dead judgments this file proposes.

No `memory/<project>/notes/guides/` folder remains. Every one of the 142 guides has one of four fates, each recorded by a D: line in its project's log: it is a truth in `truth/`; it is folded into a truth that already holds its topic, and gone; it sits in `archive/`, readable and never loaded; or it is deleted. Every link into a moved guide resolves — the dead-link report finds **none**. CLAUDE.MD, the hooks, keywords.md and the maps name the new places. ov lists the same projects. `yarn vitest` 336 pass, `yarn svelte-check` clean, the dispatcher's 32 tests pass.

## The test each guide is put to

The handbook's own: a truth states the current design of one concept and is the only place that fact lives. A guide that does that enters truth. One whose topic a truth already holds folds into it. One that is history — a plan carried out, a thing since replaced, research that was decided — goes to archive. One the memory system itself replaced dies.

## Folder by folder

Counts from disk, 7 September 2026. "Fold" names the truth that takes it.

**shared/collaborate — 14.** Truth: `voice.md` (213 lines), `avoid murk.md`, `breakdown.md`, `hooks.md` (251), `exclude from maps.md`, `skills.md`. Fold: `chat.md` (277, who does what and what co must do) into conventions.md and agency.md — most of it is already there, rebuilt in September; `workflow.md` (184, propose before acting) into agency #8 and the shorthand; `expectations.md`, `context filters.md` and `jonathan.md` into conventions.md; `cadence.md` into whichever of those takes workflow. Archive: `composition.md` (Svelte component patterns, January), `write a journal.md` (the journals are old notes now).

**shared/develop — 24.** Truth: `migrate.md` (334), `refactor.md` (429), `port.md` — keywords.md sends co to them; `create a design.md`, `create a proposal.md`; `add a file.md`; `markdown structure.md`; `css.md`, `best practices.md`, `constants & subtypes.md` and `style guide.md` (595) — four files on code style, to become one truth per concept. Truth, but core's: `sections.md` (228) and `hits system.md` (202) — they describe core's stack and hits manager, so they enter `memory/core/truth/`. Fold: `aesthetics.md` into shared's `taste.md` — the inception file names this collision; `sections spec.md` into sections.md, since it is the same design written as porting steps; `unit testing.md` and `running e2e tests.md` into one `testing.md` with shared/test's; `lessons.md` into `pitfalls.md`. Archive: `build notes.md`, `build.md`, `tags hierarchy.md` (built, as Tag_Areas.ts), `better than sdd.md`, `conceptual composition.md`. Dead: `keep shop.md` — structuring note files for the next session is what the memory system does.

**shared/setup — 5.** Truth: `netlify.md` (create a project.md points at it), `onboarding.md`. Truth, but ji's: `manually install AnythingLLM.md`. Archive: `access.md` (the Claude desktop app reaching local files — unread whether still used), `vitepress.md` (the docs sites no longer build).

**shared/tools — 4.** Truth: `hub-app.md` (243), `git.md`, `code both sides.md`. Archive: `single line of progress.md`.

**shared/philosophy — 3.** Truth, but di's: `logic driven design.md` (rules, tests and code in lock-step — di's stipulations are its practice). Fold: `limitations.md` into pitfalls.md. Archive: `use ai.md` (why the work was structured with raw work files and distilled guides — the memory system is the answer now).

**shared/test — 2.** Truth: `testing.md` and `debugging.md`, taking develop's two test guides in.

**ws — 40.** Truth, `type: design`: the 29 under architecture, less the six below — they say how ws is built, and nothing else does. Zone: `debounce.md` (a proposal), `layout.md` (a map of tangled code, for a refactor), `svelte.md` (the Svelte 5 plan and where it is), `ux/components.md` (which to keep, which to rebuild). Archive: `svelte.5.md` (744, the migration howto), `platforms/vitepress.md`, `ux/titles.md` (captured before it was replaced), `ux/buttons.md` (gathered for a sanity check). The 9 manuals are the product's user manual, not memory: they go where di put its own, `ws/src/manual/`. collaborate: `style.md` to ws truth; `gotchas.md` folds into shared's pitfalls.md.

**di — 38.** Truth, `type: design`: the 29 under architecture. Truth, `type: spec`: `rules/stipulations.md` (379, pinned by tests, 138 links into the code) and `rules/dimensionals.md` (342), `project/overview/project.md`. Archive: `early di spec.md` (312, the founding checklist), the four under `project/research/` (decided, or kept as reading). Dead: `project/philosophy/update guides.md` — keeping guides in step with code is the settle.

**ov — 4, core — 4.** core's four are ov's four, byte for byte, from the carve: delete core's. ov's: `editing.md` and `compose an email.md` enter ov's truth; `ov - goals.md` (262, the founding proposal) folds its live parts into `scope.md` and goes to archive; `okf — is it worth it?.md` folds into `okf.md`.

**ji — 4.** Truth: the three specifications (db, hierarchy, intersection) and `launching the AI.md`.

## The sum

Of 142: 91 enter truth as they are, 17 fold into a truth and go, 22 go to archive, 6 go to zone, 9 leave memory for ws's manual, 6 die. The counts are the sorting above, added up; a second reading of any folder can move a file across a line.

## What changes with it

1. Sixteen folders' worth of `git mv`, one link pass of the kind used for the notes and pre-flight moves, and the index files gone.
2. Readers: CLAUDE.MD's reading-on-load list — `memory/shared/notes/guides/collaborate/` and `exclude from maps.md`; keywords.md, whose rows name guides as `develop/...` and `collaborate/...`; the maps of di, ji, lv and ws; the catalogs; ov's `site_of_file` and `file_path_of`, which build a guide's path under `notes/guides/` — a moved guide is a memory file answering to its project by `project_at`.
3. Labels: truth files carry `type:` from memory/index.md's five words; every guide carries `kind:`. Each is relabeled on entry, or the rule bends — open in shared's questions already.
4. The handbook's inception bullet, "its truths enter truth/ one at a time, the day work reaches for them", is rewritten: the guides enter sorted, all at once.

## Deciding questions

1. Does truth take sub-folders — `truth/architecture/…` for ws's and di's 29 each — or do they flatten into truth's one level, colliding names resolved by hand? Decided 7 September 2026: truth takes sub-folders; the guides keep their folders on entry.
2. Do the 17 folds happen on entry, each a hand merge, or do those files enter whole beside their twins and fold at a later settle?
3. Twenty-eight of the 91 truths are over the hundred-line limit; `style guide.md` is 595 and ws's `components.md` is 926. Cut on entry, or enter whole and cut when work reaches them?
