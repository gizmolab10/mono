---
kind: analyze
title: "Proposals"
description: "shared proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, weighed]
date: 2026-08-31
---
# Proposals

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
