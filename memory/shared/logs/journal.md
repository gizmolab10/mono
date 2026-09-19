# Journal

**Current** The plan in [music and ai](../../ai/zone/work/music%20and%20ai.md), ov's strip down into kb and ai, step 14 built and step 19 begun 15 September 2026. shared's drive is empty.


**Summary** Started webseriously as graph visualization tool. Built di as quaternion rotation demo, rebuilding a 20-year-old CAD program. Developed collaboration workflow with Claude through trial and error — CLAUDE.MD files, structured guides, work tracking.

---

## 2026-09-18 — logs/learn.md: its Process, before the merge with corrections.md

Kept here as history when learn.md became a file of checkboxes alone. Its Distilled table lives on in logs/distilled.md, where record adds a row for every correction it places.

## Process

as we roll along, we hit a lot of bumps. i've noticed that i get fed up and stop dead. clean house. takes time. need a better triage system. Let's start with:

- [ ] list mistakes as they happen (oldest last)
    - [ ] hyphen-N date title
- [ ] distill: identify pattern, write rule, add to guide
- [ ] research: better tools, clever ideas
- [ ] track for escalating need:
    - [ ] fed up
    - [ ] stop dead
    - [ ] clean house

**To distill an entry:**

1. Identify the pattern (what went wrong, repeatedly?)
2. Write a rule (imperative, actionable)
3. Write it as one checkbox line in `memory/shared/zone/corrections.md`, in co's words, replacing a line already saying something close; Jonathan rewrites it and ticks it, and record moves it into its guide
4. Remove the raw entry from this file

## 2026-09-18 — drive: a shorthand that makes a proposal the drive

**Why.** Jonathan wanted one command that moves a proposal into drive.md and replaces what is there, and one that builds the drive and puts the proposal where finished work goes. Before it, a proposal became the drive by hand, and the handbook had the drive dissolve into truth on his instruction.

**What changed.** Two shorthand rows: `drive <X>` makes proposal X the drive, open or decided, replacing everything below drive.md's Current state and journaling the plan it replaced; `drive` or `go drive` implements drive.md and moves the proposal to working features as a feature description when it is an app feature, or else to the work journal as what was changed and why. Workflow's cadence row lists drive among its tasks and its drive row has the states present, implemented, a feature or journaled. cadence.md's table and cadence.svg's drive lane say the same, `drive X` on the arrow from a decided proposal. The handbook's drive line and the lexicon's drive entry say it; dissolving into truth is gone.

**The proposal, as written.**

## drive (18 September 2026)

Proposal, a shorthand that makes a proposal the drive.

we will rely on some stuff we have

1. drive.md, opening with the Current state paragraph, the plan below it
2. proposals, `##` sections in proposals.md or a zone file of its own
3. the work journal
4. the shorthand `drive <X>`      <- we need this one

**What it does.** X names a proposal, open or decided. Nothing is required of its words and nothing is refused.

1. drive.md keeps its Current state paragraph. Everything below it is replaced by the proposal's text under the proposal's heading, plus one present-tense line saying where it stands.
2. The proposal's section leaves proposals.md, or its zone file is deleted through the dispatcher. Its index line goes with it.
3. The plan it replaced goes into the work journal as one entry under the old heading. The reply names what was replaced.
4. One D: line in the project's log.

**What else changes.** Workflow's cadence row lists `drive` among its tasks, and its drive row says `drive <X>` makes the drive present. cadence.md's table and cadence.svg's arrow say `drive <X>` in place of "work starts".

**Success.** After `drive <X>`, the proposal is in drive.md and nowhere else, the old plan is in the journal, and code debt lists drive.md with the new plan's open boxes.

**Current status:** run by hand for this proposal on 18 September 2026, before the shorthand row exists. Workflow's two rows, cadence.md's table and cadence.svg's arrow say `drive X` since the same day's decision on `drive` and `go drive`. The shorthand row `drive <X>` is still to write.

## 2026-09-17 — logs/proposals.md: 11 proposals settled

## libraries resolve through the workspace, not through aliases (10 September 2026)

Dead, 10 September 2026. The aliases and the bridges stay: one alias per library in each host's tsconfig and vite config, one bridge per library in each host, and a library that imports a library does the same. An exports map saves one line per library at the cost of an extension on 110 bridge lines and an unproved link on Netlify.

Proposal — the answer to the open thread in [handoff](memory/shared/zone/work/done/handoff.md). What exists, read today: mono is one yarn workspace. The root package.json lists core, panel, gallery and the hosts, and yarn has linked core, gallery and panel into the root node_modules. Nothing is published outside mono: no package has an `exports` field, and the two live sites, lv and mj, are built by vite from the whole checkout on Netlify. So the handoff's first situation is the one that applies: no build step per library, no svelte-package, no Turborepo or Nx.

**What mono does today.** Each host reaches a library through an alias written in three places, tsconfig's paths, vite's resolve, and a standalone vitest config where a host has one. Each library's own files reach core the same way, through whatever host is building them. Seven tsconfigs carry the core alias, two the gallery alias.

**The one change the handoff's advice points to.** Each library's package.json gains an `exports` map that points at its source, so `core/ts/common/Constants` and `gallery/lib/svelte/Gallery.svelte` resolve through the workspace link from anywhere, host or library, with no alias in any host. TypeScript's bundler resolution, vite and vitest all read `exports`. The bridges stay: only Core.ts and Gallery.ts import from a library, and Aliases.test.ts still proves it. For core:

```json
"exports": {
  "./main.css": "./src/lib/main.css",
  "./*.svelte": "./src/lib/*.svelte",
  "./*": "./src/lib/*.ts"
}
```

