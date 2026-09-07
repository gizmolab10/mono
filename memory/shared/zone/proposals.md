---
kind: analyze
title: "Proposals"
description: "shared proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, proposal, weighed]
date: 2026-08-31
---
# Proposals

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
