# Converting guides to new memory design

Gathered 14 September 2026 from the four places that told it: shared's `truth/decisions.md`, ov's `zone/consolidate.md`, the inception checklist now at `memory/ai/zone/ai/inception into the new design.md`, and each project's `index.md`. Those files still say what they said; this one holds it together.

## summary


1. What the guides were: 19 folders, 142 files under each project's notes folder.
2. What moved and when, six dated steps from 29 August to the 14 September change in Saving.ts.
3. What each project's index says moved whole, unsorted.
4. The 7 September decision, quoted whole from shared's decisions.md.
5. The sorting from ov's consolidate.md: the test, folder by folder, the sum, what changes, the deciding questions.
6. What is still open: the sorting itself, two deciding questions, the inception checklist's open lines, two duplicates.

## What the guides were

Every project's guides sat under `memory/<project>/notes/guides/`, one folder per project, the shared ones under `memory/shared/notes/guides/`: 19 folders, 142 files. Beside guides sat `notes/designs/` and `notes/work/`. ov's `Saving.ts` built every file's path under those folders, and its File record carried `is_design` for the designs.

## What moved, and when

1. 29 August 2026: `guides/pre-flight/lexicon.md` merged into `memory/ai/truth/lexicon.md` and removed.
2. 30 and 31 August 2026: handoff and code debt dissolved. Each project's unpaid debt leads its zone, done sections dead at the door, git keeping them; state to `index.md`, live work to zone, history to git.
3. 31 August 2026: the file maps moved whole into `truth/`, seven of them, di three, ji two, lv, ov; core's copy of ov's removed.
4. 7 September 2026: `memory/shared/notes/guides/pre-flight/` folded. always, response and banned words became sections of `truth/conventions.md`, which the hooks read; the mono-wide lexicon became `truth/lexicon.md`; agency, keywords, gates, kinds of tasks, pitfalls and shorthand moved whole into `truth/`.
5. 7 September 2026: all 19 `notes/guides/` folders moved whole into their project's `truth/`, by `git mv`, keeping their sub-folders, links re-pointed, the index files gone. No `memory/<project>/notes/guides/` folder remains. The dead-link report found none. CLAUDE.MD, the hooks, keywords.md and the maps named the new places. vitest 336 passing, svelte-check clean, the dispatcher's 32 tests passing.
6. 14 September 2026: kb's `Saving.ts` stopped building paths under `notes/guides/`, `notes/designs/` and `notes/work/`. Every collection's path counts from its own folder at the top of the repo: memory's under `memory`, mono's the repo itself, a project's under its folder.

### What each project's index says moved whole, unsorted

1. shared: `collaborate/`, `develop/`, `philosophy/`, `setup/`, `test/`, `tools/`.
2. di: `architecture/` (36 files), `development/` (6), `project/` (12).
3. ji: `project/` (1), `setup/` (2), `specifications/` (5).
4. ws: `architecture/`, `collaborate/`, `manuals/`.
5. core: `design/` (6), `project/` (1).
6. ov: `design/`, `project/`.

## The decision, 7 September 2026, from shared's decisions.md

> **sort the 142 guides now sitting unsorted in truth/.** The move is done — all 19 `notes/guides/` sub-folders are in their project's `truth/`, links re-pointed, tests green — but every guide entered whole, none folded, archived or killed. What remains is the sorting, weighed folder by folder in ov's zone/consolidate.md: of 142, 91 stay in truth as they are, 17 fold into a truth that already holds their topic and go, 22 move to archive, 6 to zone, ws's 9 manuals leave memory for `ws/src/manual/`, 6 die. Each fate lands a D: line in its project's log; the handbook's test decides a doubtful one — a truth states one current design and is its only home, history goes to archive, what the memory system replaced dies. For: the guides are the last of the old notes, and an unsorted truth/ with 142 files in it hides the truths that matter among plans carried out and things since replaced; the sorting is a reading task, no code, the folder-by-folder call already drafted. Against: 17 hand-merges and 6 deletions are judgment that a second reading can move a file across a line, so each wants Jonathan's eye before it is irreversible; nothing is broken while they sit unsorted, so the cost of waiting is only clutter. Deciding questions, the two consolidate.md leaves open: (1) do the 17 folds happen on entry, each a hand merge, or do those files sit beside their twins and fold at a later settle? (2) twenty-eight of the 91 truths are over the ~100-line limit — `style guide.md` 595, ws's `components.md` 926 — cut on entry, or enter whole and cut when work reaches them?

## The sorting, from ov's consolidate.md

### The test each guide is put to

The handbook's own: a truth states the current design of one concept and is the only place that fact lives. A guide that does that enters truth. One whose topic a truth already holds folds into it. One that is history — a plan carried out, a thing since replaced, research that was decided — goes to archive. One the memory system itself replaced dies.

### Folder by folder

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

### The sum

Of 142: 91 enter truth as they are, 17 fold into a truth and go, 22 go to archive, 6 go to zone, 9 leave memory for ws's manual, 6 die. The counts are the sorting above, added up; a second reading of any folder can move a file across a line.

### What changes with it

1. Sixteen folders' worth of `git mv`, one link pass of the kind used for the notes and pre-flight moves, and the index files gone.
2. Readers: CLAUDE.MD's reading-on-load list; keywords.md, whose rows name guides as `develop/...` and `collaborate/...`; the maps of di, ji, lv and ws; the catalogs; the page's `site_of_file` and `file_path_of`, which built a guide's path under `notes/guides/` — done 14 September 2026, a moved guide is a memory file answering to its project by `project_at`.
3. Labels: truth files carry `type:` from memory/index.md's five words; every guide carries `kind:`. Each is relabeled on entry, or the rule bends.
4. The handbook's inception bullet, "its truths enter truth/ one at a time, the day work reaches for them", is rewritten: the guides enter sorted, all at once.

### Deciding questions

1. Does truth take sub-folders, `truth/architecture/…` for ws's and di's 29 each, or do they flatten into truth's one level? Decided 7 September 2026: truth takes sub-folders; the guides keep their folders on entry.
2. Do the 17 folds happen on entry, each a hand merge, or do those files enter whole beside their twins and fold at a later settle?
3. Twenty-eight of the 91 truths are over the hundred-line limit; `style guide.md` is 595 and ws's `components.md` is 926. Cut on entry, or enter whole and cut when work reaches them?

## What is still open

1. The sorting. Nothing has folded, archived or died since 7 September 2026; every guide sits in `truth/` as it entered, and each project's index says unsorted.
2. Two deciding questions above, 2 and 3.
3. The inception checklist's open lines: shared's `collaborate/` fold and archive judgments; the other five shared folders and every project's own, in truth unsorted; the learn file; CLAUDE.md's reading-on-load list, which shrinks as the lines above die.
4. Two duplicates the inception file still names: `taste.md` against develop's `aesthetics.md`; the design's own story told three ways, the rationale in `AI memory redesign.md`, the law in `handbook.md`, the article in `publish — can an AI actually learn?.md`.