gallery's is the same over `./src`, with a line for `./css/*.css`.

**Project references**, TypeScript's own tsconfig settings for checking a chain of packages one package at a time, speed `tsc` across a chain. Each host's check already covers the library files it imports, 470 files in a few seconds, so they wait until check times hurt.

**Success criteria.** Every tsconfig and vite config loses its paths and alias lines. Every check, test and build passes as now, and the alias tests pass unchanged. One deploy on Netlify proves the link resolves there too.

**Cost.** Three exports maps, about five lines each. The alias lines out of seven tsconfigs, seven vite configs and ov's vitest config.

panel gets its map now too. In the code today nothing imports panel, but in [library projects](library%20projects.md) gallery and the filter tree both do, and a map is what lets them.

**Open.** Whether each host's package.json should list core, panel and gallery as dependencies, so the link is declared rather than relied on.

## lv and mj import gallery (9 September 2026)

Proposal — gallery becomes a library two hosts import: lv, whose code it is, and mj, which mj's ideas say will be a gallery.

Decided and built 9 September 2026. gallery holds nothing of lv's. The `gallery` alias points at `gallery/src` in lv's and mj's tsconfig and vite config, and each has `common/Gallery.ts` beside Core.ts. lv imports Main.svelte and the stylesheet, hands gallery its three switches in Main.ts, keeps App.svelte, Main.ts, Core.ts, Customizations.ts, its netlify functions, its pages and its pictures, and deleted the 34 files gallery now provides. mj imports Gallery.svelte and photosInFolder into its operation view, with no pictures yet, and gallery's edit button into its controls row. Of gallery's two stylesheets it takes Gallery.css, the pictures and their editing, and not Main.css, whose page shell and hamburger rules fight panel's. Every check, test and build passes, and Aliases.test.ts in each host proves only the bridges name an alias. Still open: which of mj's two layouts goes, and where mj's pictures live.

**Where each is today.** gallery is lv's code file for file, 51 files each, the vineyard's pictures and words included. gallery's ideas say what it is meant to be: an extended core, a gallery of files, mostly images, with editing and adding. Its two questions are unanswered: what it drags and drops onto, and how much of lv's code survives that answer. lv draws the vineyard site from that code. mj draws panel, and its ideas say it will be a gallery, a subdomain of jonathansand.me. No project imports gallery. Both already import core.

**What happens in gallery first.** lv's own content goes, its ideas' one item: the vineyard folder under assets, the photo list, the vineyard's markdown. Then each remaining file is named library or app. The svelte pieces and the utilities are the library. App.svelte and Main.ts are the app, and gallery's App becomes the smallest host of its own library, as panel's would. The twelve test files stay beside the code they prove.

**What happens in a host.** The `gallery` alias in tsconfig and vite config, two lines, as for core. One bridge for gallery beside Core.ts. Then, one file at a time, the host imports gallery's and deletes its own. lv ends with none of the 51 of its own but App.svelte, Main.ts, its assets and its words. mj gains a gallery of its own pictures through the same lines.

**Success criteria.** lv draws exactly as today, measured, with no file of its own that gallery holds. mj shows its own pictures through gallery's pieces. Every host's check, build and tests pass, and one test per host proves only its bridge names the alias.

**Cost.** gallery: the removal, then the naming of each file. lv: two config lines, one bridge, one deletion per piece, forty or so. mj: two config lines, one bridge, its pictures, and the fitting of gallery's sidebar and renderer to panel's three regions or the other way.

**Open.** gallery's own two questions come first. mj has two layouts on offer, panel's three regions and gallery's sidebar beside a renderer, and one must go. Where mj's pictures live, since lv's gallery truth names the repo today and remote storage as the alternative. Whether Router, Parser and Persistence are gallery's or the host's, weighed in [gallery's proposals](../../gallery/logs/proposals.md). The library pac in truth/decisions.md, undecided, is answered for gallery by this: a project made to be taken.

## a name for the outer div, for every project (9 September 2026)

Proposal — one class for the outer div in every App.svelte, in place of `frame`, which in html names an embedded document and does not match this div.

Decided and built 9 September 2026: `.app`, in ov, panel, mu and mj. Four checks clean.

**The div.** Fixed to the window's size, one gap in from its edges, on the accent, holding the controls row, the two regions and, in ov, the status line. It is the app's whole drawn area. Eight lines in four files carry the class.

**Names that fit, best first.**

1. `.app` — says what the div is: everything the app draws. index.html already mounts at `#app`, so this div is `#app`'s one child, the same thing named twice, id and class. Plain, no other sense in the code.
2. `.outer` — says where it sits: outermost. Says nothing about what it holds.
3. `.whole` — the whole app on screen. Plain, unused anywhere.
4. `.edges` — it sits at the window's edges. Says the placement, not the thing.

**Names that are out, and why.** `.main`: the lexicon says never main. `.page`: a hit-target kind in ov's code. `.root`: the css document root. `.body`: the html element. `.box`: ov's regions are the boxes, `.boxes` is their row. `.screen`: ov's lexicon says screen for the files list and the editor. `.shell`: rejected 7 September.

**Cost.** Eight code lines, four checks, four memory mentions. No lexicon entry for `.app`, since it is the id's own word.

**Open.** Whether the div is needed at all, or its styles go onto `#app` itself, which would end the question. That is a structure change, not a rename, and is not weighed here.

## learn files: one path that exists (9 September 2026)

