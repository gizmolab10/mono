---
kind: analyze
title: "Proposals"
description: "shared proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, proposal, weighed]
date: 2026-08-31
---
# Proposals

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

**The row.** One table per project, under its own heading, three columns: z/t, file as a link, verb. Root files carry no letter. Two examples: `| z | [ideas.md](../../ov/zone/ideas.md) | 34 open |`, `| shared-t | decisions.md | decide 3 pacs |`. Decided 9 September 2026, from bullets.

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

**Built 9 September 2026.** `tools/big-picture.py` and `tools/test_big_picture.py`, thirteen checks passing. The truth verb is "N open truths". The shorthand row is in shorthand.md. Folders named archive, done and logs are skipped.

## fewer words, same facts (8 September 2026)

Proposal — one rule for Always, and a hook that counts.

**The fault, measured.** One D: line from today: "bridge freed from Configuration's sense first: core's own comment, both goals truths, ov's map and startup line, the entry files of lv, mj, mu and panel, and mu's and mj's operation views now say pushes onto the page." 43 words, one sentence, one fact. The same fact: "Eleven places called Configuration the bridge. Now they say it pushes onto the page." 15 words.

**Where the words come from.** Four habits, each visible in that line. A dash that hides a second sentence. A name followed by its description, when the lexicon already holds the description. A list of every file touched, when a count and git would do. A reason nobody asked for, hung on with "since" or "so that".

**The rule, for Always.** State. Does a sentence bend — a dash, a "since", a name followed by what it means, a list where a count would do? Cut it in two, or cut the second half. One fact per sentence. A thing with a name gets its name and nothing after it.

**The hook.** conciseness-check.sh already runs on every reply. It gains two counts: sentences over 25 words, and dashes per sentence. Over the cap, it reports the sentence. The same counts run on every D: line written into a log.

**The caps.** A sentence: 25 words. A D: line: one sentence. A reply: one sentence per fact, no restating.

**Success criteria.** Every reply and every log line passes the hook. Jonathan reads a week of log lines without asking what one means.

**Cost.** One rule, about thirty lines of shell, one test case.

**Open.** Whether the pac format, one paragraph per pac, keeps its length or takes the same cap per part.

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

Decided and built 7 September 2026: way (1), both hosts. mu and mj each hold their own version of the four files, mj on its own paths; both check clean at 411 files and build. The first open question is answered — mj took it too; the second, whether panel remains, is now panel's own question.

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

**Evidence this is the real pattern, not a guess.** Today's three `D:` lines under [7 September 2026](../log.md) in this project's log say it each time, in the same order: the notes move, the pre-flight fold, the guides-subfolder move.

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

## proposal: the hooks do not reach this session (27 August 2026)

Resolved 7 September 2026: the hooks read `truth/` — conventions.md (always, response and the banned words folded in), agency.md, lexicon.md, and each project's `truth/banned words.md`. The open question below is answered the second way: always.md moved into the memory system, as a section of conventions.md, and the hook follows it there.

I broke the "stands" rule the day after it was written. I first blamed my memory. Reading the hooks says otherwise.

**What already exists.** `mono/.claude/hooks/` holds a working enforcement apparatus, aimed at exactly this problem:

- `inject-always.sh` runs on every prompt. It pushes `memory/shared/notes/guides/pre-flight/always.md` into the session whole, every single turn, plus one more file per turn in rotation — response, agency, lexicon, the project's banned words. It also checks that every file wearing the `always` tag is actually being sent, and complains when the labels lie.
- `banned-words-check.sh` runs when a reply finishes. It reads the banned-words table as its only authority, generates plural and past forms, and blocks the reply. A row with an empty Meaning column is a hard block; a row with a Meaning is a sense check — it blocks once and asks me to judge. Retries are capped so it cannot loop.
- Four more finish-the-reply checks beside it: conciseness, phrases, diagnostic citation, murk count. Plus `plain-english-check.sh` on every file write.

**Why it did not stop me.** Two gaps, and neither is about remembering.

1. **None of it runs here.** These hooks are Claude Code hooks on your Mac. This is a Cowork session in Anthropic's cloud; it never executes them. The proof is in the hooks' own logs: `log.jsonl` and `murk.jsonl` were last written on 24 August at 19:00, and every turn we have worked since has been in this session. Four days of replies passed no check at all.
2. **Where they do run, they read the old notes.** The rotation names `memory/shared/notes/guides/pre-flight/` files only. `memory/shared/truth/conventions.md` is in no rotation and no table. The rule I broke does exist in the banned-words table — `stand, stands, standing, stood → remain, unchanged` — as a sense check, not a hard block. So even on the Mac it would have asked me to judge rather than refused.

**What follows.**

- The enforcement gap is not a missing hook. It is that half our work now happens where hooks cannot run. Any rule that must hold in every session has to live somewhere both session kinds read — which today means CLAUDE.md and the memory system, not `.claude`.
- The migration (changed to inception, on 28 August 2026) has a collision to settle: the hooks' single source of truth is `memory/<project>/notes/guides/pre-flight/banned words.md` and `always.md`, both on the death list. Either the hooks are re-pointed at `memory/shared/truth/`, or those two files join shorthand.md as "stays by design". Re-pointing is the honest answer; it is your hands, since I cannot write `.claude`.
- The rows that matter — "stands", "lands" — should be hard blocks, not sense checks. A sense check asks me to judge the very thing I got wrong.

Open question: is `conventions.md` folded into `always.md` (one file, injected whole, every turn), or does `always.md` move into the memory system and the hook follow it there?