Proposal — CLAUDE.md names a per-project learn file at `zone/work/now/learn.md`. No project has one. Two learn files exist: shared's at `zone/work/learn.md` and di's at `zone/work/ai/learn.md`. The `learn` shorthand says add it to learn and names no path.

**Decided 9 September 2026, Jonathan's way, not the one below.** A project's learn file is `memory/<X>/zone/learn.md`, made the day it is first needed. Every project's CLAUDE.md points to it. Built: shared's and di's files moved there, the root CLAUDE.md, eleven project CLAUDE files, the shorthand row and every link re-pointed.

**The fix, as first proposed.** One rule: a project's mistakes go in `memory/<X>/zone/work/learn.md` where that file exists, and in shared's otherwise. Three edits: CLAUDE.md line 43 names that path and says where one exists. di's file moves from `work/ai/` to `work/`, with its links re-pointed. The shorthand row names both homes.

**Not the fix.** Making an empty learn file in every project. A file with nothing in it is a guess.

**Success criteria.** Every path CLAUDE.md names exists. The learn shorthand has one place to write for any project.

**Cost.** One line in CLAUDE.md, one git mv, one shorthand row, the links into di's learn.

**Open.** The question in zone/questions.md that learn has no home is half this one. Whether the twenty-entry distill count applies per file or across all of them.

## big picture (9 September 2026)

Proposal — a script writes `memory/shared/zone/big picture.md`: one line per memory file that holds unfinished work, across every project. A shorthand runs it.

**The row.** One table per project, under its own heading, three columns: z/t, file as a link, verb. Root files carry no letter. Two examples: `| z | [ideas.md](../../ai/zone/ideas.md) | 34 open |`, `| shared-t | decisions.md | decide 3 pacs |`. Decided 9 September 2026, from bullets.

**The counts, one pattern each.** Robust means grep, not reading. A file gets a line for each nonzero count, joined with "and".

| file | pattern | verb clause |
| --- | --- | --- |
| any .md | lines starting with a dash and an empty checkbox | N open |
| decisions.md | pac bullets without "Decided" | decide N pacs |
| proposals.md | `##` sections without "Decided" or "dead" | decide N proposals |
| questions.md | list lines | answer N questions |
| log.md | lines starting with a dash, after the consolidated marker and before any rule, S: and D: lines left out | settle N lines |
| learn.md | raw-log entries `- N.` | distill N entries |
| collisions.md | `##` entries | rewrite N collisions |
| drive.md | the file exists | dissolve the drive |

**The script.** A python file in `tools/`, named in the write that makes it, about sixty lines. It walks `memory/*/`, applies the table, writes the file whole with today's date, and prints the line count. No judgment anywhere in it.

**The shorthand.** `big picture` — run the script, reply with the count of lines and the file's path.

**Success criteria.** The file lists every file that any pattern hits and no other. Running it twice writes the same file. A new project appears the day it has an unchecked box.

**Cost.** One script, one shorthand row, one test that feeds it a made-up project folder.

**Decided.** The file sits in shared's zone. A truth with unchecked boxes is a finding worth its own verb.

**Built 9 September 2026.** `tools/big-picture.py` and `tools/test_big_picture.py`, thirteen checks passing. The truth verb is "N open truths". The shorthand row is in shorthand.md. Folders named archive, done and logs are skipped. Renamed unfinished 13 September 2026: the file, the shorthand, the script and its test.

## panel into ov, and the duplicated originals out (7 September 2026)

Proposal — ov takes panel as its own, and what ov holds that panel now holds too goes.

Reading (3) is dead, 7 September 2026: panel imports core, not the other way. Nothing of panel moves into core.

**What is duplicated, counted.** ov's four — App 264 lines, Controls 489, Details 173, Operation 53 — against panel's four — 119, 69, 36, 22. What panel holds is what ov's four hold in common with every host: the `.app` div and its width arithmetic, the cursor fed to the hits manager, the hint, the hamburger and its styling, the two regions' wrappers and their styling — panel's 246 lines, of which ov's are the originals. The other 980 lines of ov's four are ov's own: the dispatcher's polling and restart, the four colors read from preferences, the command and option keys, the build notes, the status line, the launch states, the editing tools, the details sections, the switch among report, edit and browse.

**Three readings of "incorporate", and they differ.**

1. ov rewrites its four so the lines are panel's, word for word, and ov's own sit inside them. Nothing is shared; four versions of panel remain — ov, panel, mu, mj — and the duplicated originals are ov's old frame lines, gone in favor of identical ones. ov gains the centered name and a shape matching the other three, at the cost of four files rewritten for no change on screen
2. panel becomes a library: panel is one component with the controls row, the details column, the content box and a foot as snippet slots, a prop saying whether details shows, and the toggle handed back; ov, mu and mj take it through an alias for panel, as `core` is one for core, and a second bridge, and their four files shrink to fillings. Every host's own version of panel goes. But a second alias means a second entry in tsconfig, vite.config and, for ov, vitest.config; a second bridge beside Core.ts; and ov's `core_alias.test.ts`, which expects exactly two files to name the alias, gains a twin or fails. The adopting-core rules would each need a second reading
3. panel moves into core as the one component core's pac of 7 September weighs — the same component as (2), one alias, one bridge, no new rule — and ov, mu, mj and panel each host it; panel keeps a twenty-line App as the smallest host. Every host's own version goes the same way as in (2).

**Success criteria, for (2) or (3).** panel as one component, in one place. ov's App.svelte holds only what is ov's; its Controls, Details and Operation are fillings handed to it as snippets. mu, mj and panel hand theirs the same way. ov's 336 tests, its check, and the three hosts' checks pass; ov draws exactly as it did — measured, not reasoned.

**What reads it.** For (3): core's `svelte/support` and its index, `adopting core.md`'s steps, each host's Core.ts (one line), each host's App.svelte, and ov's Details, Controls and Operation as they lose their wrappers. For (2): the same, plus three config files per host, a second bridge, and the one-bridge rule with its test.

**Cost.** (1): four files rewritten in ov, nothing else. (3): one core component of about panel's App, the component's own shape (four snippets, one prop, one callback), four hosts' App.svelte rewritten around it, ov's three regions unwrapped — and ov's screen checked pixel by pixel after. (2): (3)'s cost plus the second-library machinery.

**Open.** Which reading is meant? If (2) or (3), where does ov's status line go — a fourth slot below the boxes, or ov's own, outside the panel component? And is panel then a project, or the name of a component?

## panel into mu and mj (7 September 2026)

Decided and built 7 September 2026: way (1), both hosts. mu and mj each hold their own version of the four files, mj on its own paths; both check clean at 411 files and build. The first open question is answered — mj took it too; the second, whether panel remains, is now panel's own question. Superseded 10 September 2026: mu and mj import panel through their own `Panel.ts` and hold no version of its files.

Proposal — mu and mj each take panel's four components as their own starting shape, and grow their own flesh inside it.

**Success criteria.** mu and mj each open on what panel draws — the controls row with its hamburger, the details column, the content box — with their own name in the content box, and `yarn run check` clean in each. Two hosts then draw ov's three regions, which is the test core's pac of 7 September says a library cut should wait for.

**What each host takes.** panel's `App.svelte` (the `.app` div, its width arithmetic, the cursor fed to the hits manager, core's default colors pushed onto the page), `Controls.svelte`, `Details.svelte` and `Operation.svelte`, as its own files under `svelte/main/`; the eight lines panel's `Core.ts` has beyond the three both hosts already hold — Colors, S_Mouse, Point, hit_target, hits, the tooltip's two, Hamburger and ToolTip; and, for mj alone, the `core/main.css` import its `Main.ts` lacks. mu's App.svelte already sits under `svelte/main/`; mj's sits at `svelte/App.svelte` and its entry file is `Main.ts`, so either mj takes panel's paths or panel's files take mj's.

**What the flesh is.** mu's is written: its goal reads "ov's structure, with tags and kinds swapped for metadata" — the details column holds the filters (artist, album, alphabet), the content box the list and the player. mj's is not written: its one open question is what it is for.

**Two ways, and they differ.** (1) Each host takes its own version of the four files and changes them freely — three of the same 200-line panel in the repo, each drifting, which is the duplication the core adoption spent a week removing. (2) panel is cut once — the one component the core pac names as its first middle path, the three regions as snippet slots — and mu, mj and panel each host it; panel is then the proving ground and the smallest host. (1) can be done today. (2) waits on the pac's decision, and reads better with two real hosts to read the bone from — which (1) supplies.

**Cost.** (1): four files and eight Core.ts lines per host, mj's css import, one check each — no core change. (2): the pac's cost — one core component of the sixty lines App.svelte holds, three call sites, three blocks of styling.

**Open.** Does mj take panel now, before it knows what it is for — the shared principle says nothing speculative — or only mu, with mj following when its purpose is written? And once mu and mj carry panel, does panel remain, a template with no app of its own?

## a logs/ folder inside each memory project (7 September 2026)

Decided and built 7 September 2026: the four judgment calls answered — move the three old-named logs, move core-docs.log, delete s3's two, leave the eleven unmatched files at `mono/logs/` for now.

**Success criteria.** Each memory project's own log lives at `memory/<project>/logs/`, `git mv`'d from `mono/logs/`, history kept. `.gitignore`'s existing `**/logs/` line covers the new location without a change. `servers.sh`, `dispatcher.py` and every app's own debug logging write to the new place; a fresh page load writes a fresh log where co looks for it. Cross-project and infrastructure logs stay at `mono/logs/`, since they belong to no one project.

**What moves — 22 files, clean project match.**

| project | files |
| --- | --- |
| di | di.log, di.debug.log, di-docs.log |
| ji | ji.log, ji.debug.log |
| ov | ov.log, ov.debug.log |
| lv | lv.log |
| mj | mj.log |
| ma | ma.log, ma-docs.log |
| ga | ga.log |
| ws | ws.log, ws-docs.log |
| core | core-docs.log |
| di, ji, ga, ma, ws | update-docs.error.\<project\>.log, one each |

**What reads them, and changes with the move.**

1. `tools/hub/servers.sh` line 8, `LOG_DIR="$GITHUB_DIR/logs"` and line 127's `logfile="$LOG_DIR/$name.log"` — one fixed folder for every server today; becomes one per project, `memory/$name/logs/$name.log`, for the thirteen named in `SITES` (di, ji, ov, lv, mj, ma, ga, ws and their docs variants) — `hub` and `mono-docs` are not a memory project and stay at `mono/logs/`.
2. `tools/hub/dispatcher.py` — the four `os.path.join(GITHUB_DIR, 'logs', ...)` calls: `rebuild-status.txt`, `restart-status.txt`, `tests-status.txt` and `dispatcher-restart.log` are the dispatcher's own status, no project — stay. Line 737's `log_path = os.path.join(GITHUB_DIR, 'logs', f'{where}.log')`, the `/save-log` route every app's own debug logging writes through, needs to know which project `where` names and write to that project's `memory/<project>/logs/` instead.
3. `memory/shared/truth/conventions.md`'s response rule 5, "Every app writes its own into `logs/`" — becomes "into `memory/<project>/logs/`".
4. Each app's own debug logger (`core`'s `debug.log`, adopted by every host through `Core.ts`) — reads whichever path the dev server hands it at build time; unread whether that path is already a build-time constant per project or hardcoded to `logs/` inside `core` itself.

**Judgment calls, as decided.** Move the three old-named logs (`designintuition.log`, `dimensionals.log` to di; `intersection.log` to ji). Move `core-docs.log` to `memory/core/logs/`. Delete `s3.log` and `update-docs.error.s3.log` outright, s3 being gone entirely. Leave the eleven unmatched files at `mono/logs/` for now.

**Cost.** Thirteen `git mv` (the twenty-two files, several projects taking more than one), three script edits (servers.sh, dispatcher.py, conventions.md), and the four judgment calls above settled one way or the other before the move, so it happens once.

**Where it is now.** Built. `.gitignore`'s `**/logs/` line already meant none of these files were ever tracked by git, so the move was a plain `mv`, not `git mv` — no history to keep. `tools/hub/servers.sh`'s `start_site` now picks a project's own `memory/<dir>/logs/` when `dir` names one, the shared `logs/` folder otherwise; `tools/hub/dispatcher.py`'s `/log` route and `DOC_ERROR_LOGS` do the same, keyed off the name a write or a project asks for; `tools/docs/update-project-docs.sh`'s per-project error log follows the same rule. `memory/shared/truth/conventions.md`'s response rule 5 reads `memory/<project>/logs/`. A live write to `/log?where=ov.debug` confirmed it reaches `memory/ov/logs/ov.debug.log`; ov's 336 tests, svelte-check and the dispatcher's 32 tests all pass.

## a shorthand for cleanup after moving files inside memory (7 September 2026)

Decided and built 7 September 2026: the row below is live in [shorthand.md](../truth/shorthand.md).

**Why.** Three moves today did the same five things by hand: the notes folders into `memory/<project>/notes/`, the pre-flight files into truth, the guides subfolders into truth. Each time: `git mv`, a link pass, a set of known readers fixed one by one, the tests run, the move logged. Naming the steps once means they run the same way every time, and none is forgotten.

**What triggers it.** Jonathan says `cleanup` right after moving or renaming files or folders inside `memory/` — by hand, by `d:`, or as the last step of a bigger move already done.

**What it does, in order.**

1. Re-point every relative link the move broke: resolve each against the file's OLD place, and only rewrite it if it names a real file there and the new place has one too — a link already dead, before or after, is left alone.
2. Fix every reader that names the old path by hand: `CLAUDE.md`, the hooks in `.claude/hooks/`, `shorthand.md`, `keywords.md`, `gates.md`, the project's own maps, and its `index.md` catalog.
3. Remove what the move leaves empty: an index file with nothing left to index, a folder with nothing left in it.
4. Run what exercises paths — `yarn vitest`, `yarn svelte-check`, the dispatcher's own test — and fix a failure the move caused, one at a time.
5. Log it: one `D:` line naming what moved, what got re-pointed, and what still needs a hand — in the project's own log, and in shared's too when the move crosses projects.

**Proposed row, for `shorthand.md`'s Instructions table:**

| `cleanup` | after files or folders move inside `memory/`: re-point every link the move broke, resolved against its old place, never one already dead; fix `CLAUDE.md`, the hooks, `shorthand.md`, `keywords.md`, `gates.md`, the project's map and index; drop what the move emptied; run vitest, svelte-check and the dispatcher's test, fixing what broke; log it with one `D:` line naming what moved and what still needs a hand |

**Evidence this is the real pattern, not a guess.** Today's three `D:` lines under [7 September 2026](../logs/log.md) in this project's log say it each time, in the same order: the notes move, the pre-flight fold, the guides-subfolder move.

**Open.** Whether it also throws away a folder's leftover `.DS_Store` and calls `rmdir`, which today's three moves all did by hand.

## the notes folders move into memory (7 September 2026)

Decided and built 7 September 2026. Mono's own `notes/` followed the same day into `memory/shared/notes/`; `notes/tools/` became `tools/` at the top of the repo, and `notes/` is gone. Every reader below is re-pointed and both test suites pass; the shared log holds the account. Waits only on Jonathan's word to dissolve.

**Success criteria.** Every project's `notes/` folder except mono's sits at `memory/<project>/notes/`, whole, with git history kept by `git mv`. No project keeps a `notes/` folder of its own. Every link into a moved folder resolves — the dead-link report finds no more than it found the day before. ov lists the same files under the same projects, memory files answering to their projects as they do now. The hooks and the two CLAUDE files that read the old paths read the new ones. svelte-check and the tests pass where the paths are code.

**What moves.** Twelve folders, 419 markdown files: core 29, di 161, ga 13, gallery 7, ji 40, lv 7, ma 10, me 3, ov 29, project template 1, s3 20, ws 99. Four of the twelve are projects with no memory folder yet — ga, ma, s3, project template — so those folders are made first.

**What reads the old paths, and changes with the move.**

1. `CLAUDE.md` line 38, `<X>/notes/work/`, and the nine project CLAUDE files that name a `notes/` path: ji, core, me, di, lv, project template, ws, ov, s3.
2. Six hooks in `.claude/hooks/`: inject-always, plain-english-check, banned-words-check, test-always-tag, display-fix, and the two jsonl records they write — inject-always builds `$REPO/$PROJECT/notes/guides/pre-flight/banned words.md` and scans `*/notes/guides`.
3. ov: Saving.ts, which builds a file's path as `<notes>/guides/...`; File.ts's closed tag list; the dispatcher at `tools/hub/dispatcher.py` and its test; the maps in every project's truth folder, which link into notes/.
4. Sixty-eight links across memory and the notes folders point into a project's notes folder.

**What it reverses.** The handbook's inception rules "pull, don't push; never bulk-import" and "journals and handoffs stay behind in place", rewritten 7 September 2026.

**Cost.** Twelve `git mv`, four new memory folders, the path readers above, and one re-pointing pass over the links, measured by the dead-link report.

**Open.** Nothing. The inception rule now reads: a moved folder is still the old notes; write nothing new into it.

## life cycle (30 August 2026)

Proposal — the flow from any idea to truth, five stages, each with one file, nothing waiting anywhere else:

1. Born: a paragraph in zone/ideas.md, or just an `I:` line. Zero ceremony.
2. Weighed: pac grows that same entry in place — For, Against, deciding question. The idea and its evaluation are one thing; nothing moves.
3. Waiting: the deciding question alone goes to questions.md, one line linking the entry. Start reads it every session, so no idea rots unseen.
4. Decided: d — edit the owning truth to state what now holds, one `D:` log line, strike the question, delete the zone entry; one line of why in decisions.md per its own law; a case in cases.md when it teaches.
5. Settled: settle commits; git keeps the full argument forever.

Closes the four doors: pacs live in zone with the ideas they weigh, questions.md holds every wait as one line, decisions.md returns to decided one-liners, unresolved.md is never born.


**September 10, 2026** (mj) The idea "create mj (gallery of girls) -> mj.jonathansand.me" is done and comes off ideas.md. mj is built and lives at mj.jonathansand.me: a view-only site, its base directory `mj` on Netlify, a CNAME at Dynadot, a certificate issued. The site is a host of panel and gallery, one picture at a time filling the operation view, preferences in the details column, editing only where the technical switch is on.

**July 10, 2026** (mo) Three build and hub fixes. **Hub deploy-status tooltip** was frozen on "Loading…": the relative-time helper used its variables before declaring them, so it threw on any real timestamp — and a silent catch hid the error. Reordered the declarations and made the catch log, so a render crash surfaces instead of hiding. **uuid types** — removed the deprecated `@types/uuid` stub from five workspaces (di, ji, lv, s3, ws); with no tsconfig setting an explicit types list, TypeScript auto-loaded the empty stub and failed with TS2688. Real uuid self-types, so nothing broke. **di-docs deploy** — its VitePress build failed on ~200 Obsidian-style dead links across `work/` and `guides/`; turned off the dead-link check in di's config. Local build passed and the Netlify deploy went green. Two small hub tweaks: the status-time now reads `(155d)` instead of `-155d` (parentheses, not a leading dash), and dropped ma's four Netlify keys from `ports.json` so ma and ma-docs no longer show in the deploy tooltip or get polled (the actual Netlify sites still need unlinking in the dashboard).

**July 8, 2026** (mo) Hooks overhaul. Ended the doubled-reply problem: the reply-checking Stop hooks (banned words, conciseness, disclaimer, citation, phrase) are now warn-only — they log to `log.jsonl` and never reject, since a reject regenerates the reply and shows it twice. Hard banned words instead get rewritten on screen by a new MessageDisplay hook (`display-fix.sh`). Confirmed via the docs helper that Claude Code has no built-in banned-words feature and the doubled reply is unavoidable when a Stop hook rejects. Rewrote the hooks guide — added the MessageDisplay event, the real output fields, a "doubled-reply trap" section, and an inventory of all 18 live hooks. Moved the guide from `tools/` into `collaborate/` (so it loads every session), fixed all references, refreshed the synopsis assessment.

**February 18-19, 2026** (di) **Milestone 17** — SO Library. Library panel in details: bundled defaults via glob import, user-created files in IndexedDB. Click loads, option-click inserts as child. Save writes IDB + downloads backup file. Reorganized details UX — unified slot padding, disabled cells use accent color, moved add-child to far right, moved show/hide back to name-row. Reset preferences button (clears localStorage except scene/library). (mo) Guide reorganization — inserted `simplicity.md` into `workflow.md` and `motive.md`, moved co discipline rules (approval gate, implementation, debugging, refactoring, file ops) from `workflow.md` to `chat.md`, moved origin story and philosophy to `motive.md`. Updated cross-references in `gates.md` and `kinds.of.tasks.md`.

**February 15-17, 2026** (di) **Milestone 16** — Formulas. Alias resolution (`x` → `x_min`, `w` → width), bare attributes reference self, dot-prefix references parent (`.x`), cross-SO references (`A.x`). Empty formula defaults to `parent.attribute + value`. Invariant attributes derive from other two in axis (`x = X - w`). Fixed compound imperial parsing (`1 1/2"`), value display, invariant persistence bugs. Simplified serialization encoding. Improved slider UX.

**February 14, 2026** (di) **Milestone 15** — Attributes. Nine-row attribute table (x, X, w, y, Y, h, z, Z, d) with formula and value columns. Three-row orientation table (axis angles). New `Axis` class. File encoding v3. Invariant column and locked rotation. Major cleanup — simplified encoding/storage, removed cruft. Details cosmetic tweaks, enumerations for T_Details and T_Layers.

**February 11-13, 2026** (di) **Milestone 14** — Details and editing polish. Segmented control for face selection. Rotation confined to single axis, composited quaternions. Pixel-perfect canvas editing — 2D snap, rotation snap, face labels, improved dimensional occlusion. Better 2D mode.

**February 9-10, 2026** (di) Import/export. Accent color picker. Better selection UX — drag corners/edges and rotate working well. Improved 2D mode, simplified Coordinates.

**February 8, 2026** (di) Face intersection lines — compute dihedral intersection for SO pairs that don't share axes. Cross product for line direction, Cyrus-Beck clipping for endpoints. Cruft cleanup — converted singleton functions to singleton classes, fixed mixed bugs. (mo) Distilled learn.md — 10 raw entries cleared, 3 new pitfalls added (observe before speculating, no abbreviations in code, "here" means chat output).

**February 7, 2026** (di) **Milestone 13** — Algebra engine, phases 1–4. Recursive descent compiler: tokenizer handles unit literals (6", 5', 2.5 mm) and SO references (wall.height), parser respects operator precedence. Forward eval, reverse propagation, cycle detection. Constraints module wired into Editor — formula on an attribute triggers eval, commit triggers propagation. Phase 4: orientation — fixed vs variable children. Fixed: rotate sets quaternion, origin stays put. Variable: endpoints track parent bounds, angle recomputes from geometry. 377 tests passing.

**February 6, 2026** (di) **Milestone 11** — Units. All dimensions stored in mm, displayed per user preference. 22 units across 4 systems (imperial, metric, marine, archaic). Imperial gets fractional display (5 1/4") and compound formatting (5' 3 1/4"). Inline dimensional editing — click a dimension label, type a value, Enter applies. Parser accepts any format regardless of current system. **Milestone 10** — Controls UI. Scale slider with logarithmic mode, compound slider (ported from ws), vertical/horizontal steppers, scale value display. Unit system switcher, precision segmented control (imperial: 1/2 through 1/64; metric: 0–3 decimals), 2D/3D toggle, straighten button. Scale SOT moved to Svelte writable store.

**February 5, 2026** (di) **Milestone 9** — Persistence. JSON serialize SO state (bounds, orientation, scale) + camera (eye, center, up). Auto-save to localStorage on drag, restore on load, reset button. **Milestone 12** — Hierarchy. Multiple named SOs with parent/child relationships. Name input in details, SO selector buttons, face labels on front-facing faces. Add child: smallest parent dimension ÷ 2, axes aligned. Cruft audit — catalogued unused code, redundant coordinate methods, over-engineered debug logging, scattered stores. Tagged "leave alone" items.

**February 4, 2026** (di) **Milestones 6–8**. Build Notes (M6) — structured progress tracking overlay with steppers and close button. Edit Drags (M7) — bounds-based geometry (6 values instead of 8 vertices), drag edges/corners confined to selected face plane, ray-plane projection for world-space deltas. Dimensionals (M8) — three algorithms: silhouette edge detection (A), witness plane via screen-space perpendicularity (B), crunch detection with projected text gap (C). Editable dimension text — click, type, Enter updates geometry with symmetric resize. (mo) Guide system refinement. Compressed `always.md` from detailed rules to 5-line checklist. Renamed `always.longer.md` → `pitfalls.md` (edge cases that cause mistakes). Created `tools.md` for tool-specific gotchas (write_file vs create_file, tool cycling on failure). Added `pitfalls.md` to session-start pre-flight and keyword triggers for "rename", "doesn't exist", "not found", "which one".

**February 3, 2026** Created `me/` project — third mono project alongside ws and di for ideas, research, creative exploration. Hub app: added `me` button (J), renamed `mono`→`mo` (M), auto-switch mode when clicking projects without config (app+mo→docs, docs+me→app), renamed md→resume button (R), consolidated all URLs into ports.json (single source of truth), simplified initConfig to build from ports.json. Cross-project links: implemented comment-based approach for Obsidian/VitePress compatibility (`[text](relative) <!-- @project/path -->`). Added `.env` config file support to dispatcher. Reorganized work files: renamed feedstock→adapt, merged guidance-journal into journal. (di) **Milestone 5** complete — integrated Hits_3D into main Hits manager: RBush 2D first, 3D fallback for Smart Objects.

**February 1, 2026** Hub app updates. Tests button with `;` shortcut runs both ws and di tests. Deploy status tooltip fix for missing Netlify token. Title buttons turn green while working, status dot repositioned behind "Mono" title, deploy status skips canceled builds. Button renames: localhosts → hosts, dispatcher → relay.

**January 28, 2026 (ws)** Selection fixes: shift-click on multiply-selected now deselects all, deselect-all no longer selects root, breadcrumb click changes focus AND level, radial mode focus change selects the focus, background click deselects all, rubber band fixed.

**January 28, 2026 (afternoon)** Netlify deployment fixes. Fixed base directory paths, added nohoist for Svelte version isolation, removed unused packages from ws. WS notes reorganization — moved architecture/ and collaborate/ to guides/. Fix-links path similarity scoring. Update-docs skip-if-unchanged logic.

**January 28, 2026** Guide system overhaul. Created pre-flight folder with gates.md, keywords.md, kinds.of.tasks.md, shorthand.md, workarounds.md. Slimmed CLAUDE.MD from 83 → 57 lines. Hub app refinements: deploy status tooltip, status dot, simpler docs rebuild progress. Retention test created — 5 probes to measure guide effectiveness.

**January 21, 2026** Created `guides/collaborate/gating.md`. Documented the discovery that lessons acknowledged mid-conversation don't reliably stick. Identified the SKILL.md pattern from Claude's system prompt as a working solution. Core insight: ambient context is available but not active — principles need to be **gates** (checkpoints Claude must pass through before acting).

**January 18, 2026** Checkbox plugin complete. Journal system established with format rules. Code analysis discipline added to chat.md — verify return types, trace call chains, quote signatures.

**January 17, 2026** Created journal, added `[+]` checkbox support across all VitePress sites. Built custom markdown-it plugin (`sites/markdown-it-task-list-plus.mts`) that transforms `[+]` into orange checkboxes with "?" — for "fixed but awaiting review" state.

**January 17, 2026** Fixed **MCP** connection issue in Claude Desktop. Root cause: npm prefix pointed to `.nvms` while node binary lived in `.nvm` — a split configuration I didn't know I had. When Claude Desktop launched the filesystem server via npx, it started with node v20 but subprocess calls found v14 in PATH, which crashed on modern syntax. **Solution: bypass npx entirely**, call node directly with full path to the installed module.

**January 15-16, 2026** WS bug fixes: levels slider wasn't updating graph (added `$w_depth_limit` to reactive trigger), color picker hover interference (new store to track picker state, suppress mouse events while open), text selection showing during drag (global `user-select: none`). Also styled indeterminate checkboxes in VitePress docs.

**January 14, 2026** Built single-line progress display for the dev hub. Now shows one updating line: "Step 3/7: Building docs..." with `\r\033[K` trick. Added live console to hub that polls status files. Discovered calling `servers.sh` from Python killed the API mid-process — switched to direct process management. Started cleanup audit — found stale paths and TOCs out of sync.

**January 12, 2026** Finished **monorepo** migration (Phase 3). Used `git subtree add` to pull in ws, di, shared, enhanced with history. Discovered subtree doesn't preserve per-file history. Attempted Phase 4: extract `Extensions.ts` to @work/core. Hit circular dependency wall in ws — reverted.

**January 11, 2026** Planned the **monorepo**. Four repos with duplicated code, separate node_modules, scattered docs. Key decision: yarn workspaces, single git repo (not submodules), `@work/core` for shared code.

**January 9, 2026** Started the hub app — browser-based dashboard for managing local dev servers. Defined port assignments, keyboard shortcuts, UI components.

**January 8, 2026** Wrote `pacing.md`. This project moves differently than webseriously — faster AND easier. The gap between thinking and seeing has collapsed. Pushed "enhanced" template to GitHub. Phase 1 of **commoditize** complete.

**January 8, 2026** (di) **Milestone 4** — Hits Manager. Ported the hits manager from ws. RBush-based hit detection with hover, click, long-click, and double-click handling.

**January 5-8, 2026** (di) **Milestone 3** — Document Publishing. Dual Netlify deployments: docs.designintuition.app (VitePress) and designintuition.app (main app) with SSL.

**January 6-7, 2026** (di) **Milestone 2** — Panel Layout. Clean panel layout with rounded-corner regions, separators, and fillets. Svelte 5 runes throughout.

**January 4-5, 2026** (di) **Milestone 1** — Solid Foundation. Created the project. Vite + TypeScript + Svelte 5 from day one. Built quaternion POC: two nested cubes rotating independently, wireframe rendering with depth-based opacity. Established the manager pattern (Scene, Camera, Render, Input, Animation). Dev environment, testing infrastructure, collaboration workflow system.

**December 2025** (ws) Builds 182-183. Finished show children counts as numbers in reveal dots. Fully wired dynamic/static focus control. **Installed VitePress** for documentation website. Massive documentation reorganization.

**November 2025** (ws) Builds 179-181. New Styles manager centralizes all color computation. Finished breadcrumbs history navigation. Major store refactoring: moved writables from Stores to UX.

**October 2025** (ws) Builds 177-178. **"Mouse responder is dead!"** — eliminated the old mouse handling abstraction entirely. Fully isolated mouse logic within hits manager. **Claude Code collaboration begins** — created CLAUDE.md, first PRs from claude branches.

**September 2025** (ws) Builds 173-176. **New hover system completed** — adopted RBush spatial index for hover detection. Renamed hover manager as hits. Curved cluster titles in radial.

**August 2025** (ws) Builds 170-172. Major refactor: `isOut` → `isHovering` with nearly perfect app-wide hover behavior. Enforce radial view for Bubble embed mode.

**July 2025** (ws) Builds 162-169. Fixed editing/layout/color/hover bugs, added print utility. Built super-fast search. Prepared Bubble plugin for production.

**June 2025** (ws) Builds 150-160. Peak month — 153 commits. **Started Bubble.io plugin**. **Finished rubberband selection** — command-drag to select multiple, works in both tree and radial.

**May 2025** (ws) Builds 141-149. Brand new Details view with hideables. Tags table reads from Firebase. Depth limit fully wired to graph with relayout. Hover indication working everywhere.

**April 2025** (ws) Builds 135-140. Wired all tools buttons. Started CSV import work. Reorganized Details to always show title.

**March 2025** (ws) Builds 133-134. New panel layout with box around controls and breadcrumbs. Gull wings (quarter-circle SVG arcs) at line intersections.

**February 2025** (ws) Builds 130-133. Completed new Ancestry-centric architecture — ancestry now owns its G_Widget. Much cleaner rings UX in radial mode. Added bidirectional relationship lines.

**January 2025** (ws) Builds 125-129. Fixed thing ID translation during import. Major refactor: rewrote S_Title_Edit using Mouse Responder pattern. Ancestry-centric architecture work begins.

**December 31, 2024** Tested MCP filesystem access. Despite intermittent "Server disconnected" errors, `Filesystem:list_directory` returned full directory listing.
